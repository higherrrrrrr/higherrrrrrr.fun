use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod amm; // New AMM module

// Re-export instruction modules for easier access if desired.
pub use instructions::create_meme_token::*;
pub use instructions::evolutions::*;
pub use instructions::conviction_nfts::*;
pub use instructions::fee_distribution::*;

declare_id!("Prot111111111111111111111111111111111111111");

#[program]
pub mod protocol {
    use super::*;

    // Minimal initialize instruction.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Memecoin Protocol!");
        Ok(())
    }

    // -------------------- Meme Token Instructions --------------------

    /// Creates a new memecoin (see instructions/create_meme_token.rs)
    pub fn create_meme_token(
        ctx: Context<CreateMemeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        image: String,
        token_type: state::meme_token_state::TokenType,
        evolutions: Vec<state::evolution_data::EvolutionItem>,
        distributions: Vec<instructions::create_meme_token::DistributionInstruction>,
    ) -> Result<()> {
        instructions::create_meme_token::handle(
            ctx,
            name,
            symbol,
            decimals,
            total_supply,
            image,
            token_type,
            evolutions,
            distributions,
        )
    }

    /// Sets evolution thresholds (see instructions/evolutions.rs)
    pub fn set_evolutions(
        ctx: Context<SetEvolutions>,
        items: Vec<state::evolution_data::EvolutionItem>,
    ) -> Result<()> {
        instructions::evolutions::handle_set_evolutions(ctx, items)
    }

    /// Updates the token metadata if an evolution threshold is crossed.
    pub fn update_meme_metadata(
        ctx: Context<UpdateMemeMetadata>,
        current_price: u64,
    ) -> Result<()> {
        instructions::evolutions::handle_update_meme_metadata(ctx, current_price)
    }

    // -------------------- Conviction NFT Instructions --------------------

    /// Registers a holder as a "big holder" eligible for conviction NFTs.
    pub fn register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
        instructions::conviction_nfts::handle_register_holder(ctx)
    }

    /// Distributes conviction NFTs to qualified holders.
    pub fn distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
        instructions::conviction_nfts::handle_distribute_conviction_nfts(ctx)
    }

    // -------------------- Fee Distribution Instructions --------------------

    /// Initializes the fee vault.
    pub fn init_fee_vault(ctx: Context<InitFeeVault>) -> Result<()> {
        instructions::fee_distribution::handle_init_fee_vault(ctx)
    }

    /// Withdraws SOL fees for the protocol.
    pub fn withdraw_protocol_sol(
        ctx: Context<WithdrawProtocolSol>,
        amount: u64,
    ) -> Result<()> {
        instructions::fee_distribution::handle_withdraw_protocol_sol(ctx, amount)
    }

    /// Withdraws token fees for the creator.
    pub fn withdraw_creator_tokens(
        ctx: Context<WithdrawCreatorTokens>,
        amount: u64,
    ) -> Result<()> {
        instructions::fee_distribution::handle_withdraw_creator_tokens(ctx, amount)
    }

    /// Distributes aggregated LP fees evenly between the protocol and the creator.
    pub fn distribute_lp_fees(ctx: Context<DistributeLPFees>) -> Result<()> {
        instructions::fee_distribution::handle_distribute_lp_fees(ctx)
    }

    // -------------------- AMM Module Instructions --------------------

    /// Initializes a new AMM pool.
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        bump: u8,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.initialize(
            ctx.accounts.token_a_account.key(),
            ctx.accounts.token_b_account.key(),
            ctx.accounts.authority.key(),
            bump,
        )
    }

    /// Adds liquidity to the AMM pool.
    pub fn add_liquidity(
        ctx: Context<amm::AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        amm::add_liquidity(ctx, amount_a, amount_b)
    }

    /// Removes liquidity from the AMM pool.
    pub fn remove_liquidity(ctx: Context<amm::RemoveLiquidity>, lp_amount: u64) -> Result<()> {
        amm::remove_liquidity(ctx, lp_amount)
    }

    /// Executes a token swap in the AMM pool.
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        
        // Calculate swap amount
        let amount_out = pool.calculate_swap_amount(
            amount_in,
            ctx.accounts.pool_token_a_account.amount,
            ctx.accounts.pool_token_b_account.amount,
        )?;

        // Verify slippage
        require!(
            amount_out >= minimum_amount_out,
            AmmError::SlippageExceeded
        );

        // Transfer tokens (implementation needed)
        // This would involve CPI calls to the token program
        
        Ok(())
    }
}

// A minimal initialize context for the protocol.
#[derive(Accounts)]
pub struct Initialize {}
