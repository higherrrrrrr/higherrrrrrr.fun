use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::{self, TokenAccount, Transfer};
use mpl_token_metadata::instruction as mpl_instruction;
use mpl_token_metadata::state::DataV2;
use crate::state::{
    meme_token_state::MemeTokenState,
    evolution_data::EvolutionData,
};

/// Executes a pass-through trade and triggers metadata evolution if thresholds are crossed
pub fn handle_pass_through_trade(
    ctx: Context<PassThroughTrade>,
    amount_in: u64,
    min_out: u64,
    _unused_current_price: u64,
) -> Result<()> {
    // --- 1. Simple pass-through trading logic ---
    msg!("Initiating pass-through trade with {} tokens (min_out: {})", amount_in, min_out);
    
    // Direct transfer from user to protocol vault
    let transfer_to_protocol = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_in_token_account.to_account_info(),
            to: ctx.accounts.user_out_token_account.to_account_info(), // Direct transfer to output
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_to_protocol, amount_in)?;
    msg!("Transferred {} tokens from user input to output", amount_in);

    // --- 2. Get current price and trigger evolution ---
    // For now using a mock price, in production would get from DEX
    let current_price = 1000; // Mock price
    msg!("Current mock price: {}", current_price);
    
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

/// Checks evolution data against the current price and, if a threshold is met, updates token metadata via a CPI call.
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
            symbol: original_symbol, // Preserve the original symbol.
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
    msg!("Updated metadata to evolution '{}' at threshold {}", final_name, highest_threshold);

    Ok(())
}

// -------------------- Contexts --------------------

#[derive(Accounts)]
pub struct PassThroughTrade<'info> {
    /// The user initiating the swap.
    #[account(mut)]
    pub user: Signer<'info>,

    /// The user's token account holding tokens to be swapped.
    #[account(mut)]
    pub user_in_token_account: AccountInfo<'info>,
    /// The user's token account to receive swapped tokens.
    #[account(mut)]
    pub user_out_token_account: AccountInfo<'info>,

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
    pub metadata_update_authority: Signer<'info>,

    /// The SPL Token program.
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, anchor_spl::token::Token>,

    /// The Token Metadata program.
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>,
}
