use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, InitializeMint, MintTo, SetAuthority, AuthorityType,
};
use crate::{
    errors::ErrorCode,
    state::meme_token_state::MemeTokenState,
};

/// The main handler for creating and locking a new SPL token.
pub fn handle(
    ctx: Context<CreateMemeToken>,
    name: String,
    symbol: String,
    decimals: u8,
    total_supply: u64,
) -> Result<()> {
    // 1. Populate MemeTokenState
    let token_state = &mut ctx.accounts.meme_token_state;
    token_state.creator = *ctx.accounts.creator.key;
    token_state.mint = ctx.accounts.mint.key();
    token_state.name = name.clone();
    token_state.symbol = symbol.clone();
    token_state.total_supply = total_supply;
    token_state.decimals = decimals;

    // 2. Initialize the SPL Mint
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        InitializeMint {
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );
    token::initialize_mint(cpi_ctx, decimals, &ctx.accounts.mint_authority.key(), None)?;

    // 3. Mint the total supply to the recipient's token account
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

    // 4. Set the mint authority to None => supply locked
    let cpi_ctx_set_auth = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
            account_or_mint: ctx.accounts.mint.to_account_info(),
            current_authority: ctx.accounts.mint_authority.to_account_info(),
        },
    );
    token::set_authority(cpi_ctx_set_auth, AuthorityType::MintTokens, None)?;

    msg!(
        "Created memecoin {} with symbol {}, supply locked at {}",
        name,
        symbol,
        total_supply
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, decimals: u8, total_supply: u64)]
pub struct CreateMemeToken<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 32 + (4 + name.len()) + (4 + symbol.len()) + 8 + 1
    )]
    pub meme_token_state: Account<'info, MemeTokenState>,

    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub recipient_ata: AccountInfo<'info>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, token::Token>,

    pub rent: Sysvar<'info, Rent>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}
