use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use mpl_token_metadata::instruction as mpl_instruction;
use mpl_token_metadata::state::DataV2;
use dynamic_amm::cpi::swap as meteora_swap;
use dynamic_amm::cpi::SwapParams;
use dynamic_amm::accounts::Swap as MeteoraSwapAccounts;
use crate::state::{
    meme_token_state::MemeTokenState,
    evolution_data::EvolutionData,
};

/// This instruction now uses the Meteora AMM CPI instead of Orca’s CPI.
/// (Later, you can adjust fee calculations to tack on an extra 20% so that the effective fee becomes 1.2%.)
pub fn handle_trade_via_meteora(
    ctx: Context<TradeViaMeteora>,
    amount_in: u64,
    min_out: u64,
) -> Result<()> {
    // --- 1. Build Meteora swap accounts.
    let swap_accounts = MeteoraSwapAccounts {
        pool: ctx.accounts.pool.to_account_info(),
        user_source_token: ctx.accounts.user_in_token_account.to_account_info(),
        user_destination_token: ctx.accounts.user_out_token_account.to_account_info(),
        a_vault: ctx.accounts.meteora_pool_token_a.to_account_info(),
        b_vault: ctx.accounts.meteora_pool_token_b.to_account_info(),
        fee_account: ctx.accounts.meteora_fee_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        user: ctx.accounts.user.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.dynamic_amm_program.to_account_info(),
        swap_accounts,
    );
    let swap_params = SwapParams {
        amount: amount_in,
        other_amount_threshold: min_out,
    };

    // --- 2. Call the Meteora CPI swap function.
    meteora_swap(cpi_ctx, swap_params)?;
    msg!("Called Meteora swap with {} tokens (min_out: {})", amount_in, min_out);

    // --- 3. Trigger evolution logic.
    let current_price = get_current_price(&ctx.accounts.pool)?;
    msg!("Decoded current price: {}", current_price);
    trigger_evolution(
        &ctx.accounts.evolution_data,
        &ctx.accounts.metadata,
        &ctx.accounts.metadata_update_authority,
        &ctx.accounts.token_metadata_program,
        current_price,
        ctx.accounts.meme_token_state.symbol.clone(),
    )?;
    Ok(())
}

/// Dummy function to get the current price from the Meteora pool account.
/// In production, you should deserialize the pool state properly.
fn get_current_price(pool: &AccountInfo) -> Result<u64> {
    // For now, return a placeholder value.
    Ok(1)
}

/// Triggers an evolution update if a threshold is met.
/// (This logic is similar to your original evolution trigger.)
fn trigger_evolution<'info>(
    evolution_data: &Account<EvolutionData>,
    metadata: &AccountInfo<'info>,
    metadata_update_authority: &AccountInfo<'info>,
    token_metadata_program: &AccountInfo<'info>,
    current_price: u64,
    original_symbol: String,
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
            symbol: original_symbol,
            uri: final_uri.clone(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        }),
        None,
        None,
    )?;

    let accounts = [
        metadata.clone(),
        metadata_update_authority.to_account_info().clone(),
    ];
    invoke(&ix, &accounts)?;
    msg!(
        "Updated token metadata: new_name='{}', new_uri='{}', threshold={}",
        final_name,
        final_uri,
        highest_threshold
    );
    Ok(())
}

/// Context for the Meteora swap instruction.
#[derive(Accounts)]
pub struct TradeViaMeteora<'info> {
    /// The user initiating the swap.
    #[account(mut)]
    pub user: Signer<'info>,

    /// The user's source token account (tokens to be swapped).
    #[account(mut)]
    pub user_in_token_account: AccountInfo<'info>,

    /// The user's destination token account (to receive swapped tokens).
    #[account(mut)]
    pub user_out_token_account: AccountInfo<'info>,

    /// The Meteora pool account.
    #[account(mut)]
    pub pool: AccountInfo<'info>,

    /// The Meteora pool token vault for token A.
    #[account(mut)]
    pub meteora_pool_token_a: AccountInfo<'info>,

    /// The Meteora pool token vault for token B.
    #[account(mut)]
    pub meteora_pool_token_b: AccountInfo<'info>,

    /// The fee account for Meteora fees.
    #[account(mut)]
    pub meteora_fee_account: AccountInfo<'info>,

    /// The memecoin state.
    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    /// The evolution data account.
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    /// The Metaplex metadata account for the token mint.
    #[account(mut)]
    pub metadata: AccountInfo<'info>,

    /// The authority allowed to update metadata.
    #[account(mut)]
    pub metadata_update_authority: Signer<'info>,

    /// The Token Metadata program (Metaplex).
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>,

    /// The dynamic AMM program (Meteora).
    #[account(address = dynamic_amm::ID)]
    pub dynamic_amm_program: AccountInfo<'info>,

    /// The SPL Token program.
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, anchor_spl::token::Token>,
}
