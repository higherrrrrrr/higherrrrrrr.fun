use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};
use crate::errors::ErrorCode;

#[account]
#[derive(Default)]
pub struct Pool {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub lp_mint: Pubkey,
    pub fee_rate: u64,  // Now serves as base fee in basis points
    pub fee_account: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
    pub accumulated_fee_a: u64,
    pub accumulated_fee_b: u64,
    pub is_locked: bool,  // Reentrancy lock
    
    // New fields for dynamic fees
    pub variable_factor: u64,      // Variable fee control parameter (A)
    pub volatility_accumulator: u64, // Current volatility accumulator (va)
    pub volatility_reference: u64,  // Volatility reference (vr)
    pub last_price_reference: u64, // Last price reference for volatility calculation
    pub last_swap_timestamp: i64,  // Timestamp of last swap
    pub filter_period: u64,        // Filter period (tf) in seconds
    pub decay_period: u64,         // Decay period (td) in seconds
    pub decay_factor: u64,         // Decay factor (R) in basis points (5000 = 0.5)
}

pub fn initialize_pool(
    ctx: Context<InitializePool>,
    base_fee_rate: u64,
    variable_factor: u64,
    filter_period: u64,
    decay_period: u64,
    decay_factor: u64,
    bump: u8,
) -> Result<()> {
    // Add maximum fee rate validation
    require!(base_fee_rate <= 1000, ErrorCode::FeeTooHigh);
    require!(filter_period < decay_period, ErrorCode::InvalidFeeConfig);
    require!(decay_factor <= 10000, ErrorCode::InvalidFeeConfig);
    
    let pool = &mut ctx.accounts.pool;
    
    // Set existing fields
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.token_a_vault = ctx.accounts.token_a_vault.key();
    pool.token_b_vault = ctx.accounts.token_b_vault.key();
    pool.lp_mint = ctx.accounts.lp_mint.key();
    pool.fee_rate = base_fee_rate;
    pool.fee_account = ctx.accounts.fee_account.key();
    pool.authority = ctx.accounts.authority.key();
    pool.bump = bump;
    
    // Set dynamic fee fields
    pool.variable_factor = variable_factor;
    pool.volatility_accumulator = 0;
    pool.volatility_reference = 0;
    pool.last_price_reference = 0;
    pool.last_swap_timestamp = ctx.accounts.clock.unix_timestamp;
    pool.filter_period = filter_period;
    pool.decay_period = decay_period;
    pool.decay_factor = decay_factor;
    
    msg!("Pool initialized with fee rate: {} basis points", base_fee_rate);
    emit!(PoolCreatedEvent {
        pool: ctx.accounts.pool.key(),
        token_a_mint: ctx.accounts.token_a_mint.key(),
        token_b_mint: ctx.accounts.token_b_mint.key(),
        fee_rate: base_fee_rate,
        creator: ctx.accounts.authority.key(),
    });
    Ok(())
}

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a_desired: u64,
    amount_b_desired: u64,
    amount_a_min: u64,
    amount_b_min: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    
    // Get current balances
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;
    
    // Calculate optimal amounts
    let (amount_a, amount_b) = if reserve_a == 0 && reserve_b == 0 {
        // First liquidity provision - accept desired amounts
        (amount_a_desired, amount_b_desired)
    } else {
        // Calculate based on current ratio
        let amount_b_optimal = amount_a_desired
            .checked_mul(reserve_b)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(reserve_a)
            .ok_or(ErrorCode::MathError)?;
        
        if amount_b_optimal <= amount_b_desired {
            // amount_a_desired is the limiting factor
            require!(
                amount_b_optimal >= amount_b_min,
                ErrorCode::SlippageExceeded
            );
            (amount_a_desired, amount_b_optimal)
        } else {
            // amount_b_desired is the limiting factor
            let amount_a_optimal = amount_b_desired.checked_mul(reserve_a).unwrap().checked_div(reserve_b).unwrap();
            require!(
                amount_a_optimal >= amount_a_min,
                ErrorCode::SlippageExceeded
            );
            (amount_a_optimal, amount_b_desired)
        }
    };
    
    // Transfer token_a from user to vault
    let cpi_ctx_a = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_a.to_account_info(),
            to: ctx.accounts.token_a_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi_ctx_a, amount_a)?;
    
    // Transfer token_b from user to vault
    let cpi_ctx_b = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_b.to_account_info(),
            to: ctx.accounts.token_b_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi_ctx_b, amount_b)?;
    
    // Calculate LP tokens to mint
    let total_supply = ctx.accounts.lp_mint.supply;
    let lp_tokens_to_mint = if total_supply == 0 {
        // First liquidity provision - use geometric mean to prevent manipulation
        let product = (amount_a as u128)
            .checked_mul(amount_b as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_sqrt()
            .ok_or(ErrorCode::MathError)?;
        
        u64::try_from(product)
            .map_err(|_| ErrorCode::Overflow)?
    } else {
        // Calculate based on ratio of tokens being added
        let lp_tokens_from_a = amount_a
            .checked_mul(total_supply)
            .unwrap()
            .checked_div(reserve_a)
            .unwrap();
        
        let lp_tokens_from_b = amount_b
            .checked_mul(total_supply)
            .unwrap()
            .checked_div(reserve_b)
            .unwrap();
        
        // Use the minimum to prevent manipulation
        std::cmp::min(lp_tokens_from_a, lp_tokens_from_b)
    };
    
    // Mint LP tokens to user
    let seeds = &[
        b"pool_authority",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_ctx_mint = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.user_lp_token.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        signer,
    );
    token::mint_to(cpi_ctx_mint, lp_tokens_to_mint)?;
    
    msg!("Added liquidity: {} token A, {} token B, minted {} LP tokens", amount_a, amount_b, lp_tokens_to_mint);
    emit!(LiquidityAddedEvent {
        pool: ctx.accounts.pool.key(),
        user: ctx.accounts.user.key(),
        amount_a,
        amount_b,
        lp_tokens_minted: lp_tokens_to_mint,
        timestamp: ctx.accounts.clock.unix_timestamp,
    });
    Ok(())
}

pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_amount: u64,
    min_a: u64,
    min_b: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    
    // Get current balances and total supply
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;
    let total_supply = ctx.accounts.lp_mint.supply;
    
    // Calculate token amounts to return based on proportion of LP tokens
    let amount_a = lp_amount.checked_mul(reserve_a).unwrap().checked_div(total_supply).unwrap();
    let amount_b = lp_amount.checked_mul(reserve_b).unwrap().checked_div(total_supply).unwrap();
    
    // Check slippage
    require!(
        amount_a >= min_a && amount_b >= min_b,
        ErrorCode::SlippageExceeded
    );
    
    // Burn LP tokens
    let cpi_ctx_burn = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.user_lp_token.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::burn(cpi_ctx_burn, lp_amount)?;
    
    // Transfer tokens from vaults to user
    let seeds = &[
        b"pool_authority",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_ctx_a = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.token_a_vault.to_account_info(),
            to: ctx.accounts.user_token_a.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx_a, amount_a)?;
    
    let cpi_ctx_b = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.token_b_vault.to_account_info(),
            to: ctx.accounts.user_token_b.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx_b, amount_b)?;
    
    msg!("Removed liquidity: {} LP tokens for {} token A and {} token B", lp_amount, amount_a, amount_b);
    Ok(())
}

