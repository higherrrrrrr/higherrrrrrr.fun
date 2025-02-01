use anchor_lang::prelude::*;

/// Holds threshold-based evolution rules (Step 3).
#[account]
pub struct EvolutionData {
    /// Authority that can set evolutions (often the same as MemeTokenState.creator or a designated PDA).
    pub owner: Pubkey,

    /// Number of evolutions defined
    pub evolution_count: u8,

    /// The actual list of `(price_threshold, new_name, new_uri)` steps
    pub evolutions: Vec<EvolutionItem>,
}

/// A single evolution rule:
/// If `current_price >= price_threshold`, rename the token to `new_name`, set its URI to `new_uri`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EvolutionItem {
    pub price_threshold: u64,
    pub new_name: String,
    pub new_uri: String,
}
