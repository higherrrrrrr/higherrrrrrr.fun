use anchor_lang::prelude::*;

/// Enum representing the type of token evolution.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TokenType {
    Regular,
    TextEvolution,
    ImageEvolution,
}

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
    /// Default image for the token.
    pub image: String,
    /// The token type: Regular, TextEvolution, or ImageEvolution.
    pub token_type: TokenType,
}