// Jupiter-compatible swap function
pub fn swap(
    ctx: Context<Swap>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // Reentrancy protection
    require!(!pool.is_locked, ErrorCode::ReentrancyDetected);
    pool.is_locked = true;
    
    require!(amount_in > 0, ErrorCode::InvalidInput);
    
    // Get current reserves and determine swap direction
    let token_a_reserve = ctx.accounts.token_a_vault.amount;
    let token_b_reserve = ctx.accounts.token_b_vault.amount;
    
    let is_token_a_to_b = ctx.accounts.user_token_in.mint == pool.token_a_mint;
    
    let (reserve_in, reserve_out) = if is_token_a_to_b {
        (token_a_reserve, token_b_reserve)
    } else {
        (token_b_reserve, token_a_reserve)
    };
    
    // Calculate current price (scaled by 10^9 for precision)
    const PRICE_SCALE: u64 = 1_000_000_000;
    let current_price = reserve_out
        .checked_mul(PRICE_SCALE)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(reserve_in)
        .ok_or(ErrorCode::MathError)?;
    
    // Update volatility reference based on time elapsed
    let current_timestamp = ctx.accounts.clock.unix_timestamp;
    let time_elapsed = current_timestamp.saturating_sub(pool.last_swap_timestamp);
    
    let volatility_reference = if time_elapsed < pool.filter_period as i64 {
        // Keep the same volatility reference if within filter period
        pool.volatility_reference
    } else if time_elapsed < pool.decay_period as i64 {
        // Apply decay if within decay period
        pool.volatility_accumulator
            .checked_mul(pool.decay_factor)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathError)?
    } else {
        // Reset volatility if beyond decay period
        0
    };
    
    // Update price reference
    let price_reference = if time_elapsed < pool.filter_period as i64 {
        // Keep the same price reference if within filter period
        pool.last_price_reference
    } else {
        // Update to current price
        current_price
    };
    
    // Calculate price volatility (as absolute percentage change)
    let price_diff = if current_price > price_reference {
        current_price.saturating_sub(price_reference)
    } else {
        price_reference.saturating_sub(current_price)
    };
    
    let price_volatility = price_diff
        .checked_mul(10000)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(price_reference.max(1))
        .ok_or(ErrorCode::MathError)?;
    
    // Calculate volatility accumulator
    let volatility_accumulator = volatility_reference
        .checked_add(price_volatility)
        .ok_or(ErrorCode::Overflow)?;
    
    // Calculate base fee and variable fee
    let base_fee = pool.fee_rate;
    
    // Variable fee increases quadratically with volatility
    let variable_fee = pool.variable_factor
        .checked_mul(volatility_accumulator)
        .ok_or(ErrorCode::Overflow)?
        .checked_mul(volatility_accumulator)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::MathError)?;
    
    // Cap variable fee at reasonable maximum (e.g., 5%)
    let variable_fee = std::cmp::min(variable_fee, 500);
    
    // Calculate total fee rate
    let total_fee_rate = base_fee
        .checked_add(variable_fee)
        .ok_or(ErrorCode::Overflow)?;
    
    // Calculate fee amount
    let fee_amount = amount_in
        .checked_mul(total_fee_rate)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::Overflow)?;
    
    // Accumulate fees
    if is_token_a_to_b {
        pool.accumulated_fee_a = pool.accumulated_fee_a
            .checked_add(fee_amount)
            .ok_or(ErrorCode::Overflow)?;
    } else {
        pool.accumulated_fee_b = pool.accumulated_fee_b
            .checked_add(fee_amount)
            .ok_or(ErrorCode::Overflow)?;
    }
    
    // Calculate amount after fee deduction
    let amount_in_with_fee = amount_in
        .checked_sub(fee_amount)
        .ok_or(ErrorCode::Overflow)?;
    
    // Calculate swap result using constant product formula
    let product = reserve_in
        .checked_mul(reserve_out)
        .ok_or(ErrorCode::Overflow)?;
    
    let new_reserve_in = reserve_in
        .checked_add(amount_in_with_fee)
        .ok_or(ErrorCode::Overflow)?;
    
    let new_reserve_out = product
        .checked_div(new_reserve_in)
        .ok_or(ErrorCode::MathError)?;
    
    let amount_out = reserve_out
        .checked_sub(new_reserve_out)
        .ok_or(ErrorCode::InsufficientLiquidity)?;
    
    // Validate minimum amount out
    require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);
    
    // Update pool state for next calculations
    pool.volatility_reference = volatility_reference;
    pool.volatility_accumulator = volatility_accumulator;
    pool.last_price_reference = price_reference;
    pool.last_swap_timestamp = current_timestamp;
    
    // Perform token transfers
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_in.to_account_info(),
                to: if ctx.accounts.user_token_in.mint == pool.token_a_mint {
                    ctx.accounts.token_a_vault.to_account_info()
                } else {
                    ctx.accounts.token_b_vault.to_account_info()
                },
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_in,
    )?;
    
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: if ctx.accounts.user_token_in.mint == pool.token_a_mint {
                    ctx.accounts.token_b_vault.to_account_info()
                } else {
                    ctx.accounts.token_a_vault.to_account_info()
                },
                to: ctx.accounts.user_token_out.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&[
                b"pool_authority",
                pool.token_a_mint.as_ref(),
                pool.token_b_mint.as_ref(),
                &[pool.bump],
            ]],
        ),
        amount_out,
    )?;
    
    // Emit swap event with additional fee info
    emit!(SwapEvent {
        pool: ctx.accounts.pool.key(),
        token_a_mint: pool.token_a_mint,
        token_b_mint: pool.token_b_mint,
        user: ctx.accounts.user.key(),
        token_in_mint: ctx.accounts.user_token_in.mint,
        token_out_mint: ctx.accounts.user_token_out.mint,
        amount_in,
        amount_out,
        fee_amount,
        base_fee_rate: base_fee,
        variable_fee_rate: variable_fee,
        volatility: volatility_accumulator,
        timestamp: current_timestamp,
    });
    
    // Release lock
    pool.is_locked = false;
    Ok(())
}

