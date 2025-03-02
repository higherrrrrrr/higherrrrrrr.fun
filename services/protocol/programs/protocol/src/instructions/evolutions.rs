use anchor_lang::prelude::*;
use solana_program::program::invoke;
use crate::{
    errors::ErrorCode,
    state::{
        evolution_data::{EvolutionData, EvolutionItem},
        meme_token_state::MemeTokenState,
    },
};
use mpl_token_metadata::instruction as mpl_instruction;
use mpl_token_metadata::state::DataV2;
use anchor_spl::token::Mint;

/// Handler for `set_evolutions` instruction
pub fn handle_set_evolutions(
    ctx: Context<SetEvolutions>,
    items: Vec<EvolutionItem>,
) -> Result<()> {
    // Enforce maximum evolution count of 420.
    require!(items.len() <= 420, ErrorCode::InvalidDistributionPercentage); // Alternatively, define a dedicated error.
    let evo_data = &mut ctx.accounts.evolution_data;
    require_keys_eq!(evo_data.owner, ctx.accounts.owner.key(), ErrorCode::Unauthorized);

    evo_data.evolution_count = items.len() as u8;
    evo_data.evolutions = items;

    msg!("Set {} evolutions for this token", evo_data.evolution_count);
    Ok(())
}

/// Handler for `update_meme_metadata` instruction
pub fn handle_update_meme_metadata(
    ctx: Context<UpdateMemeMetadata>,
    current_price: u64,
) -> Result<()> {
    let evo_data = &ctx.accounts.evolution_data;

    let mut chosen_name = None;
    let mut chosen_uri = None;
    let mut highest_threshold = 0u64;

    // Determine the highest threshold that is <= current_price.
    for item in &evo_data.evolutions {
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

    // Preserve the original symbol from the meme token state.
    let original_symbol = ctx.accounts.meme_token_state.symbol.clone();

    // Construct the Metaplex CPI to update name/URI while keeping the symbol unchanged.
    let ix = mpl_instruction::update_metadata_accounts_v2(
        *ctx.accounts.token_metadata_program.key,
        ctx.accounts.metadata.key(),
        ctx.accounts.metadata_update_authority.key(),
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
        ctx.accounts.metadata.clone(),
        ctx.accounts.metadata_update_authority.to_account_info().clone(),
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

pub fn check_evolution_thresholds(
    ctx: Context<CheckEvolutionThresholds>,
    volume_threshold: u64,
) -> Result<()> {
    // Add maximum threshold check
    require!(
        volume_threshold <= 1_000_000_000_000_000, // Reasonable upper limit
        ErrorCode::ThresholdTooHigh
    );
    
    // Add intermediate checks in calculations
    let evolution_data = &mut ctx.accounts.evolution_data;
    let current_volume = evolution_data.current_volume;
    
    // Use checked add with overflow protection
    let new_volume = current_volume
        .checked_add(volume_threshold)
        .ok_or(ErrorCode::Overflow)?;
        
    // Additional validation
    require!(new_volume >= current_volume, ErrorCode::InvalidVolumeUpdate);
    
    // Rest of function...
}

// Add helper function to validate URIs
fn is_valid_uri(uri: &str) -> bool {
    // Basic validation - ensure it's not empty and has reasonable length
    if uri.is_empty() || uri.len() > 200 {
        return false;
    }
    
    // Check if it starts with https:// or ipfs://
    uri.starts_with("https://") || uri.starts_with("ipfs://")
}

// Use in evolution
pub fn update_evolution_data(
    ctx: Context<UpdateEvolutionData>,
    evolution_items: Vec<EvolutionItem>,
) -> Result<()> {
    // Validate each URI
    for item in &evolution_items {
        require!(
            is_valid_uri(&item.new_uri),
            ErrorCode::InvalidUri
        );
    }
    
    // Rest of function...
}

// -------------------- Contexts --------------------

#[derive(Accounts)]
#[instruction(items: Vec<EvolutionItem>)]
pub struct SetEvolutions<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"evolution_data", token_mint.key().as_ref()],
        bump,
    )]
    pub evolution_data: Account<'info, EvolutionData>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// The token mint account (used for PDA derivation).
    pub token_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateMemeMetadata<'info> {
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    /// Added to fetch the token's symbol.
    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub metadata_update_authority: Signer<'info>,

    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
}
