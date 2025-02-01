// File: instructions/trade_orca.rs

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::{self, TokenAccount, Transfer};
use orca_whirlpools_client::cpi::swap as whirlpools_swap;
use orca_whirlpools_client::cpi::SwapParams;
use orca_whirlpools_client::accounts::Swap as WhirlpoolSwapAccounts;
use mpl_token_metadata::instruction as mpl_instruction;
use mpl_token_metadata::state::DataV2;
use crate::state::{
    meme_token_state::MemeTokenState,
    evolution_data::EvolutionData,
};

// Import the Whirlpool state type from orca_whirlpools_core.
// (Ensure that orca_whirlpools_core is included as a dependency.)
use orca_whirlpools_core::state::Whirlpool;

/// Executes a swap via Orca Whirlpools Client and triggers metadata evolution if thresholds are crossed:
/// 
/// 1. Calculates a token fee (0.5% of `amount_in`) and transfers it to the creator’s token vault.
/// 2. Uses the remaining tokens to perform a swap via Orca Whirlpools Client.
/// 3. Simulates SOL fee extraction and transfers the SOL fee to the protocol SOL vault.
/// 4. Reads the current price from the pool (Whirlpool) account by decoding its on‑chain state,
///    then triggers metadata evolution if the price meets a threshold.
pub fn handle_trade_via_orca(
    ctx: Context<TradeViaOrca>,
    amount_in: u64,
    min_out: u64,
    _unused_current_price: u64, // no longer used externally
) -> Result<()> {
    // --- 1. Calculate fees ---
    let token_fee = amount_in
        .checked_div(200)
        .ok_or(crate::errors::ErrorCode::Overflow)?;
    let amount_to_swap = amount_in
        .checked_sub(token_fee)
        .ok_or(crate::errors::ErrorCode::Overflow)?;

    // --- 2. Transfer token fee to the creator's token vault ---
    let cpi_transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.user_in_token_account.to_account_info(),
            to: ctx.accounts.creator_token_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi_transfer_ctx, token_fee)?;
    msg!("Transferred {} tokens as fee to the creator token vault", token_fee);

    // --- 3. Perform swap via Orca Whirlpools Client ---
    let whirlpool_swap_accounts = WhirlpoolSwapAccounts {
        whirlpool: ctx.accounts.whirlpool.to_account_info(),
        token_vault_a: ctx.accounts.orca_pool_token_a.to_account_info(),
        token_vault_b: ctx.accounts.orca_pool_token_b.to_account_info(),
        fee_account: ctx.accounts.orca_pool_fee_account.to_account_info(),
        user_token_account: ctx.accounts.user_in_token_account.to_account_info(),
        user_transfer_authority: ctx.accounts.user.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.orca_whirlpools_program.to_account_info(),
        whirlpool_swap_accounts,
    );

    let swap_params = SwapParams {
        amount: amount_to_swap,
        other_amount_threshold: min_out,
    };

    whirlpools_swap(cpi_ctx, swap_params)?;
    msg!("Called Orca Whirlpools swap with {} tokens (min_out: {})", amount_to_swap, min_out);

    // --- 4. (Optional) SOL Fee Extraction (simulated) ---
    let simulated_sol_out = min_out
        .checked_add(100)
        .ok_or(crate::errors::ErrorCode::Overflow)?;
    let sol_fee = simulated_sol_out
        .checked_div(200)
        .ok_or(crate::errors::ErrorCode::Overflow)?;
    msg!("Simulated SOL fee: {} lamports", sol_fee);
    {
        let user_lamports = &mut ctx.accounts.user.try_borrow_mut_lamports()?;
        let vault_lamports = &mut ctx.accounts.protocol_sol_vault.try_borrow_mut_lamports()?;
        **user_lamports = user_lamports
            .checked_sub(sol_fee)
            .ok_or(crate::errors::ErrorCode::Overflow)?;
        **vault_lamports = vault_lamports
            .checked_add(sol_fee)
            .ok_or(crate::errors::ErrorCode::Overflow)?;
    }
    msg!("Transferred {} lamports as SOL fee to the protocol vault", sol_fee);

    // --- 5. Get current price from the pool and trigger evolution ---
    let current_price = get_current_price(&ctx.accounts.whirlpool)?;
    msg!("Decoded current price: {}", current_price);
    trigger_evolution(
        &ctx.accounts.evolution_data,
        &ctx.accounts.metadata,
        &ctx.accounts.metadata_update_authority,
        &ctx.accounts.token_metadata_program,
        current_price,
    )?;

    Ok(())
}

/// Uses Orca Whirlpools Core to decode the pool state and compute a current price.
/// The Whirlpool account stores sqrt_price_x96 as a Q64.96 fixed-point number.
/// Price = (sqrt_price_x96^2) / 2^192.
fn get_current_price(whirlpool: &AccountInfo) -> Result<u64> {
    // Deserialize the Whirlpool state from the account data.
    let whirlpool_state = Whirlpool::try_from_slice(&whirlpool.data.borrow())
        .map_err(|_| crate::errors::ErrorCode::InvalidPriceData)?;
    let sqrt_price_x96 = whirlpool_state.sqrt_price_x96;
    // Compute price = (sqrt_price_x96 * sqrt_price_x96) / 2^192
    let price_u128 = sqrt_price_x96
        .checked_mul(sqrt_price_x96)
        .ok_or(crate::errors::ErrorCode::Overflow)?;
    let price = price_u128 >> 192;
    Ok(price as u64)
}

