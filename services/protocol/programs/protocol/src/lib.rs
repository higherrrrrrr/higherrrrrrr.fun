use anchor_lang::prelude::*;

// 1. Import your other modules
pub mod errors;
pub mod instructions;
pub mod state;

// 2. Bring instructions into scope (optional)
use instructions::*;

// 3. Declare the program ID
declare_id!("Prot111111111111111111111111111111111111111");

// 4. The main Anchor program definition
#[program]
pub mod protocol {
    use super::*;

    // Example minimal instruction from Step 1
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Memecoin Protocol!");
        Ok(())
    }

    // -------------------- Step 2: Create Token --------------------
    /// Creates a new memecoin by initializing the mint, setting evolution thresholds and distributions,
    /// and locking the mint authority.
    ///
    /// Parameters:
    /// - `name`: The name of the token.
    /// - `symbol`: The token symbol.
    /// - `decimals`: The decimal places.
    /// - `total_supply`: The total token supply.
    /// - `image`: A default image URI.
    /// - `token_type`: The type of token evolution: Regular, TextEvolution, or ImageEvolution.
    /// - `evolutions`: A vector of evolution items (price thresholds with new name/URI).
    /// - `distributions`: A vector of distribution instructions.
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

    // -------------------- Step 3: Evolutions --------------------
    pub fn set_evolutions(
        ctx: Context<SetEvolutions>,
        items: Vec<state::evolution_data::EvolutionItem>,
    ) -> Result<()> {
        instructions::evolutions::handle_set_evolutions(ctx, items)
    }

    pub fn update_meme_metadata(
        ctx: Context<UpdateMemeMetadata>,
        current_price: u64,
    ) -> Result<()> {
        instructions::evolutions::handle_update_meme_metadata(ctx, current_price)
    }

    // -------------------- Step 4: SimpleAMM Pool Functions --------------------
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_rate: u64,
        bump: u8,
    ) -> Result<()> {
        instructions::simple_amm::initialize_pool(ctx, fee_rate, bump)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a_desired: u64,
        amount_b_desired: u64,
        amount_a_min: u64,
        amount_b_min: u64,
    ) -> Result<()> {
        instructions::simple_amm::add_liquidity(
            ctx,
            amount_a_desired,
            amount_b_desired,
            amount_a_min,
            amount_b_min,
        )
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        liquidity: u64,
        amount_a_min: u64,
        amount_b_min: u64,
    ) -> Result<()> {
        instructions::simple_amm::remove_liquidity(
            ctx,
            liquidity,
            amount_a_min,
            amount_b_min,
        )
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        instructions::simple_amm::swap(
            ctx,
            amount_in,
            min_amount_out,
        )
    }

    pub fn add_single_sided_liquidity(
        ctx: Context<AddSingleSidedLiquidity>,
        amount_in: u64,
    ) -> Result<()> {
        instructions::simple_amm::add_single_sided_liquidity(ctx, amount_in)
    }

    pub fn collect_fees(
        ctx: Context<CollectFees>,
    ) -> Result<()> {
        instructions::simple_amm::collect_fees(ctx)
    }

    // -------------------- Step 5: Conviction NFTs --------------------
    pub fn register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
        instructions::conviction_nfts::handle_register_holder(ctx)
    }

    pub fn distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
        instructions::conviction_nfts::handle_distribute_conviction_nfts(ctx)
    }

    // -------------------- Step 6: Fee Distribution --------------------
    pub fn init_fee_vault(ctx: Context<InitFeeVault>) -> Result<()> {
        instructions::fee_distribution::handle_init_fee_vault(ctx)
    }

    pub fn withdraw_protocol_sol(
        ctx: Context<WithdrawProtocolSol>,
        amount: u64
    ) -> Result<()> {
        instructions::fee_distribution::handle_withdraw_protocol_sol(ctx, amount)
    }

    pub fn withdraw_creator_tokens(
        ctx: Context<WithdrawCreatorTokens>,
        amount: u64
    ) -> Result<()> {
        instructions::fee_distribution::handle_withdraw_creator_tokens(ctx, amount)
    }
    
    pub fn distribute_lp_fees(ctx: Context<DistributeLPFees>) -> Result<()> {
        instructions::fee_distribution::handle_distribute_lp_fees(ctx)
    }

    // Add the distribute_fees instruction
    pub fn distribute_fees(
        ctx: Context<DistributeFees>,
        token_a_protocol_amount: u64,
        token_a_creator_amount: u64,
        token_b_protocol_amount: u64,
        token_b_creator_amount: u64,
    ) -> Result<()> {
        instructions::simple_amm::distribute_fees(
            ctx,
            token_a_protocol_amount,
            token_a_creator_amount,
            token_b_protocol_amount,
            token_b_creator_amount,
        )
    }
}

// An optional trivial struct for a minimal "initialize" instruction
#[derive(Accounts)]
pub struct Initialize {}
