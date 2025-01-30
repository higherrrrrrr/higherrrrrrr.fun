use anchor_lang::prelude::*;

/// Stores references to fee vault accounts (SOL side vs. token side).
/// Used in Step 6 to collect fees for the protocol and the creator.
#[account]
pub struct FeeVault {
    /// A system-owned account or wSOL account to accumulate SOL-based fees
    pub protocol_sol_vault: Pubkey,

    /// A token account (SPL) to accumulate memecoin-based fees
    pub creator_token_vault: Pubkey,

    /// The authority (Pubkey) that can withdraw SOL fees
    pub protocol_pubkey: Pubkey,

    /// The authority (Pubkey) that can withdraw token fees
    pub creator_pubkey: Pubkey,

    /// (Optional) A token account for storing LP tokens if the protocol invests fees into liquidity
    pub lp_token_vault: Pubkey,
}
