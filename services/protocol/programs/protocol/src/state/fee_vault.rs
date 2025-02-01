use anchor_lang::prelude::*;

#[account]
pub struct FeeVault {
    /// A system-owned account or wSOL account to accumulate SOL-based fees for the protocol.
    pub protocol_sol_vault: Pubkey,

    /// A system-owned account or wSOL account to accumulate SOL-based fees for the creator.
    pub creator_sol_vault: Pubkey,

    /// A token account (SPL) to accumulate memecoin-based fees.
    pub creator_token_vault: Pubkey,

    /// The authority (Pubkey) that can withdraw SOL fees.
    pub protocol_pubkey: Pubkey,

    /// The authority (Pubkey) that can withdraw token fees.
    pub creator_pubkey: Pubkey,

    /// (Optional) A token account for storing LP tokens if the protocol invests fees into liquidity.
    pub lp_token_vault: Pubkey,
}
