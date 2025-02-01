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
    pub fn create_meme_token(
        ctx: Context<CreateMemeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
    ) -> Result<()> {
        instructions::create_meme_token::handle(
            ctx,
            name,
            symbol,
            decimals,
            total_supply,
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

    // -------------------- Step 4: Trading & Single-Sided Liquidity --------------------
    pub fn trade_via_orca(
        ctx: Context<TradeViaOrca>,
        amount_in: u64,
        min_out: u64,
        current_price: u64,
    ) -> Result<()> {
        instructions::trade_orca::handle_trade_via_orca(
            ctx,
            amount_in,
            min_out,
            current_price,
        )
    }

    pub fn create_single_sided_liquidity(
        ctx: Context<CreateSingleSidedLiquidity>,
        amount: u64,
    ) -> Result<()> {
        instructions::trade_orca::handle_create_single_sided_liquidity(ctx, amount)
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

    /// New instruction: Distribute aggregated LP fees from the Orca pool fee account evenly.
    pub fn distribute_lp_fees(ctx: Context<DistributeLPFees>) -> Result<()> {
        instructions::fee_distribution::handle_distribute_lp_fees(ctx)
    }
}

// An optional trivial struct for a minimal “initialize” instruction
#[derive(Accounts)]
pub struct Initialize {}
