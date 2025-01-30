use anchor_lang::prelude::*;

declare_id!("Prot111111111111111111111111111111111111111");

#[program]
pub mod protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Memecoin Protocol!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct MemeTokenState {
    pub creator: Pubkey,        // The wallet that created this memecoin
    pub mint: Pubkey,           // The SPL token mint
    pub name: String,           // e.g. "CULT"
    pub symbol: String,         // e.g. "CULT"
    pub total_supply: u64,      // e.g. 1_000_000_000 ignoring decimals
    pub decimals: u8,           // typically 9
    // references to evolutionPDA, registryPDA, feeVaultPDA will come later in Steps 3,5,6
}

use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, Token, Mint, InitializeMint, MintTo, SetAuthority, AuthorityType
};

declare_id!("Prot111111111111111111111111111111111111111");

#[program]
pub mod protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Memecoin Protocol!");
        Ok(())
    }

    /// Creates a new SPL token (mint) with a fixed supply, mints
    /// that entire supply to an address, then sets the mint authority to None.
    pub fn create_meme_token(
        ctx: Context<CreateMemeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
    ) -> Result<()> {
        // 1. Populate MemeTokenState
        let token_state = &mut ctx.accounts.meme_token_state;
        token_state.creator = *ctx.accounts.creator.key;
        token_state.mint = ctx.accounts.mint.key();
        token_state.name = name.clone();
        token_state.symbol = symbol.clone();
        token_state.total_supply = total_supply;
        token_state.decimals = decimals;

        // 2. Initialize the SPL Mint
        // anchor_spl::token::initialize_mint requires:
        //   - mint
        //   - rent
        //   - mint_authority
        //   - decimals
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeMint {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        // decimals is passed in, e.g. 9
        token::initialize_mint(cpi_ctx, decimals, &ctx.accounts.mint_authority.key(), None)?;

        // 3. Mint the total supply
        // total_supply ignoring decimals means the raw amount minted is total_supply * 10^decimals
        // but if you want to store total_supply as "human-friendly" units, do the multiplication:
        let raw_amount = total_supply.checked_mul(10u64.pow(decimals as u32))
            .ok_or(ErrorCode::Overflow)?;

        // We'll MintTo the recipient's token account
        let cpi_ctx_mint_to = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.recipient_ata.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx_mint_to, raw_amount)?;

        // 4. Set mint authority to None => fixed supply
        let cpi_ctx_set_auth = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                account_or_mint: ctx.accounts.mint.to_account_info(),
                current_authority: ctx.accounts.mint_authority.to_account_info(),
            },
        );
        token::set_authority(cpi_ctx_set_auth, AuthorityType::MintTokens, None)?;

        msg!("Created memecoin {} with symbol {}, supply locked at {}", 
            name, symbol, total_supply);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, decimals: u8, total_supply: u64)]
pub struct CreateMemeToken<'info> {
    /// The user paying for the transaction, also the "creator".
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The new MemeTokenState account (PDA) that we store all info in.
    /// For example, seeds = [b"meme_token_state", creator.key().as_ref(), mint.key().as_ref()]
    /// We'll do a fixed space calc for the account
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 32 + (4 + name.len()) + (4 + symbol.len()) + 8 + 1
        // 8 for anchor's discriminator, plus field sizes
    )]
    pub meme_token_state: Account<'info, MemeTokenState>,

    /// The mint account for the new token (uninitialized)
    #[account(
        mut,
        constraint = mint.owner == &token::ID,
    )]
    pub mint: AccountInfo<'info>,

    /// The initial mint authority for creating and minting.
    /// We'll set it to None after we finish minting.
    #[account(mut)]
    pub mint_authority: Signer<'info>,

    /// The user's token account (ATA) that receives the minted supply
    /// We assume it's pre-created or we can create it if needed
    #[account(mut)]
    pub recipient_ata: AccountInfo<'info>,

    /// Standard Anchor contexts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

/// The on-chain state referencing this memecoin
#[account]
pub struct MemeTokenState {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub decimals: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow in multiplication, supply too large?")]
    Overflow,
}

