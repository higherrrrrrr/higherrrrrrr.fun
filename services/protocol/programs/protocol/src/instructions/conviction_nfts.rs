use anchor_lang::prelude::*;
use crate::{
    errors::ErrorCode,
    state::{
        meme_token_state::MemeTokenState,
        conviction_registry::ConvictionRegistry,
    },
};
use anchor_spl::token::{TokenAccount, Token, MintTo};
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token;
use borsh::BorshDeserialize;

/// Handler for registering big holders.
pub fn handle_register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let user_token_account = &ctx.accounts.user_token_account;

    // Ensure the user's token account is for the correct mint.
    require!(
        user_token_account.mint == ctx.accounts.meme_token_state.mint,
        ErrorCode::InvalidTokenAccount
    );

    let user_balance = user_token_account.amount;
    let decimals = ctx.accounts.meme_token_state.decimals;
    let total_supply = ctx.accounts.meme_token_state.total_supply;
    let raw_supply = total_supply
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    // Calculate the minimum balance required for registration.
    // 0.042069% is (raw_supply * 42069) / 100,000,000
    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100_000_000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    require!(
        user_balance >= conviction_min,
        ErrorCode::InsufficientBalance
    );

    if !registry.holders.contains(&ctx.accounts.user.key()) {
        registry.holders.push(ctx.accounts.user.key());
        registry.holder_count = registry.holders.len() as u32;
        msg!("User {} successfully registered as big holder.", ctx.accounts.user.key());
    } else {
        msg!("User already in the registry.");
    }
    Ok(())
}


/// Handler for distributing conviction NFTs. 
/// For each holder registered in the registry, we expect three extra accounts:
///   1. Holder’s memecoin token account (to re-check current balance)
///   2. NFT Mint Account
///   3. Holder’s NFT Token Account
pub fn handle_distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let token_state = &ctx.accounts.meme_token_state;

    let raw_supply = token_state.total_supply
        .checked_mul(10u64.pow(token_state.decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100_000_000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    // Expect for each holder: 3 extra accounts:
    // 1. Holder’s memecoin token account (for balance check)
    // 2. NFT Mint Account
    // 3. Holder’s NFT Token Account
    let expected_extra_accounts = registry.holders.len() * 3;
    require!(
        ctx.remaining_accounts.len() as usize == expected_extra_accounts,
        ErrorCode::InsufficientBalance // Alternatively, you could define a custom error here.
    );

    let mut new_list: Vec<Pubkey> = Vec::new();
    let mut extra_iter = ctx.remaining_accounts.iter();
    for holder_pubkey in &registry.holders {
        // (1) Get the holder’s memecoin token account to verify current balance.
        let holder_token_account_info = extra_iter.next().unwrap();
        // (2) Get the NFT mint account.
        let nft_mint_account = extra_iter.next().unwrap();
        // (3) Get the holder’s NFT token account.
        let holder_nft_token_account = extra_iter.next().unwrap();

        // Deserialize the token account to read the balance.
        let token_account = TokenAccount::try_deserialize(
            &mut &holder_token_account_info.data.borrow()[..]
        ).map_err(|_| ErrorCode::InvalidPriceData)?;

        if token_account.amount < conviction_min {
            msg!("Holder {} no longer qualifies (balance {} < threshold {}). Skipping NFT mint.", 
                holder_pubkey, token_account.amount, conviction_min);
            continue;
        }

        // Mint the NFT to the qualified holder.
        mint_conviction_nft(ctx, *holder_pubkey, nft_mint_account, holder_nft_token_account)?;
        new_list.push(*holder_pubkey);
    }

    registry.holders = new_list;
    registry.holder_count = registry.holders.len() as u32;
    Ok(())
}

/// A minimal function to mint an NFT to the given holder.
/// Assumes:
/// - The NFT mint account is already created and owned by `ctx.accounts.authority`.
/// - The NFT has 0 decimals and a supply of 1.
fn mint_conviction_nft(
    ctx: &Context<DistributeConvictionNfts>,
    holder: Pubkey,
    nft_mint: &AccountInfo,
    holder_nft_token_account: &AccountInfo,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: nft_mint.clone(),
            to: holder_nft_token_account.clone(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::mint_to(cpi_ctx, 1)?;
    msg!("Minted a conviction NFT to {}", holder);
    Ok(())
}

// -------------------- Context structs --------------------

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

    // The following accounts must be provided in remaining_accounts.
    // For each holder in `conviction_registry.holders`, provide:
    //   1. Holder's memecoin token account (for balance check)
    //   2. NFT Mint Account
    //   3. Holder's NFT Token Account
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
}
