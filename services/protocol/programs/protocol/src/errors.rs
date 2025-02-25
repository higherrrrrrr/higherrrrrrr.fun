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

    #[msg("LP fee account provided does not match the expected account.")]
    InvalidLPFeeAccount,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Invalid pool configuration")]
    InvalidPoolConfig,

    #[msg("Invalid input parameters")]
    InvalidInput,

    #[msg("Fee rate too high")]
    FeeTooHigh,

    #[msg("Reentrancy detected")]
    ReentrancyDetected,

    #[msg("Math error")]
    MathError,

    #[msg("Invalid fee configuration")]
    InvalidFeeConfig,

    #[msg("Invalid creator address")]
    InvalidCreatorAddress,
    
    #[msg("Invalid distribution address")]
    InvalidDistributionAddress,
    
    #[msg("Circuit breaker active, trading restricted")]
    CircuitBreakerActive,
    
    #[msg("Evolution threshold too high")]
    ThresholdTooHigh,
    
    #[msg("Invalid volume update")]
    InvalidVolumeUpdate,
    
    #[msg("Transaction expired")]
    TransactionExpired,
    
    #[msg("Invalid URI format")]
    InvalidUri,
}