#[account]
pub struct EvolutionData {
    pub owner: Pubkey,            // Authority that can set evolutions (likely the token creator or program)
    pub evolution_count: u8,      // how many evolutions are set
    // Typically an array or vector of EvolutionItem. If variable, store it carefully:
    pub evolutions: Vec<EvolutionItem>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EvolutionItem {
    pub price_threshold: u64,   // e.g. 1_000_000 = 0.0001, or direct integer if no decimals
    pub new_name: String,       // comedic or advanced updated name
    pub new_uri: String,        // optional link to new image or metadata
}


#[derive(Accounts)]
#[instruction(items: Vec<EvolutionItem>)]
pub struct SetEvolutions<'info> {
    // The authority authorized to set evolutions (e.g., the token creator)
    #[account(mut)]
    pub owner: Signer<'info>,

    // The evolution data account for this token
    #[account(
        mut,
        seeds = [b"evolution_data", token_mint.key().as_ref()],
        bump,
    )]
    pub evolution_data: Account<'info, EvolutionData>,

    // Possibly reference MemeTokenState if needed to check cross-data
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn set_evolutions(
    ctx: Context<SetEvolutions>,
    items: Vec<EvolutionItem>,
) -> Result<()> {
    let evo_data = &mut ctx.accounts.evolution_data;
    require_keys_eq!(evo_data.owner, ctx.accounts.owner.key(), ErrorCode::Unauthorized);

    // Clear or overwrite the existing list
    evo_data.evolution_count = items.len() as u8;
    evo_data.evolutions = items;  // You might want to limit size for account space

    msg!("Set {} evolutions for this token", evo_data.evolution_count);
    Ok(())
}

use mpl_token_metadata::instruction as mpl_instruction;
use mpl_token_metadata::state::Metadata; // if needed

#[derive(Accounts)]
pub struct UpdateMemeMetadata<'info> {
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    // The token mint we want to update
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    // The metadata account (PDA) derived from [ "metadata", token_metadata_program_id, mint_pubkey ]
    #[account(mut)]
    pub metadata: AccountInfo<'info>,

    // The update authority that can sign for Metaplex
    #[account(mut)]
    pub metadata_update_authority: Signer<'info>, // or a PDA with seeds

    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,

    // Possibly references to system_program, rent, etc., if you create PDAs on the fly
}

pub fn update_meme_metadata(
    ctx: Context<UpdateMemeMetadata>,
    current_price: u64,
) -> Result<()> {
    let evo_data = &ctx.accounts.evolution_data;

    // 1. Determine which evolution threshold is met
    let mut chosen_name = None;
    let mut chosen_uri = None;
    let mut highest_threshold = 0;

    for item in &evo_data.evolutions {
        if current_price >= item.price_threshold && item.price_threshold >= highest_threshold {
            chosen_name = Some(item.new_name.clone());
            chosen_uri = Some(item.new_uri.clone());
            highest_threshold = item.price_threshold;
        }
    }

    // If no threshold is met, do nothing or revert
    if chosen_name.is_none() {
        msg!("No evolution threshold crossed at price {}", current_price);
        return Ok(());
    }

    let final_name = chosen_name.unwrap();
    let final_uri = chosen_uri.unwrap();

    // 2. Construct the Metaplex instruction to update metadata
    // Using update_metadata_accounts_v2 or v3
    let ix = mpl_instruction::update_metadata_accounts_v2(
        *ctx.accounts.token_metadata_program.key,  // program_id
        ctx.accounts.metadata.key(),              // metadata pda
        ctx.accounts.metadata_update_authority.key(), // update authority
        None,                                     // new update authority if changing
        Some(mpl_token_metadata::state::DataV2 {
            name: final_name.clone(),
            symbol: String::from(""), // if you want to keep the original symbol, leave it empty or re-set
            uri: final_uri.clone(),
            seller_fee_basis_points: 0,  // for fungible tokens, typically 0
            creators: None,
            collection: None,
            uses: None,
        }),
        None,
        None,
    );

    // 3. Perform the CPI
    let accounts = [
        ctx.accounts.metadata.clone(),
        ctx.accounts.metadata_update_authority.to_account_info().clone(),
    ];
    invoke(&ix, &accounts)?;

    msg!(
        "Updated token metadata: new_name='{}', new_uri='{}', threshold={}",
        final_name,
        final_uri,
        highest_threshold
    );

    Ok(())
}