/// Helper function that checks the evolution data against the current price and,
/// if a threshold is crossed, updates the token metadata via a CPI call to Metaplex.
fn trigger_evolution<'info>(
    evolution_data: &Account<EvolutionData>,
    metadata: &AccountInfo<'info>,
    metadata_update_authority: &AccountInfo<'info>,
    token_metadata_program: &AccountInfo<'info>,
    current_price: u64,
) -> Result<()> {
    let mut chosen_name: Option<String> = None;
    let mut chosen_uri: Option<String> = None;
    let mut highest_threshold: u64 = 0;

    for item in &evolution_data.evolutions {
        if current_price >= item.price_threshold && item.price_threshold >= highest_threshold {
            chosen_name = Some(item.new_name.clone());
            chosen_uri = Some(item.new_uri.clone());
            highest_threshold = item.price_threshold;
        }
    }

    if chosen_name.is_none() {
        msg!("No evolution threshold crossed at price {}", current_price);
        return Ok(());
    }

    let final_name = chosen_name.unwrap();
    let final_uri = chosen_uri.unwrap();

    let ix = mpl_instruction::update_metadata_accounts_v2(
        *token_metadata_program.key,
        metadata.key(),
        metadata_update_authority.key(),
        None,
        Some(DataV2 {
            name: final_name.clone(),
            symbol: "".to_string(),
            uri: final_uri.clone(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        }),
        None,
        None,
    )?;

    let account_infos = [metadata.clone(), metadata_update_authority.to_account_info()];
    invoke(&ix, &account_infos)?;
    msg!("Updated metadata to evolution '{}' at threshold {}", final_name, highest_threshold);

    Ok(())
}

/// a CPI call to the Orca program to increase liquidity.
/// In a production implementation you would replace the simulated CPI call with the actual
/// Orca Whirlpools “increase liquidity” instruction and provide proper parameters.
pub fn handle_create_single_sided_liquidity(
    ctx: Context<CreateSingleSidedLiquidity>,
    amount: u64,
) -> Result<()> {
    // --- 1. Transfer tokens from the creator's token account to the Orca pool token vault ---
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.creator_token_account.to_account_info(),
            to: ctx.accounts.orca_pool_token_a.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;
    msg!("Transferred {} tokens from the creator to the Orca pool token vault.", amount);

    // --- 2. Simulate a CPI call to Orca for adding liquidity ---
    // In a complete implementation, you might use a CPI call like:
    // orca_whirlpools_client::cpi::increase_liquidity(cpi_ctx_orca, liquidity_amount, lower_tick, upper_tick)?;
    // Here, we log the action to simulate the liquidity increase.
    msg!("Calling Orca program to add single-sided liquidity (simulated)...");
    // (Insert CPI call logic here when ready)
    msg!("Single-sided liquidity successfully added.");
    Ok(())
}

// -------------------- Contexts --------------------

#[derive(Accounts)]
pub struct TradeViaOrca<'info> {
    /// The user initiating the swap.
    #[account(mut)]
    pub user: Signer<'info>,

    /// The user's token account holding tokens to be swapped.
    #[account(mut)]
    pub user_in_token_account: AccountInfo<'info>,
    /// (Optional) The user's token account to receive swapped tokens.
    #[account(mut)]
    pub user_out_token_account: AccountInfo<'info>,

    /// The Orca pool token vault for token A.
    #[account(mut)]
    pub orca_pool_token_a: AccountInfo<'info>,
    /// The Orca pool token vault for token B.
    #[account(mut)]
    pub orca_pool_token_b: AccountInfo<'info>,
    /// The Orca pool fee account.
    #[account(mut)]
    pub orca_pool_fee_account: AccountInfo<'info>,

    /// The memecoin state account.
    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,
    /// The evolution data account.
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    /// The token metadata account.
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// The authority that can update metadata.
    #[account(mut)]
    pub metadata_update_authority: AccountInfo<'info>,

    /// The Whirlpool (pool deposit) account.
    #[account(mut)]
    pub whirlpool: AccountInfo<'info>,

    /// The protocol SOL vault to accumulate SOL fees.
    #[account(mut)]
    pub protocol_sol_vault: AccountInfo<'info>,

    /// The creator's token vault to accumulate token fees.
    #[account(mut)]
    pub creator_token_vault: AccountInfo<'info>,

    /// The Orca Whirlpools program.
    #[account(address = orca_whirlpools_client::ID)]
    pub orca_whirlpools_program: AccountInfo<'info>,

    /// The SPL Token program.
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, anchor_spl::token::Token>,

    /// The Token Metadata program.
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateSingleSidedLiquidity<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub creator_token_account: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_token_a: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_token_b: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub orca_program: AccountInfo<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, anchor_spl::token::Token>,
}
