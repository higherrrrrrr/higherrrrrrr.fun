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

    // Add more as needed...
}
