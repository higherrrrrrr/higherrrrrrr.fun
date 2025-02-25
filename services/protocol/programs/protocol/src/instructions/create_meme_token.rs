use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, InitializeMint, MintTo, SetAuthority, AuthorityType, Transfer,
};
use crate::{
    errors::ErrorCode,
    state::{
        meme_token_state::{MemeTokenState, TokenType},
        evolution_data::{EvolutionData, EvolutionItem},
    },
    instructions::simple_amm::Pool,
};

/// A distribution instruction defines one recipient and the percentage of tokens they receive.
/// When `is_pool` is true, it represents the LP distribution. For non–LP distributions, the sum must not exceed 35%.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DistributionInstruction {
    pub recipient: Pubkey,
    pub percentage: u8,
    pub is_pool: bool,
}

/// The main handler for creating and locking a new SPL token.
/// This instruction does the following:
/// 1. Initializes the mint and mints the full supply to a temporary recipient account.
/// 2. Sets immutable evolution thresholds.
/// 3. Distributes the minted supply according to a custom distribution:
///    - For each distribution _not_ flagged as pool, tokens are transferred to the provided recipient account.
///    - The non–LP distributions must total at most 35% of the supply.
///    - The remaining tokens (i.e. LP allocation = 100 – non–LP) are assigned to the liquidity pool.
///    - If a pool distribution is provided, its percentage must equal the computed LP allocation.
/// 4. Locks the mint authority.
pub fn handle(
    ctx: Context<CreateMemeToken>,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: u64,
    image: String,
    token_type: TokenType,
    evolutions: Vec<EvolutionItem>,            // evolution thresholds (immutable)
    distributions: Vec<DistributionInstruction>, // custom distribution instructions
) -> Result<()> {
    // --- 1. Populate MemeTokenState ---
    let token_state = &mut ctx.accounts.meme_token_state;
    token_state.creator = *ctx.accounts.creator.key;
    token_state.mint = ctx.accounts.mint.key();
    token_state.name = name.clone();
    token_state.symbol = symbol.clone();
    token_state.total_supply = total_supply;
    token_state.decimals = decimals;
    token_state.image = image;
    token_state.token_type = token_type;
    // The pool field will be set below after LP distribution is processed.
    
    // --- 2. Initialize the SPL Mint ---
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        InitializeMint {
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    token::initialize_mint(cpi_ctx, decimals, &ctx.accounts.mint_authority.key(), None)?;
    
    // --- 3. Mint the full supply to the temporary recipient account ---
    let raw_amount = total_supply
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::Overflow)?;
    let cpi_ctx_mint_to = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        },
    );
    token::mint_to(cpi_ctx_mint_to, raw_amount)?;
    
    // --- 4. Lock the mint authority ---
    let cpi_ctx_set_auth = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.mint_authority.to_account_info(),
        },
    );
    token::set_authority(cpi_ctx_set_auth, AuthorityType::MintTokens, None)?;
    
    // --- 5. Initialize EvolutionData (immutable) ---
    let evo_data = &mut ctx.accounts.evolution_data;
    evo_data.owner = *ctx.accounts.creator.key;
    evo_data.evolution_count = evolutions.len() as u8;
    evo_data.evolutions = evolutions;
    msg!("Evolution thresholds set (immutable)");
    
    // --- 6. Validate Distribution Percentages and determine LP allocation ---
    // Sum up non–LP (user–specified) percentages.
    let non_pool_percent: u8 = distributions
        .iter()
        .filter(|d| !d.is_pool)
        .map(|d| d.percentage)
        .sum();

    // Ensure non–LP distributions do not exceed 35%.
    require!(
        non_pool_percent <= 35,
        ErrorCode::InvalidDistributionPercentage
    );

    // Compute the LP (pool) percentage as the remaining percentage.
    let computed_pool_percent = 100 - non_pool_percent;

    // Check if a pool distribution instruction was provided.
    let pool_instructions: Vec<&DistributionInstruction> =
        distributions.iter().filter(|d| d.is_pool).collect();

    // Verify we have exactly one pool distribution with the correct percentage.
    require!(
        pool_instructions.len() == 1 && pool_instructions[0].percentage == computed_pool_percent,
        ErrorCode::InvalidDistributionPercentage
    );

    // --- 7. Calculate token amounts and handle distributions ---
    for dist in &distributions {
        let amount = (raw_amount as u128)
            .checked_mul(dist.percentage as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(100)
            .ok_or(ErrorCode::Overflow)? as u64;

        if !dist.is_pool {
            // This is a non-pool distribution to a recipient.
            msg!(
                "Transferring {}% (amount: {}) to recipient {}",
                dist.percentage,
                amount,
                dist.recipient
            );

            let cpi_ctx_transfer = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.recipient_ata.to_account_info(),
                    to: ctx.accounts.remaining_atas.iter().find(|&a| a.key() == dist.recipient).ok_or(ErrorCode::InvalidTokenAccount)?.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            );
            token::transfer(cpi_ctx_transfer, amount)?;
        } else {
            // This is the pool distribution.
            // Initialize SimpleAMM pool with the token and SOL/WSOL
            msg!(
                "Creating SimpleAMM pool and allocating {} tokens ({}%)",
                amount,
                dist.percentage
            );
            
            let pool_key = initialize_simple_amm_pool(ctx, amount)?;
            token_state.pool = pool_key;
            msg!("SimpleAMM pool created at: {}", pool_key);
        }
    }
    
    msg!("Token distribution complete.");
    Ok(())
}

