use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo, Burn};
use num_traits::{CheckedAdd, CheckedSub, CheckedMul, CheckedDiv};
use thiserror::Error;

declare_id!("Amm1111111111111111111111111111111111111111");

#[program]
pub mod amm {
    use super::*;

    /// Initializes the AMM pool. Creates a new AmmPool state account with token vaults and LP mint.
    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.token_a_vault = ctx.accounts.token_a_vault.key();
        pool.token_b_vault = ctx.accounts.token_b_vault.key();
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.token_a_reserve = 0;
        pool.token_b_reserve = 0;
        pool.total_lp_supply = 0;
        Ok(())
    }

    /// Adds liquidity to the pool by transferring token A and token B from the user into the pool vaults.
    /// Mints LP tokens to the user proportional to the liquidity added.
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        // Transfer token A from user to pool vault.
        token::transfer(ctx.accounts.transfer_token_a_ctx(), amount_a)?;
        // Transfer token B from user to pool vault.
        token::transfer(ctx.accounts.transfer_token_b_ctx(), amount_b)?;

        let pool = &mut ctx.accounts.pool;
        // Calculate LP tokens to mint.
        let lp_tokens_to_mint = if pool.total_lp_supply == 0 {
            // Initial liquidity: mint sqrt(amount_a * amount_b)
            integer_sqrt(amount_a.checked_mul(amount_b).ok_or(ErrorCode::Overflow)?)
        } else {
            // Subsequent liquidity: mint the minimum proportional amount.
            let lp_from_a = amount_a
                .checked_mul(pool.total_lp_supply)
                .ok_or(ErrorCode::Overflow)?
                .checked_div(pool.token_a_reserve)
                .ok_or(ErrorCode::Overflow)?;
            let lp_from_b = amount_b
                .checked_mul(pool.total_lp_supply)
                .ok_or(ErrorCode::Overflow)?
                .checked_div(pool.token_b_reserve)
                .ok_or(ErrorCode::Overflow)?;
            std::cmp::min(lp_from_a, lp_from_b)
        };

        // Update pool reserves.
        pool.token_a_reserve = pool
            .token_a_reserve
            .checked_add(amount_a)
            .ok_or(ErrorCode::Overflow)?;
        pool.token_b_reserve = pool
            .token_b_reserve
            .checked_add(amount_b)
            .ok_or(ErrorCode::Overflow)?;
        pool.total_lp_supply = pool
            .total_lp_supply
            .checked_add(lp_tokens_to_mint)
            .ok_or(ErrorCode::Overflow)?;

        // Mint LP tokens to the user.
        token::mint_to(ctx.accounts.mint_lp_ctx(), lp_tokens_to_mint)?;
        Ok(())
    }

    /// Removes liquidity from the pool by burning LP tokens from the user.
    /// Transfers tokens A and B back to the user proportional to their share.
    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, lp_amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(lp_amount > 0, ErrorCode::InvalidAmount);
        require!(
            lp_amount <= pool.total_lp_supply,
            ErrorCode::InsufficientLiquidity
        );

        // Calculate amounts to return.
        let amount_a = lp_amount
            .checked_mul(pool.token_a_reserve)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(pool.total_lp_supply)
            .ok_or(ErrorCode::Overflow)?;
        let amount_b = lp_amount
            .checked_mul(pool.token_b_reserve)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(pool.total_lp_supply)
            .ok_or(ErrorCode::Overflow)?;

        // Burn LP tokens from user.
        token::burn(ctx.accounts.burn_lp_ctx(), lp_amount)?;

        // Update pool reserves.
        pool.token_a_reserve = pool
            .token_a_reserve
            .checked_sub(amount_a)
            .ok_or(ErrorCode::Overflow)?;
        pool.token_b_reserve = pool
            .token_b_reserve
            .checked_sub(amount_b)
            .ok_or(ErrorCode::Overflow)?;
        pool.total_lp_supply = pool
            .total_lp_supply
            .checked_sub(lp_amount)
            .ok_or(ErrorCode::Overflow)?;

        // Transfer tokens from pool vaults to user.
        token::transfer(ctx.accounts.transfer_token_a_to_user_ctx(), amount_a)?;
        token::transfer(ctx.accounts.transfer_token_b_to_user_ctx(), amount_b)?;
        Ok(())
    }

    /// Executes a token swap within the pool.
    /// The `direction` parameter specifies the input token:
    /// - AtoB: user sends token A and receives token B.
    /// - BtoA: user sends token B and receives token A.
    /// Uses a constant-product invariant with a fee (here set to 1%).
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        direction: SwapDirection,
    ) -> Result<()> {
        // Set fee parameters: 1% fee means fee_numerator = 990, denominator = 1000.
        let fee_numerator: u64 = 990;
        let fee_denominator: u64 = 1000;

        if direction == SwapDirection::AtoB {
            // Transfer token A from user to pool vault.
            token::transfer(ctx.accounts.transfer_token_source_ctx(), amount_in)?;
            let pool = &mut ctx.accounts.pool;
            let reserve_in = pool.token_a_reserve;
            let reserve_out = pool.token_b_reserve;
            let new_reserve_in = reserve_in.checked_add(amount_in).ok_or(ErrorCode::Overflow)?;
            // Calculate output amount with fee.
            let numerator = amount_in
                .checked_mul(fee_numerator)
                .ok_or(ErrorCode::Overflow)?
                .checked_mul(reserve_out)
                .ok_or(ErrorCode::Overflow)?;
            let denominator = reserve_in
                .checked_mul(fee_denominator)
                .ok_or(ErrorCode::Overflow)?
                .checked_add(amount_in.checked_mul(fee_numerator).ok_or(ErrorCode::Overflow)?)
                .ok_or(ErrorCode::Overflow)?;
            let amount_out = numerator.checked_div(denominator).ok_or(ErrorCode::Overflow)?;
            require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);
            // Transfer token B from pool vault to user.
            token::transfer(ctx.accounts.transfer_token_destination_ctx(), amount_out)?;
            // Update pool reserves.
            pool.token_a_reserve = new_reserve_in;
            pool.token_b_reserve = pool
                .token_b_reserve
                .checked_sub(amount_out)
                .ok_or(ErrorCode::Overflow)?;
        } else {
            // Swap direction: BtoA.
            token::transfer(ctx.accounts.transfer_token_source_ctx(), amount_in)?;
            let pool = &mut ctx.accounts.pool;
            let reserve_in = pool.token_b_reserve;
            let reserve_out = pool.token_a_reserve;
            let new_reserve_in = reserve_in.checked_add(amount_in).ok_or(ErrorCode::Overflow)?;
            let numerator = amount_in
                .checked_mul(fee_numerator)
                .ok_or(ErrorCode::Overflow)?
                .checked_mul(reserve_out)
                .ok_or(ErrorCode::Overflow)?;
            let denominator = reserve_in
                .checked_mul(fee_denominator)
                .ok_or(ErrorCode::Overflow)?
                .checked_add(amount_in.checked_mul(fee_numerator).ok_or(ErrorCode::Overflow)?)
                .ok_or(ErrorCode::Overflow)?;
            let amount_out = numerator.checked_div(denominator).ok_or(ErrorCode::Overflow)?;
            require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);
            token::transfer(ctx.accounts.transfer_token_destination_ctx(), amount_out)?;
            pool.token_b_reserve = new_reserve_in;
            pool.token_a_reserve = pool
                .token_a_reserve
                .checked_sub(amount_out)
                .ok_or(ErrorCode::Overflow)?;
        }
        Ok(())
    }
}

