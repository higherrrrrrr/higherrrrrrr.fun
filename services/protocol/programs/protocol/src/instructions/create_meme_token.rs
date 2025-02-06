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
    require!(
        non_pool_percent <= 35,
        ErrorCode::InvalidDistributionPercentage
    );
    // Compute the LP (pool) percentage as the remaining percentage.
    let computed_pool_percent = 100 - non_pool_percent;
    // Check if a pool distribution instruction was provided.
    let pool_instructions: Vec<&DistributionInstruction> =
        distributions.iter().filter(|d| d.is_pool).collect();
    // Allow at most one pool distribution.
    if pool_instructions.len() > 1 {
        return Err(ErrorCode::InvalidDistributionPercentage.into());
    }
    // If a pool instruction exists, its percentage must equal the computed LP percentage.
    if pool_instructions.len() == 1 {
        require!(
            pool_instructions[0].percentage == computed_pool_percent,
            ErrorCode::InvalidDistributionPercentage
        );
    }
    
    // --- 7. Distribute Tokens ---
    // Process non–LP distributions.
    let non_pool_count = distributions.iter().filter(|d| !d.is_pool).count();
    require!(
        ctx.remaining_accounts.len() == non_pool_count,
        ErrorCode::InsufficientBalance
    );
    let mut remaining_iter = ctx.remaining_accounts.iter();
    for dist in distributions.iter().filter(|d| !d.is_pool) {
        // Calculate allocation for this non–LP distribution.
        let allocation = raw_amount
            .checked_mul(dist.percentage as u64)
            .and_then(|v| v.checked_div(100))
            .ok_or(ErrorCode::Overflow)?;
        // Get the recipient account from remaining accounts.
        let recipient_account = remaining_iter.next().unwrap();
        require!(
            recipient_account.key == dist.recipient,
            ErrorCode::Unauthorized
        );
        let cpi_ctx_transfer = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.recipient_ata.to_account_info(),
                to: recipient_account.clone(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(cpi_ctx_transfer, allocation)?;
        msg!(
            "Transferred {} tokens ({}%) to {}",
            allocation,
            dist.percentage,
            recipient_account.key
        );
    }
    
    // Process the LP distribution.
    let pool_allocation = raw_amount
        .checked_mul(computed_pool_percent as u64)
        .and_then(|v| v.checked_div(100))
        .ok_or(ErrorCode::Overflow)?;
    
    // Whether or not a pool instruction was provided, we need to initialize the pool and transfer tokens.
    if let Some(pool_dist) = distributions.iter().find(|d| d.is_pool) {
        // Use the provided pool instruction.
        let pool_key = initialize_pool(ctx, pool_allocation)?;
        let cpi_ctx_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.recipient_ata.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(cpi_ctx_pool, pool_allocation)?;
        msg!(
            "Transferred {} tokens ({}%) to Pool vault as specified",
            pool_allocation,
            pool_dist.percentage
        );
        token_state.pool = pool_key;
    } else {
        // No pool instruction provided; automatically use the computed LP allocation.
        let pool_key = initialize_pool(ctx, pool_allocation)?;
        let cpi_ctx_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.recipient_ata.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(cpi_ctx_pool, pool_allocation)?;
        msg!(
            "Automatically transferred {} tokens ({}%) to Pool vault",
            pool_allocation,
            computed_pool_percent
        );
        token_state.pool = pool_key;
    }
    
    msg!(
        "Created memecoin {} with symbol {}, total supply locked at {}. Non–LP distributions: {}%, LP distribution: {}%",
        name,
        symbol,
        total_supply,
        non_pool_percent,
        computed_pool_percent
    );
    Ok(())
}

/// initialize_pool using the dynamic_amm CPI (Meteora) to create a new liquidity pool and deposit liquidity correctly.
fn initialize_pool<'info>(
    ctx: &Context<CreateMemeToken>,
    _allocation: u64,
) -> Result<Pubkey> {
    // Example initial price: set sqrt_price_x96 to represent price 1 (i.e. 1 << 96).
    let initial_sqrt_price_x96: u128 = 1 << 96;
    let tick_spacing: u16 = 64; // Example tick spacing; adjust as needed.
    
    // Build the CPI context for pool initialization using dynamic_amm.
    let cpi_ctx = CpiContext::new(
        ctx.accounts.dynamic_amm_program.to_account_info(),
        dynamic_amm::accounts::InitPool {
            pool: ctx.accounts.pool_account.to_account_info(),
            pool_authority: ctx.accounts.pool_authority.to_account_info(),
            token_vault_a: ctx.accounts.pool_vault.to_account_info(), // our token vault (A side) for memecoin tokens
            token_vault_b: ctx.accounts.token_vault_b.to_account_info(), // vault for SOL/wSOL
            fee_account: ctx.accounts.fee_account.to_account_info(),
            token_mint_a: ctx.accounts.mint.to_account_info(),       // memecoin mint
            token_mint_b: ctx.accounts.wsol_mint.to_account_info(),     // wSOL mint
            payer: ctx.accounts.creator.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    );
    
    // Call the dynamic_amm CPI to initialize the pool.
    dynamic_amm::cpi::init_pool(cpi_ctx, initial_sqrt_price_x96, tick_spacing)?;
    msg!("Meteora liquidity pool successfully created via CPI.");
    
    // Return the new pool account's key.
    Ok(ctx.accounts.pool_account.key())
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

    /// The liquidity pool account to be created via CPI.
    #[account(mut)]
    pub pool_account: AccountInfo<'info>,

    /// The pool authority for the new pool.
    #[account(mut)]
    pub pool_authority: AccountInfo<'info>,

    /// The token vault for the SOL (or wSOL) side of the pool.
    #[account(mut)]
    pub token_vault_b: AccountInfo<'info>,

    /// The fee account for the pool.
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    /// The wSOL mint.
    #[account(mut)]
    pub wsol_mint: AccountInfo<'info>,

    /// The evolution data account (created via PDA using seed "evolution_data" and the mint’s key).
    #[account(
        init,
        payer = creator,
        seeds = [b"evolution_data", mint.key().as_ref()],
        bump,
        space = 8 + 32 + 1 + 4 + (420 * 80)
    )]
    pub evolution_data: Account<'info, EvolutionData>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, token::Token>,

    pub rent: Sysvar<'info, Rent>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// The dynamic AMM program (Meteora) for liquidity pool creation.
    #[account(address = dynamic_amm::ID)]
    pub dynamic_amm_program: AccountInfo<'info>,
}