#[derive(Accounts)]
pub struct TradeViaOrca<'info> {
    // The user initiating the trade
    #[account(mut)]
    pub user: Signer<'info>,

    // The user’s source token account (could be SOL -> wSOL or the memecoin)
    #[account(mut)]
    pub user_in_token_account: AccountInfo<'info>,

    // The user’s destination token account
    #[account(mut)]
    pub user_out_token_account: AccountInfo<'info>,

    // Orca pool accounts. These vary depending on the pool:
    #[account(mut)]
    pub orca_pool_token_a: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_token_b: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_fee_account: AccountInfo<'info>,
    // ... possibly orca pool authority, token program, etc.

    // A reference to our MemeTokenState or EvolutionData if we want to store them
    // for price checking, or we can pass them separately
    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,
    #[account(mut)]
    pub evolution_data: Account<'info, EvolutionData>,

    // The token metadata program & metadata account if you want to do direct updates
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub metadata_update_authority: AccountInfo<'info>, // Could be a PDA or a signer

    // The Orca program
    #[account(address = <ORCA_PROGRAM_ID>)]
    pub orca_program: AccountInfo<'info>,

    // Possibly the token program, system program, etc.
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn trade_via_orca(
    ctx: Context<TradeViaOrca>,
    amount_in: u64,
    min_out: u64,
    current_price: u64, // or fetch from an oracle
) -> Result<()> {
    // 1. (Optional) Calculate fee portion if relevant (some might wait for Step 6)
    // e.g. 1% of amount_in => send to FeeVault. The remainder is traded.

    // 2. CPI into Orca’s swap instruction
    // This depends on the Orca IDL or instruction you have. For example:
    // let cpi_ctx = CpiContext::new(
    //   ctx.accounts.orca_program.to_account_info(),
    //   orca::SwapAccounts { ... }
    // );
    // orca::swap(cpi_ctx, amount_in, min_out)?;

    // 3. After a successful swap, check if the price crosses a threshold
    // call your Step 3 function: update_meme_metadata
    // For convenience, you might do a direct call if in the same program:
    // e.g. update_meme_metadata(..., current_price)

    // 4. Or do a separate CPI to your own function:
    //   let cpi_ctx_meta = ...
    //   protocol::update_meme_metadata(cpi_ctx_meta, current_price)?;

    // TODO: Implement the trade logic here via Orca docs

    Ok(())
}

#[derive(Accounts)]
pub struct CreateSingleSidedLiquidity<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    // The memecoin mint & token account from which we deposit tokens
    #[account(mut)]
    pub creator_token_account: AccountInfo<'info>,

    // The Orca pool accounts. In some AMMs, you first create a new pool, or you join an existing pool that has 0 base side
    #[account(mut)]
    pub orca_pool_token_a: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_token_b: AccountInfo<'info>,
    #[account(mut)]
    pub orca_pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub orca_program: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn create_single_sided_liquidity(
    ctx: Context<CreateSingleSidedLiquidity>,
    amount: u64,
) -> Result<()> {
    // 1. Possibly create or identify an Orca pool that is empty on the base side (SOL).
    // 2. Transfer `amount` of the memecoin from creator to the pool’s token account.
    // 3. The pool might issue LP tokens to the creator if it’s an existing pool.
    //   - If so, deposit them in a vault or the creator’s account.

    // This step is conceptual—Orca might require more instructions to set initial price or define the bounding range
    // in a Whirlpools scenario.

    Ok(())
}