// Define the swap event for Jupiter integration
#[event]
pub struct SwapEvent {
    pub pool: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub user: Pubkey,
    pub token_in_mint: Pubkey,
    pub token_out_mint: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee_amount: u64,
    pub base_fee_rate: u64,
    pub variable_fee_rate: u64,
    pub volatility: u64,
    pub timestamp: i64,  // Add timestamp for Jupiter analytics
}

// Function to add single-sided liquidity (just token A)
pub fn add_single_sided_liquidity_a(
    ctx: Context<AddSingleSidedLiquidity>,
    amount_a: u64,
    min_lp: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    
    // Get current balances
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;
    let total_supply = ctx.accounts.lp_mint.supply;
    
    // For first liquidity provision, we need both sides
    if total_supply == 0 {
        return Err(ErrorCode::InsufficientBalance.into());
    }
    
    // Transfer token_a from user to vault
    let cpi_ctx_a = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token.to_account_info(),
            to: ctx.accounts.token_a_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi_ctx_a, amount_a)?;
    
    // Calculate how much this single-sided addition affects the price
    // First, calculate the new constant k after adding token A
    let new_reserve_a = reserve_a.checked_add(amount_a).unwrap();
    
    // Calculate LP tokens to mint - proportional to the increase in sqrt(k)
    let old_k_sqrt = (reserve_a as f64 * reserve_b as f64).sqrt();
    let new_k_sqrt = (new_reserve_a as f64 * reserve_b as f64).sqrt();
    let k_sqrt_diff = new_k_sqrt - old_k_sqrt;
    
    let lp_amount = ((k_sqrt_diff / old_k_sqrt) * total_supply as f64) as u64;
    
    // Check minimum LP amount
    require!(
        lp_amount >= min_lp,
        ErrorCode::SlippageExceeded
    );
    
    // Mint LP tokens to user
    let seeds = &[
        b"pool_authority",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_ctx_mint = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.user_lp_token.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        signer,
    );
    token::mint_to(cpi_ctx_mint, lp_amount)?;
    
    msg!("Added single-sided liquidity: {} token A, minted {} LP tokens", amount_a, lp_amount);
    Ok(())
}

// Function for collecting fees
pub fn collect_fees(
    ctx: Context<CollectFees>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    
    let seeds = &[
        b"pool_authority",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];
    
    // Transfer token A fees if requested
    if amount_a > 0 {
        let cpi_ctx_a = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_a_vault.to_account_info(),
                to: ctx.accounts.fee_recipient_a.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx_a, amount_a)?;
    }
    
    // Transfer token B fees if requested
    if amount_b > 0 {
        let cpi_ctx_b = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_b_vault.to_account_info(),
                to: ctx.accounts.fee_recipient_b.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx_b, amount_b)?;
    }
    
    msg!("Collected fees: {} token A, {} token B", amount_a, amount_b);
    Ok(())
}