/// Helper function to compute the integer square root using Newton's method.
fn integer_sqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

/// Enum to indicate swap direction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SwapDirection {
    AtoB,
    BtoA,
}

/// Error codes for the AMM.
#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Invalid swap amount")]
    InvalidAmount,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
}

/// The state of the AMM pool.
#[account]
pub struct AmmPool {
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub lp_mint: Pubkey,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub total_lp_supply: u64,
}

/// Context for initializing the AMM pool.
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = payer, space = 8 + 32 * 3 + 8 * 3)]
    pub pool: Account<'info, AmmPool>,

    /// CHECK: This account is used as the token A vault.
    #[account(mut)]
    pub token_a_vault: AccountInfo<'info>,

    /// CHECK: This account is used as the token B vault.
    #[account(mut)]
    pub token_b_vault: AccountInfo<'info>,

    /// The LP token mint.
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Context for adding liquidity.
#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, AmmPool>,

    /// User's token A account.
    #[account(mut)]
    pub user_token_a: AccountInfo<'info>,

    /// Pool's token A vault.
    #[account(mut)]
    pub token_a_vault: AccountInfo<'info>,

    /// User's token B account.
    #[account(mut)]
    pub user_token_b: AccountInfo<'info>,

    /// Pool's token B vault.
    #[account(mut)]
    pub token_b_vault: AccountInfo<'info>,

    /// LP token mint.
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,

    /// User's LP token account.
    #[account(mut)]
    pub user_lp_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> AddLiquidity<'info> {
    /// CPI context to transfer token A from user to pool vault.
    pub fn transfer_token_a_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token_a.clone(),
            to: self.token_a_vault.clone(),
            authority: self.user_token_a.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    /// CPI context to transfer token B from user to pool vault.
    pub fn transfer_token_b_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token_b.clone(),
            to: self.token_b_vault.clone(),
            authority: self.user_token_b.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    /// CPI context to mint LP tokens to the user.
    pub fn mint_lp_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.lp_mint.clone(),
            to: self.user_lp_account.clone(),
            // In a real implementation, use the pool authority (a PDA) as the mint authority.
            authority: self.lp_mint.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// Context for removing liquidity.
