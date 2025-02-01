// File: state/meme_token_state.rs

use anchor_lang::prelude::*;

/// Stores core info about a memecoin deployed via `create_meme_token`.
#[account]
pub struct MemeTokenState {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub decimals: u8,
    /// The pool deposit account (used for single-sided liquidity).
    pub pool: Pubkey,
}
