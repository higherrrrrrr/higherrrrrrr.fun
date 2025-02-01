use anchor_lang::prelude::*;

/// Tracks addresses that hold ≥ some fraction (e.g. 0.42069%) of the token supply.
/// Used in Step 5 to award Conviction NFTs.
#[account]
pub struct ConvictionRegistry {
    /// Which memecoin this registry belongs to
    pub token_mint: Pubkey,

    /// Current count of addresses in `holders`
    pub holder_count: u32,

    /// The addresses that have registered as "big holders"
    pub holders: Vec<Pubkey>,
}
