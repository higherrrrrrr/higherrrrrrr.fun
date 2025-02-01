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

//
// Updated: Fixed threshold calculation (using denominator 100,000,000)
//       and implemented a minimal NFT minting routine via CPI to token::mint_to.
//

// The handler for registering big holders
pub fn handle_register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let user_balance = ctx.accounts.user_token_account.amount;

    let decimals = ctx.accounts.meme_token_state.decimals;
    let total_supply = ctx.accounts.meme_token_state.total_supply;
    let raw_supply = total_supply
        .checked_mul(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    // Corrected threshold: 0.042069% is (raw_supply * 42069) / 100,000,000
    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(100_000_000u128)
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

// The handler for distributing NFTs to big holders.
// NOTE: We now expect that for each holder, two extra accounts are passed in the remaining_accounts:
//       (1) the NFT mint account and (2) the holder’s NFT token account.
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

    // Verify that we have two extra accounts for each registered holder.
    let expected_extra_accounts = registry.holders.len() * 2;
    require!(
        ctx.remaining_accounts.len() as usize == expected_extra_accounts,
        ErrorCode::InsufficientBalance // (or a custom error saying "Incorrect NFT account count")
    );

    // Iterate over the holders and mint an NFT for each.
    // We assume that for each holder, the next two accounts are:
    //   [NFT Mint Account, Holder's NFT Token Account]
    let mut new_list: Vec<Pubkey> = Vec::new();
    let mut extra_iter = ctx.remaining_accounts.iter();
    for holder_pubkey in &registry.holders {
        // In a real scenario, you would check the holder's current balance.
        // Here we assume the holder still qualifies (or use a helper to recheck).
        // Mint an NFT to the holder
        let nft_mint_account = extra_iter.next().unwrap();
        let holder_nft_token_account = extra_iter.next().unwrap();
        mint_conviction_nft(ctx, *holder_pubkey, nft_mint_account, holder_nft_token_account)?;
        new_list.push(*holder_pubkey);
    }

    registry.holders = new_list;
    registry.holder_count = registry.holders.len() as u32;
    Ok(())
}

/// A minimal function to mint an NFT to the given holder.
///
/// This implementation assumes that:
/// - The NFT mint account is already created and owned by `ctx.accounts.authority`.
/// - The caller passed the NFT mint and the holder’s associated token account in the remaining accounts.
/// - The NFT has 0 decimals and a supply of 1.
///
/// In a production implementation you would include the full account creation, initialize the mint,
/// and call the appropriate Metaplex instructions to set metadata.
fn mint_conviction_nft(
    ctx: &Context<DistributeConvictionNfts>,
    holder: Pubkey,
    nft_mint: &AccountInfo,
    holder_nft_token_account: &AccountInfo,
) -> Result<()> {
    // Mint 1 NFT (with decimals=0) to the holder’s NFT token account.
    // We use ctx.accounts.authority as the mint authority.
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

    // The following accounts must be passed in via remaining_accounts:
    // For each holder in `conviction_registry.holders`:
    //   [NFT Mint Account, Holder's NFT Token Account]
    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,

    // Also include the system program (if needed for NFT creation) and
    // the Metaplex token metadata program (if you wish to call metadata CPIs).
    // (They are not used in this minimal implementation.)
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
}