#[account]
pub struct ConvictionRegistry {
    pub token_mint: Pubkey,      // which memecoin this registry belongs to
    pub holder_count: u32,       // how many addresses are currently in the registry
    pub holders: Vec<Pubkey>,    // big-holder addresses
}

#[derive(Accounts)]
pub struct RegisterHolder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // The user's token account holding the memecoin
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    // The ConvictionRegistry for this memecoin
    #[account(
        mut,
        seeds = [b"conviction_registry", meme_token_state.mint.key().as_ref()],
        bump,
    )]
    pub conviction_registry: Account<'info, ConvictionRegistry>,

    // Possibly reference the MemeTokenState so we know total_supply
    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    pub token_program: Program<'info, Token>,
    // etc. (system_program, rent) if needed
}

pub fn register_holder(
    ctx: Context<RegisterHolder>,
) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let user_balance = ctx.accounts.user_token_account.amount;

    // Example threshold: user must hold ≥0.42069% => "conviction_min"
    let decimals = ctx.accounts.meme_token_state.decimals;
    let total_supply = ctx.accounts.meme_token_state.total_supply;
    // raw supply = total_supply * 10^decimals, watch for overflow
    let raw_supply = total_supply.checked_mul(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::Overflow)?;
    
    // 0.42069% = 0.0042069 => (raw_supply * 42069) / 10000000
    // or define a fixed approach: e.g. threshold = raw_supply / 238 (approx 0.42069%)
    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    // Check if user's balance >= threshold
    require!(user_balance >= conviction_min, ErrorCode::InsufficientBalance);

    // If user not already in the list, add them
    if !registry.holders.contains(&ctx.accounts.user.key()) {
        registry.holders.push(ctx.accounts.user.key());
        registry.holder_count = registry.holders.len() as u32;
        msg!("User {} successfully registered as big holder.", ctx.accounts.user.key());
    } else {
        msg!("User already in the registry.");
    }

    Ok(())
}

#[derive(Accounts)]
pub struct DistributeConvictionNfts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,  // e.g. the protocol or token creator who can sign for NFT creation
    #[account(
        mut,
        seeds = [b"conviction_registry", meme_token_state.mint.key().as_ref()],
        bump
    )]
    pub conviction_registry: Account<'info, ConvictionRegistry>,

    #[account(mut)]
    pub meme_token_state: Account<'info, MemeTokenState>,

    // We'll need references to the Metaplex program, system, token program, etc.
    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
    let registry = &mut ctx.accounts.conviction_registry;
    let token_state = &ctx.accounts.meme_token_state;

    // Calculate raw supply
    let raw_supply = token_state.total_supply.checked_mul(10u64.pow(token_state.decimals as u32))
        .ok_or(ErrorCode::Overflow)?;

    // same threshold logic:
    let conviction_min = (raw_supply as u128)
        .checked_mul(42069u128)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(10000000u128)
        .ok_or(ErrorCode::Overflow)? as u64;

    let mut new_list: Vec<Pubkey> = Vec::new();

    // We'll loop through each address in registry, check if they still qualify
    for holder_pubkey in &registry.holders {
        // we need to fetch their token account or pass as remaining accounts
        // e.g. let holder_token_account = ...
        // check balance >= conviction_min
        // if they do, mint them an NFT

        let holder_balance = get_balance_for(holder_pubkey, token_state.mint)?; // a helper function you'd define
        if holder_balance >= conviction_min {
            // Mint an NFT
            mint_conviction_nft(&ctx, *holder_pubkey)?;
            // keep them in the list
            new_list.push(*holder_pubkey);
        } else {
            // they no longer meet the threshold
            msg!("Holder {} removed from registry.", holder_pubkey);
        }
    }

    // Overwrite the old list with the updated list
    registry.holders = new_list;
    registry.holder_count = registry.holders.len() as u32;

    Ok(())
}


fn mint_conviction_nft(ctx: &Context<DistributeConvictionNfts>, holder: Pubkey) -> Result<()> {
    // 1. Create a new mint
    // 2. Create an associated token account for the holder
    // 3. Use Metaplex create_metadata_accounts_v3 to set name, symbol, and possibly collection
    // 4. Possibly store reference to the threshold level

    // This is typically quite verbose, so you might break it into a CPI call or helper function
    Ok(())
}