pub fn distribute_fees(
    ctx: Context<DistributeFees>,
    token_a_protocol_amount: u64,
    token_a_creator_amount: u64,
    token_b_protocol_amount: u64,
    token_b_creator_amount: u64,
) -> Result<()> {
    // Transfer token A fees to protocol and creator
    if token_a_protocol_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_a_vault.to_account_info(),
                    to: ctx.accounts.protocol_token_a_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&[
                    b"pool_authority",
                    ctx.accounts.pool.token_a_mint.as_ref(),
                    ctx.accounts.pool.token_b_mint.as_ref(),
                    &[ctx.accounts.pool.bump],
                ]],
            ),
            token_a_protocol_amount,
        )?;
    }
    
    if token_a_creator_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_a_vault.to_account_info(),
                    to: ctx.accounts.creator_token_a_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&[
                    b"pool_authority",
                    ctx.accounts.pool.token_a_mint.as_ref(),
                    ctx.accounts.pool.token_b_mint.as_ref(),
                    &[ctx.accounts.pool.bump],
                ]],
            ),
            token_a_creator_amount,
        )?;
    }
    
    // Transfer token B fees to protocol and creator
    if token_b_protocol_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_b_vault.to_account_info(),
                    to: ctx.accounts.protocol_token_b_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&[
                    b"pool_authority",
                    ctx.accounts.pool.token_a_mint.as_ref(),
                    ctx.accounts.pool.token_b_mint.as_ref(),
                    &[ctx.accounts.pool.bump],
                ]],
            ),
            token_b_protocol_amount,
        )?;
    }
    
    if token_b_creator_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_b_vault.to_account_info(),
                    to: ctx.accounts.creator_token_b_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&[
                    b"pool_authority",
                    ctx.accounts.pool.token_a_mint.as_ref(),
                    ctx.accounts.pool.token_b_mint.as_ref(),
                    &[ctx.accounts.pool.bump],
                ]],
            ),
            token_b_creator_amount,
        )?;
    }
    
    Ok(())
}

// Context structs
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<Pool>()
    )]
    pub pool: Account<'info, Pool>,
    
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = payer,
        token::mint = token_a_mint,
        token::authority = authority,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = payer,
        token::mint = token_b_mint,
        token::authority = authority,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = authority,
    )]
    pub lp_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = payer,
        token::mint = token_a_mint,
        token::authority = authority,
    )]
    pub fee_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is the pool authority PDA
    #[account(
        seeds = [
            b"pool_authority",
            token_a_mint.key().as_ref(),
            token_b_mint.key().as_ref()
        ],
        bump,
    )]
    pub authority: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    
    /// Clock for timestamp in event emission
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        constraint = user_token_in.owner == user.key(),
        constraint = (user_token_in.mint == pool.token_a_mint || user_token_in.mint == pool.token_b_mint)
    )]
    pub user_token_in: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = user_token_out.owner == user.key(),
        constraint = (user_token_out.mint == pool.token_a_mint || user_token_out.mint == pool.token_b_mint),
        constraint = user_token_in.mint != user_token_out.mint
    )]
    pub user_token_out: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    
    /// Clock for timestamp in event emission
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct AddSingleSidedLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        constraint = user_token_in.owner == user.key(),
        constraint = (user_token_in.mint == pool.token_a_mint || user_token_in.mint == pool.token_b_mint)
    )]
    pub user_token_in: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    
    /// Clock for timestamp in event emission
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CollectFees<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_recipient_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_recipient_b: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeFees<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        constraint = token_a_vault.mint == pool.token_a_mint,
        constraint = token_a_vault.key() == pool.token_a_vault,
    )]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = token_b_vault.mint == pool.token_b_mint,
        constraint = token_b_vault.key() == pool.token_b_vault,
    )]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_token_a_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_a_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_token_b_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_b_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [
            b"pool_authority",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref()
        ],
        bump = pool.bump,
    )]
    /// CHECK: This is the pool authority PDA
    pub pool_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BatchCollectFees<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// List of pools to collect fees from
    pub pools: Vec<Account<'info, Pool>>,
    
    // ... other accounts
}

