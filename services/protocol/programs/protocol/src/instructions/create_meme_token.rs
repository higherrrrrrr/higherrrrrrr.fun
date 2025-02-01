// File: instructions/create_meme_token.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, InitializeMint, MintTo, SetAuthority, AuthorityType, Transfer,
};
use crate::{
    errors::ErrorCode,
    state::{
        meme_token_state::MemeTokenState,
        evolution_data::{EvolutionData, EvolutionItem},
    },
};

/// A distribution instruction defines one recipient and the percentage of tokens they receive.
/// The sum of percentages must equal 100. If `is_pool` is true, then instead of using the provided
/// recipient account, the protocol will initialize a proper liquidity pool via CPI.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DistributionInstruction {
    pub recipient: Pubkey,
    pub percentage: u8,
    pub is_pool: bool,
}

/// The main handler for creating and locking a new SPL token.
/// This instruction:
/// 1. Initializes the mint and mints the full supply to a temporary recipient account.
/// 2. Sets immutable evolution thresholds.
/// 3. Distributes the minted supply according to a custom distribution:
///    - For each distribution not flagged as pool, tokens are transferred to the provided recipient account.
///    - For the distribution flagged as pool, a CPI call to Orca is made to initialize a real pool deposit;
///      tokens are then transferred into the dedicated pool vault and the pool’s address is recorded.
/// 4. Locks the mint authority.
pub fn handle(
    ctx: Context<CreateMemeToken>,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: u64,
    evolutions: Vec<EvolutionItem>,               // evolution thresholds (immutable)
    distributions: Vec<DistributionInstruction>,    // custom distribution instructions
) -> Result<()> {
    // --- 1. Populate MemeTokenState ---
    let token_state = &mut ctx.accounts.meme_token_state;
    token_state.creator = *ctx.accounts.creator.key;
    token_state.mint = ctx.accounts.mint.key();
    token_state.name = name.clone();
    token_state.symbol = symbol.clone();
    token_state.total_supply = total_supply;
    token_state.decimals = decimals;
    // The pool field will be set below if a distribution is flagged as pool.

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

    // --- 6. Validate Distribution Percentages ---
    let total_percent: u8 = distributions.iter().map(|d| d.percentage).sum();
    require!(total_percent == 100, ErrorCode::InvalidPriceData);

    // --- 7. Distribute Tokens ---
    // Count how many distributions are NOT for the pool.
    let non_pool_count = distributions.iter().filter(|d| !d.is_pool).count();
    // The remaining_accounts must equal non_pool_count.
    require!(
        ctx.remaining_accounts.len() == non_pool_count,
        ErrorCode::InsufficientBalance
    );
    let mut remaining_iter = ctx.remaining_accounts.iter();
    // Hold the pool deposit key here.
    let mut pool_deposit_opt: Option<Pubkey> = None;

    // Iterate through each distribution instruction.
    for dist in distributions.iter() {
        // Calculate the allocation.
        let allocation = raw_amount
            .checked_mul(dist.percentage as u64)
            .and_then(|v| v.checked_div(100))
            .ok_or(ErrorCode::Overflow)?;
        if dist.is_pool {
            // For the pool distribution, call the CPI to initialize the pool deposit.
            let pool_key = initialize_pool(ctx, allocation)?;
            pool_deposit_opt = Some(pool_key);
            // Transfer the tokens to the dedicated pool vault.
            let cpi_ctx_pool = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.recipient_ata.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            );
            token::transfer(cpi_ctx_pool, allocation)?;
            msg!(
                "Transferred {} tokens ({}%) to Pool vault",
                allocation,
                dist.percentage
            );
        } else {
            // For non-pool distributions, use the next remaining account.
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
    }
    // --- 8. Ensure a pool deposit was defined ---
    require!(pool_deposit_opt.is_some(), ErrorCode::Unauthorized);
    token_state.pool = pool_deposit_opt.unwrap();

    msg!(
        "Created memecoin {} with symbol {}, total supply locked at {}. Distribution complete.",
        name,
        symbol,
        total_supply
    );
    Ok(())
}

/// **initialize_pool**
///
/// Calls Orca’s CPI to create a new concentrated liquidity pool for the token and wSOL pair.
/// It uses the additional accounts provided in the CreateMemeToken context. In a full implementation,
/// this function will create the pool, set up its associated token vaults, fee account, and authorities.
/// For demonstration, we call the CPI function from orca_whirlpools_client.
fn initialize_pool<'info>(
    ctx: &Context<CreateMemeToken>,
    _allocation: u64,
) -> Result<Pubkey> {
    // Example initial price: set the sqrt_price_x96 to represent price 1 (i.e. 1<<96)
    let initial_sqrt_price_x96: u128 = 1 << 96;
    let tick_spacing: u16 = 64; // Example tick spacing; adjust as needed.

    // Build the CPI context for pool initialization.
    let cpi_ctx = CpiContext::new(
        ctx.accounts.orca_whirlpools_program.to_account_info(),
        orca_whirlpools_client::accounts::InitPool {
            pool: ctx.accounts.pool_account.to_account_info(),
            pool_authority: ctx.accounts.pool_authority.to_account_info(),
            token_vault_a: ctx.accounts.pool_vault.to_account_info(), // our token vault (A side)
            token_vault_b: ctx.accounts.token_vault_b.to_account_info(), // SOL side vault
            fee_account: ctx.accounts.fee_account.to_account_info(),
            token_mint_a: ctx.accounts.mint.to_account_info(),       // memecoin mint
            token_mint_b: ctx.accounts.wsol_mint.to_account_info(),     // wSOL mint
            payer: ctx.accounts.creator.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    );

    // Call the CPI function to initialize the pool.
    orca_whirlpools_client::cpi::init_pool(cpi_ctx, initial_sqrt_price_x96, tick_spacing)?;
    msg!("Orca pool successfully created via CPI.");

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
        space = 8 +  // discriminator
               32 + // creator
               32 + // mint
               (4 + name.len()) + // name
               (4 + symbol.len()) + // symbol
               8 +  // total_supply
               1 +  // decimals
               32,  // pool deposit (pool)
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

    /// The Orca pool account to be created via CPI.
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

    /// The evolution data account (created via PDA using seed "evolution_data" and the mint’s key).
    #[account(
        init,
        payer = creator,
        seeds = [b"evolution_data", mint.key().as_ref()],
        bump,
        space = 8 + 32 + 1 + 4 + (32 * 10)
    )]
    pub evolution_data: Account<'info, EvolutionData>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, token::Token>,

    pub rent: Sysvar<'info, Rent>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// The Orca Whirlpools program (for CPI calls).
    #[account(address = orca_whirlpools_client::ID)]
    pub orca_whirlpools_program: AccountInfo<'info>,
}
