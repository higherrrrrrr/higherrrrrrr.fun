use anchor_lang::prelude::*;
use solana_program::program::invoke;
use crate::{
    errors::ErrorCode,
    state::{
        evolution_data::{EvolutionData, EvolutionItem},
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

    // Determine the highest threshold that is <= current_price
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

    // Construct the Metaplex CPI to update name/URI
    let ix = mpl_instruction::update_metadata_accounts_v2(
        *ctx.accounts.token_metadata_program.key,
        ctx.accounts.metadata.key(),
        ctx.accounts.metadata_update_authority.key(),
        None,
        Some(DataV2 {
            name: final_name.clone(),
            symbol: "".to_string(), // keep or set an updated symbol if you like
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

    // Possibly reference the token mint if needed
    pub token_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateMemeMetadata<'info> {
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub metadata_update_authority: Signer<'info>,

    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
}