// Add to ErrorCode enum
#[error_code]
pub enum ErrorCode {
    // ... existing errors
    #[msg("Invalid input parameters")]
    InvalidInput,
    #[msg("Fee rate too high")]
    FeeTooHigh,
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    #[msg("Invalid fee configuration")]
    InvalidFeeConfig,
}

// Add event for pool creation
#[event]
pub struct PoolCreatedEvent {
    pub pool: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub fee_rate: u64,
    pub creator: Pubkey,
}

/// Adds single-sided liquidity to the pool
/// 
/// # Warning
/// 
/// This function may cause significant price impact. When adding single-sided
/// liquidity, the price will shift to maintain the constant product formula.
/// This is intended primarily for initial liquidity provision.
/// 
/// # Parameters
/// 
/// * `ctx` - The context of accounts.
/// * `amount_in` - The amount of tokens to add.
pub fn add_single_sided_liquidity(
    ctx: Context<AddSingleSidedLiquidity>,
    amount_in: u64,
) -> Result<()> {
    require!(amount_in > 0, ErrorCode::InvalidInput);
    
    let pool = &ctx.accounts.pool;
    
    // Determine which token is being added
    let is_token_a = ctx.accounts.user_token_in.mint == pool.token_a_mint;
    
    // Get current reserves
    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;
    
    // If pool is empty, reject single-sided liquidity
    require!(
        reserve_a > 0 && reserve_b > 0,
        ErrorCode::InsufficientLiquidity
    );
    
    // Calculate price impact and new reserves
    let (new_reserve_a, new_reserve_b) = if is_token_a {
        let new_reserve_a = reserve_a.checked_add(amount_in).ok_or(ErrorCode::Overflow)?;
        // Maintain constant product: reserve_a * reserve_b = new_reserve_a * new_reserve_b
        let new_reserve_b = reserve_a
            .checked_mul(reserve_b)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(new_reserve_a)
            .ok_or(ErrorCode::MathError)?;
        (new_reserve_a, new_reserve_b)
    } else {
        let new_reserve_b = reserve_b.checked_add(amount_in).ok_or(ErrorCode::Overflow)?;
        let new_reserve_a = reserve_a
            .checked_mul(reserve_b)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(new_reserve_b)
            .ok_or(ErrorCode::MathError)?;
        (new_reserve_a, new_reserve_b)
    };
    
    // Calculate LP tokens to mint based on value increase
    let total_supply = ctx.accounts.lp_mint.supply;
    
    // Calculate the proportional increase in pool value
    let value_ratio = if is_token_a {
        amount_in
            .checked_mul(total_supply)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(reserve_a)
            .ok_or(ErrorCode::MathError)?
    } else {
        amount_in
            .checked_mul(total_supply)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(reserve_b)
            .ok_or(ErrorCode::MathError)?
    };
    
    // Mint LP tokens to user
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&[
                b"pool_authority",
                ctx.accounts.pool.token_a_mint.as_ref(),
                ctx.accounts.pool.token_b_mint.as_ref(),
                &[ctx.accounts.pool.bump],
            ]],
        ),
        value_ratio,
    )?;
    
    emit!(LiquidityAddedEvent {
        pool: ctx.accounts.pool.key(),
        user: ctx.accounts.user.key(),
        amount_a: if is_token_a { amount_in } else { 0 },
        amount_b: if is_token_a { 0 } else { amount_in },
        lp_tokens_minted: value_ratio,
        timestamp: ctx.accounts.clock.unix_timestamp,
    });
    
    Ok(())
}

#[event]
pub struct LiquidityAddedEvent {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_tokens_minted: u64,
    pub timestamp: i64,
} 