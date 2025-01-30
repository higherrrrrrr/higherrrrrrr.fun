use anchor_lang::prelude::*;

/// Stores core info about a memecoin deployed via `create_meme_token`.
#[account]
pub struct MemeTokenState {
    /// The wallet (creator) that initiated this memecoin's creation
    pub creator: Pubkey,

    /// The SPL token mint address (with fixed supply, locked authority)
    pub mint: Pubkey,

    /// Human-readable token name (e.g. "CULT")
    pub name: String,

    /// Symbol (e.g. "CULT")
    pub symbol: String,

    /// Display supply ignoring decimals (e.g. 1,000,000,000).
    /// The actual raw supply = total_supply * 10^decimals
    pub total_supply: u64,

    /// Number of decimals (commonly 9 on Solana)
    pub decimals: u8,
}