#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, AmmPool>,

    /// User's LP token account.
    #[account(mut)]
    pub user_lp_account: AccountInfo<'info>,

    /// LP token mint.
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,

    /// Pool's token A vault.
    #[account(mut)]
    pub token_a_vault: AccountInfo<'info>,

    /// User's token A account.
    #[account(mut)]
    pub user_token_a: AccountInfo<'info>,

    /// Pool's token B vault.
    #[account(mut)]
    pub token_b_vault: AccountInfo<'info>,

    /// User's token B account.
    #[account(mut)]
    pub user_token_b: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> RemoveLiquidity<'info> {
    pub fn burn_lp_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.lp_mint.clone(),
            to: self.user_lp_account.clone(),
            authority: self.user_lp_account.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    pub fn transfer_token_a_to_user_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_a_vault.clone(),
            to: self.user_token_a.clone(),
            authority: self.token_a_vault.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    pub fn transfer_token_b_to_user_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.token_b_vault.clone(),
            to: self.user_token_b.clone(),
            authority: self.token_b_vault.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// Context for swapping tokens.
#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, AmmPool>,

    /// For the swap, this account is the user's source token account.
    #[account(mut)]
    pub user_source: AccountInfo<'info>,

    /// The pool's source vault (depends on swap direction).
    #[account(mut)]
    pub source_vault: AccountInfo<'info>,

    /// The pool's destination vault.
    #[account(mut)]
    pub destination_vault: AccountInfo<'info>,

    /// The user's destination token account.
    #[account(mut)]
    pub user_destination: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Swap<'info> {
    /// CPI context to transfer tokens from user to pool (source).
    pub fn transfer_token_source_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_source.clone(),
            to: self.source_vault.clone(),
            authority: self.user_source.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    /// CPI context to transfer tokens from pool (destination) to user.
    pub fn transfer_token_destination_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.destination_vault.clone(),
            to: self.user_destination.clone(),
            authority: self.destination_vault.clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[error_code]
pub enum AmmError {
    #[msg("Insufficient liquidity for swap")]
    InsufficientLiquidity,
    #[msg("Invalid swap amount")]
    InvalidAmount,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Pool imbalanced")]
    PoolImbalanced,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
pub struct Pool {
    pub token_a_account: Pubkey,
    pub token_b_account: Pubkey,
    pub token_a_amount: u64,
    pub token_b_amount: u64,
    pub fee_numerator: u64,
    pub fee_denominator: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

impl Pool {
    pub fn initialize(
        &mut self,
        token_a_account: Pubkey,
        token_b_account: Pubkey,
        authority: Pubkey,
        bump: u8,
    ) -> Result<()> {
        self.token_a_account = token_a_account;
        self.token_b_account = token_b_account;
        self.token_a_amount = 0;
        self.token_b_amount = 0;
        self.fee_numerator = 3;
        self.fee_denominator = 1000;
        self.authority = authority;
        self.bump = bump;
        Ok(())
    }

    pub fn calculate_swap_amount(
        &self,
        amount_in: u64,
        reserve_in: u64,
        reserve_out: u64,
    ) -> Result<u64> {
        // Constant product formula: k = x * y
        // New y = k / (x + amount_in)
        // Amount out = y - new_y

        // Calculate fee
        let amount_in_with_fee = amount_in
            .checked_mul(self.fee_denominator.checked_sub(self.fee_numerator).unwrap())
            .unwrap()
            .checked_div(self.fee_denominator)
            .unwrap();

        let numerator = amount_in_with_fee
            .checked_mul(reserve_out)
            .ok_or(AmmError::InsufficientLiquidity)?;

        let denominator = reserve_in
            .checked_add(amount_in_with_fee)
            .ok_or(AmmError::InsufficientLiquidity)?;

        let amount_out = numerator
            .checked_div(denominator)
            .ok_or(AmmError::InsufficientLiquidity)?;

        Ok(amount_out)
    }
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_b_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub user: Signer<'info>,
}
