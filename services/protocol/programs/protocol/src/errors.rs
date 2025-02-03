use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow in multiplication, supply too large?")]
    Overflow,

    #[msg("Unauthorized operation")]
    Unauthorized,

    #[msg("Insufficient token balance to meet threshold")]
    InsufficientBalance,

    #[msg("Invalid price data or aggregator input")]
    InvalidPriceData,

    #[msg("Invalid distribution percentages; pre-mine must be 35% and pool must be 65% with exactly one pool distribution.")]
    InvalidDistributionPercentage,

    #[msg("Token account mint does not match expected memecoin mint.")]
    InvalidTokenAccount,
}