#[account]
pub struct FeeVault {
    pub protocol_sol_vault: Pubkey,    // system account to accumulate SOL fees
    pub creator_token_vault: Pubkey,   // token account (SPL) for memecoin fees
    pub protocol_pubkey: Pubkey,       // who can withdraw SOL fees
    pub creator_pubkey: Pubkey,        // who can withdraw token fees
    pub lp_token_vault: Pubkey,        // optional: if you hold LP tokens
    // optionally store fee rates, e.g. total_fee_bps, protocol_share_bps, etc.
}

#[derive(Accounts)]
pub struct InitFeeVault<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // The new FeeVault PDA
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 32 + 32 + 32
    )]
    pub fee_vault: Account<'info, FeeVault>,

    #[account(mut)]
    pub protocol_sol_vault: AccountInfo<'info>, // or you create a system account
    #[account(mut)]
    pub creator_token_vault: AccountInfo<'info>, // an SPL token account for the memecoin

    // who is allowed to withdraw sol or tokens
    pub protocol_pubkey: Pubkey,
    pub creator_pubkey: Pubkey,

    // optional lp vault
    #[account(mut)]
    pub lp_token_vault: AccountInfo<'info>,

    // standard references
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn init_fee_vault(ctx: Context<InitFeeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.fee_vault;
    vault.protocol_sol_vault = ctx.accounts.protocol_sol_vault.key();
    vault.creator_token_vault = ctx.accounts.creator_token_vault.key();
    vault.protocol_pubkey = ctx.accounts.protocol_pubkey;
    vault.creator_pubkey = ctx.accounts.creator_pubkey;
    vault.lp_token_vault = ctx.accounts.lp_token_vault.key();
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawProtocolSol<'info> {
    #[account(mut)]
    pub fee_vault: Account<'info, FeeVault>,

    // The system account that accumulates SOL
    #[account(mut)]
    pub protocol_sol_vault: AccountInfo<'info>,

    #[account(signer)]
    pub protocol_signer: AccountInfo<'info>, // must match fee_vault.protocol_pubkey

    #[account(mut)]
    pub recipient_account: AccountInfo<'info>, // where the SOL goes

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn withdraw_protocol_sol(ctx: Context<WithdrawProtocolSol>, amount: u64) -> Result<()> {
    let fee_vault = &ctx.accounts.fee_vault;
    require_keys_eq!(fee_vault.protocol_pubkey, ctx.accounts.protocol_signer.key(), 
        ErrorCode::Unauthorized);

    // transfer `amount` lamports from protocol_sol_vault to recipient_account
    // typically do raw lamport manipulation if it's a system account:
    //   **ctx.accounts.protocol_sol_vault.lamports.borrow_mut() -= amount;
    //   **ctx.accounts.recipient_account.lamports.borrow_mut() += amount;
    // check for enough balance, etc.

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCreatorTokens<'info> {
    #[account(mut)]
    pub fee_vault: Account<'info, FeeVault>,

    #[account(mut)]
    pub creator_token_vault: AccountInfo<'info>, // The vault holding memecoin fees

    #[account(signer)]
    pub creator_signer: AccountInfo<'info>, // must match fee_vault.creator_pubkey

    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>, // The final token account for the user

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn withdraw_creator_tokens(
    ctx: Context<WithdrawCreatorTokens>,
    amount: u64
) -> Result<()> {
    let fee_vault = &ctx.accounts.fee_vault;
    require_keys_eq!(fee_vault.creator_pubkey, ctx.accounts.creator_signer.key(), 
        ErrorCode::Unauthorized);

    // Transfer tokens from creator_token_vault -> recipient_token_account
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.creator_token_vault.clone(),
            to: ctx.accounts.recipient_token_account.clone(),
            authority: ctx.accounts.creator_signer.clone(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    Ok(())
}