/// Creates a SimpleAMM pool and adds single-sided liquidity.
fn initialize_simple_amm_pool<'info>(
    ctx: &Context<CreateMemeToken>,
    token_amount: u64,
) -> Result<Pubkey> {
    // Define constants
    let fee_rate = 100; // 1% fee rate in basis points
    
    // 1. Initialize the pool (uses seeds to derive PDAs)
    // First calculate the bump for pool authority PDA
    let (pool_authority, pool_bump) = Pubkey::find_program_address(
        &[
            b"pool_authority",
            ctx.accounts.mint.key().as_ref(),
            ctx.accounts.wsol_mint.key().as_ref(),
        ],
        ctx.program_id,
    );
    
    // 2. Create SimpleAMM pool account
    let (pool_pda, _) = Pubkey::find_program_address(
        &[
            b"pool",
            ctx.accounts.mint.key().as_ref(),
            ctx.accounts.wsol_mint.key().as_ref(),
        ],
        ctx.program_id,
    );
    
    // Initialize LP mint
    let (lp_mint_pda, _) = Pubkey::find_program_address(
        &[
            b"lp_mint",
            ctx.accounts.mint.key().as_ref(),
            ctx.accounts.wsol_mint.key().as_ref(),
        ],
        ctx.program_id,
    );
    
    // 3. Initialize the pool with SimpleAMM CPI call
    let cpi_accounts = crate::instructions::simple_amm::InitializePool {
        authority: ctx.accounts.creator.to_account_info(),
        pool: ctx.accounts.pool_account.to_account_info(),
        token_a_mint: ctx.accounts.mint.to_account_info(),
        token_b_mint: ctx.accounts.wsol_mint.to_account_info(),
        token_a_vault: ctx.accounts.pool_vault.to_account_info(),
        token_b_vault: ctx.accounts.token_vault_b.to_account_info(),
        lp_mint: ctx.accounts.lp_mint.to_account_info(),
        fee_account: ctx.accounts.fee_account.to_account_info(),
        pool_authority: ctx.accounts.pool_authority.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    
    let cpi_context = CpiContext::new(
        ctx.accounts.program.to_account_info(),
        cpi_accounts,
    );
    
    crate::instructions::simple_amm::initialize_pool(cpi_context, fee_rate, pool_bump)?;
    
    // 4. Add single-sided liquidity to the pool
    let cpi_accounts = crate::instructions::simple_amm::AddSingleSidedLiquidity {
        user: ctx.accounts.creator.to_account_info(),
        pool: ctx.accounts.pool_account.to_account_info(),
        user_token: ctx.accounts.recipient_ata.to_account_info(),
        token_a_vault: ctx.accounts.pool_vault.to_account_info(),
        token_b_vault: ctx.accounts.token_vault_b.to_account_info(),
        lp_mint: ctx.accounts.lp_mint.to_account_info(),
        user_lp_token: ctx.accounts.user_lp_token.to_account_info(),
        pool_authority: ctx.accounts.pool_authority.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    
    let cpi_context = CpiContext::new(
        ctx.accounts.program.to_account_info(),
        cpi_accounts,
    );
    
    crate::instructions::simple_amm::add_single_sided_liquidity(cpi_context, token_amount)?;
    
    msg!("Single-sided liquidity added to SimpleAMM pool successfully");
    
    Ok(pool_pda)
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, decimals: u8, total_supply: u64)]
pub struct CreateMemeToken<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 +                // discriminator
               32 +               // creator
               32 +               // mint
               (4 + name.len()) + // name (dynamic)
               (4 + symbol.len()) + // symbol (dynamic)
               8 +                // total_supply
               1 +                // decimals
               32 +               // pool deposit (pool)
               (4 + 256) +        // image string (assumed max 256 bytes)
               1                 // token_type (enum stored as 1 byte)
    )]
    pub meme_token_state: Account<'info, MemeTokenState>,

    /// The mint account to be created.
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    /// The account that will initially receive the full minted supply.
    #[account(mut)]
    pub recipient_ata: AccountInfo<'info>,

    /// The dedicated token vault for the pool deposit (A side).
    #[account(mut)]
    pub pool_vault: AccountInfo<'info>,

    /// The SimpleAMM pool account to be created.
    #[account(mut)]
    pub pool_account: AccountInfo<'info>,

    /// The pool authority for the new pool.
    #[account(mut)]
    pub pool_authority: AccountInfo<'info>,

    /// The token vault for the SOL (B side) of the pool.
    #[account(mut)]
    pub token_vault_b: AccountInfo<'info>,

    /// The fee account for the pool.
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    /// The wSOL mint.
    #[account(mut)]
    pub wsol_mint: AccountInfo<'info>,
    
    /// LP token mint account
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,
    
    /// User's LP token account
    #[account(mut)]
    pub user_lp_token: AccountInfo<'info>,

    /// The evolution data account (created via PDA using seed "evolution_data" and the mint's key).
    #[account(
        init,
        payer = creator,
        seeds = [b"evolution_data", mint.key().as_ref()],
        bump,
        space = 8 + 32 + 1 + 4 + (420 * 80) // updated size for a maximum of 420 evolutions
    )]
    pub evolution_data: Account<'info, EvolutionData>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, token::Token>,

    pub rent: Sysvar<'info, Rent>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// Our own program (for CPI to SimpleAMM)
    pub program: Program<'info, crate::protocol::Protocol>,
    
    /// Accounts for non-pool recipient token accounts.
    /// These must be provided dynamically based on the distribution instructions.
    pub remaining_atas: Vec<AccountInfo<'info>>,
}
