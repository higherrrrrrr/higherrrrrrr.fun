use anchor_lang::prelude::*;
use crate::{
    errors::ErrorCode,
    state::{
        meme_token_state::MemeTokenState,
        conviction_registry::ConvictionRegistry,
    },
};
use anchor_spl::token::{TokenAccount, Token};

// The handler for registering big holders
pub fn handle_register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let user_balance = ctx.accounts.user_token_account.amount;

    let decimals = ctx.accounts.meme_token_state.decimals;
    let total_supply = ctx.accounts.meme_token_state.total_supply;
    let raw_supply = total_supply
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    // 0.42069% => (raw_supply * 42069) / 10000000
    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    require!(user_balance >= conviction_min, ErrorCode::InsufficientBalance);

    if !registry.holders.contains(&ctx.accounts.user.key()) {
        registry.holders.push(ctx.accounts.user.key());
        registry.holder_count = registry.holders.len() as u32;
        msg!("User {} successfully registered as big holder.", ctx.accounts.user.key());
    } else {
        msg!("User already in the registry.");
    }
    Ok(())
}

// The handler for distributing NFTs to big holders
pub fn handle_distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let token_state = &ctx.accounts.meme_token_state;

    let raw_supply = token_state.total_supply
        .checked_mul(10u64.pow(token_state.decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    let mut new_list: Vec<Pubkey> = Vec::new();
    for holder_pubkey in &registry.holders {
        // In a real scenario, you'd need a helper to fetch the holder's token account balance
        // or pass them as remaining accounts. We'll do a placeholder check:
        let placeholder_balance = conviction_min; // assume they exactly meet the threshold

        if placeholder_balance >= conviction_min {
            // Mint an NFT to them
            mint_conviction_nft(&ctx, *holder_pubkey)?;
            new_list.push(*holder_pubkey);
        } else {
            msg!("Pruned holder {} (below threshold)", holder_pubkey);
        }
    }

    registry.holders = new_list;
    registry.holder_count = registry.holders.len() as u32;
    Ok(())
}

/// Example function to mint an NFT to the holder
fn mint_conviction_nft(
    _ctx: &Context<DistributeConvictionNfts>,
    holder: Pubkey
) -> Result<()> {
    msg!("Minting a conviction NFT to {}", holder);
    // Real implementation: create a new mint, create metadata, or link to a collection
    // omitted for brevity
    Ok(())
}

// -------------- Context structs --------------

#[derive(Accounts)]
pub struct RegisterHolder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"conviction_registry", meme_token_state.mint.key().as_ref()],
        bump,
    )]
    pub conviction_registry: Account<'info, ConvictionRegistry>,

    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeConvictionNfts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"conviction_registry", meme_token_state.mint.key().as_ref()],
        bump
    )]
    pub conviction_registry: Account<'info, ConvictionRegistry>,

    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}
