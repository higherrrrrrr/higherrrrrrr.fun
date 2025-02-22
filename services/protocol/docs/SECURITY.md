# SECURITY.md

**A Comprehensive Audit & Security Review of the Memecoin Protocol**

This document consolidates an **extensive security analysis** of the entire Memecoin Protocol codebase, covering Steps 1–6. Below we examine each instruction and data structure for potential vulnerabilities, best practices, and recommended mitigations. We focus on **Anchor**-based Solana development, cross-program invocations (Meteora, Metaplex), big-holder NFTs, and fee distribution logic. This is an **AI-driven** audit with additional manual reasoning, intended to guide final fixes and risk mitigation before mainnet deployment.

---

## Table of Contents

1. [Introduction](#1-introduction)  
2. [Global Observations & Best Practices](#2-global-observations--best-practices)  
3. [Data Structures & Potential Risks](#3-data-structures--potential-risks)  
4. [Instruction-by-Instruction Analysis](#4-instruction-by-instruction-analysis)  
   1. [Step 2: `create_meme_token`](#41-create_meme_token)  
   2. [Step 3: Evolutions (`set_evolutions` & `update_meme_metadata`)](#42-evolutions-set_evolutions--update_meme_metadata)  
   3. [Step 4: `trade_pass_through` & Evolution Triggers](#43-trade_pass_through--evolution-triggers)  
   4. [Step 5: Conviction NFTs (`register_holder`, `distribute_conviction_nfts`)](#44-conviction-nfts-register_holder-distribute_conviction_nfts)  
   5. [Step 6: Fee Distribution & Protocol Liquidity](#45-fee-distribution--protocol-liquidity)  
5. [Upgrade Authority & Governance Concerns](#5-upgrade-authority--governance-concerns)  
6. [Integer Overflow & Math Checks](#6-integer-overflow--math-checks)  
7. [Metaplex/Meteora CPIs & External Integrations](#7-metaplexMeteora-cpis--external-integrations)  
8. [Recommended Mitigations & Fixes](#8-recommended-mitigations--fixes)  
9. [Conclusion & Next Steps](#9-conclusion--next-steps)

---

## 1. Introduction

The **Memecoin Protocol** is a Solana program that lets projects:

- Create **fixed-supply** tokens (locked mint authority).  
- Implement **threshold-based evolutions** of on-chain metadata.  
- Reward large holders with **Conviction NFTs**.  
- Collect **fees** on trades, distributing SOL-based fees to the **protocol** and token-based fees to the **creator**.  
- Optionally deposit fees into **liquidity pools** for protocol-owned liquidity.

This **SECURITY.md** aims to highlight **potential vulnerabilities** or **logic gaps** and confirm the code's alignment with best practices. It's based on the sample code from:

1. **Step 2**: `create_meme_token`  
2. **Step 3**: `set_evolutions` & `update_meme_metadata`  
3. **Step 4**: `trade_pass_through`, evolution triggers  
4. **Step 5**: `register_holder`, `distribute_conviction_nfts`  
5. **Step 6**: FeeVault instructions for fee distribution

*(Note: Step 1 covered a minimal scaffold, Step 7 covers testing & deployment. We assume Steps 7–8 are final QA & security steps.)*

---

## 2. Global Observations & Best Practices

1. **Anchor Usage**  
   - The code uses Anchor's `#[account(init)]` macros, signers, seeds, etc. This is beneficial, as Anchor enforces many security checks (like verifying the correct owner for PDAs and ensuring signers match the instruction definition).  

2. **Program-Derived Addresses (PDAs)**  
   - Each major data structure (e.g., `MemeTokenState`, `EvolutionData`, `ConvictionRegistry`, `FeeVault`) is assigned stable seeds. This is crucial to prevent collisions or malicious re-initialization.  

3. **No Re-Entrancy**  
   - Typical re-entrancy attacks in EVM-like blockchains are less relevant on Solana. The code does not appear to store user-lamports mid-instruction in a vulnerable manner. So re-entrancy is not a major concern here.

4. **Authority Checks**  
   - Many instructions require correct signers (e.g., `creator`, `protocol_pubkey`, `creator_pubkey`). The code typically uses `require_keys_eq!` or Anchor's `#[account(signer)]` approach for validation. This is a good approach, though we recommend verifying all references to ensure no "wildcard" signers can circumvent logic.

5. **Immutable vs. Upgradable**  
   - The user is advised to place the **upgrade authority** behind a multisig or set it to `None` for immutability. If left upgradable, there's a risk the program can be replaced by malicious code if the upgrade authority is compromised. This is a standard best practice in the Solana ecosystem.

---

## 3. Data Structures & Potential Risks

### 3.1. `MemeTokenState`

```rust
#[account]
pub struct MemeTokenState {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub decimals: u8,
}
```

- **Risk**: Strings (`name`, `symbol`) can vary in length. The space calculation must ensure enough bytes for these. Otherwise, dynamic string length could lead to out-of-bounds writes. The code typically does `(4 + name.len()) + (4 + symbol.len())` in `[account(init)]` to handle that, which is correct so long as the user doesn't exceed expected string size.  
- **No** direct risk of overflow, as `u64` for supply is typically safe if well-checked. However, code must watch for `total_supply * 10^decimals` overflow (see Section 6).

### 3.2. `EvolutionData`

```rust
#[account]
pub struct EvolutionData {
    pub owner: Pubkey,
    pub evolution_count: u8,
    pub evolutions: Vec<EvolutionItem>,
}
```

- **Risk**: The `Vec<EvolutionItem>` can become large. The code must ensure enough space for storing all items; otherwise, it can cause dynamic memory constraints.  
- **Sorting**: If items are unsorted, you might inadvertently skip thresholds or revert. Typically not a security issue, more a design flaw possibility.

### 3.3. `ConvictionRegistry`

```rust
#[account]
pub struct ConvictionRegistry {
    pub token_mint: Pubkey,
    pub holder_count: u32,
    pub holders: Vec<Pubkey>,
}
```

- **Risk**: If `holders` can grow unbounded, the account can run out of space or cause runtime errors. Typically, the code ensures a limited number of big holders.  
- **Logic**: `register_holder` ensures the user meets the threshold. This must be re-checked each distribution event to prune stale addresses.

### 3.4. `FeeVault`

```rust
#[account]
pub struct FeeVault {
    pub protocol_sol_vault: Pubkey,
    pub creator_token_vault: Pubkey,
    pub protocol_pubkey: Pubkey,
    pub creator_pubkey: Pubkey,
    pub lp_token_vault: Pubkey,
}
```

- **Risk**: If incorrect signers can call `withdraw*` instructions, they could steal fees. Code references show `require_keys_eq!(fee_vault.protocol_pubkey, signer, ...)` etc. That is good.  
- **No** direct risk from storing public keys. Just ensure no unprotected instructions let an attacker reinitialize or overwrite it.

---

## 4. Instruction-by-Instruction Analysis

### 4.1. `create_meme_token` (Step 2)

```rust
pub fn create_meme_token(
  ctx: Context<CreateMemeToken>,
  name: String,
  symbol: String,
  decimals: u8,
  total_supply: u64,
) -> Result<()> {
  // ...
  // initialize mint, mint_to, set_authority(None)
}
```

#### Potential Issues:

1. **Integer Overflow**:  
   - `(total_supply * 10^decimals)` might overflow `u64` if `total_supply` is large (e.g., 1e10) and decimals=9. Code uses `checked_mul(10u64.pow(decimals as u32))` with an `Overflow` error, which is correct.  
2. **Mint Authority**:  
   - Immediately set to `None` after minting the full supply, so no further tokens can be minted. Good for a locked-supply approach.  
3. **Space Calculation**:  
   - The code in `[account(init, payer = creator, space = ...)]` must match `(4 + name.len()) + (4 + symbol.len()) + 8 + 1 + 32 + 32`. Typically done carefully. Otherwise, we risk partial initialization.  
4. **Access Control**:  
   - Typically only a "creator" can call this. If the design wants a fully open approach, that's not a vulnerability per se, but might cause spam or repeated tokens.

**Verdict**: Implementation is safe if the `Overflow` checks are used consistently and strings remain small enough for the allocated space.

---

### 4.2. Evolutions (`set_evolutions`, `update_meme_metadata`) (Step 3)

#### `set_evolutions`

```rust
pub fn set_evolutions(ctx: Context<SetEvolutions>, items: Vec<EvolutionItem>) -> Result<()> {
  // ensures `ctx.accounts.evolution_data.owner == ctx.accounts.owner.key()`
  // stores items in evolutions
}
```

- **Risk**: If `owner` is not properly checked, an attacker could override thresholds. The code does a `require_keys_eq!`, so that's good.  
- **Memory**: If `items` is large, we must ensure account has enough space. Otherwise, safe.

#### `update_meme_metadata`

```rust
pub fn update_meme_metadata(ctx: Context<UpdateMemeMetadata>, current_price: u64) -> Result<()> {
  // find highest threshold <= current_price, do a CPI to Metaplex
}
```

- **Risk**: The price might be user-supplied. If no external oracle is used, a user could pass an inflated `current_price` and forcibly rename the token. That's not a direct exploit, but it breaks the intended logic. We strongly recommend verifying or trusting an oracle feed.  
- **Metaplex CPI**: The code calls `update_metadata_accounts_v2`. The **`metadata_update_authority`** must match the actual Metaplex metadata's update authority. If not, the call fails. Good design ensures the program or a designated address is indeed the update authority.  
- **No** user funds are directly at risk here, but spoofing the price triggers comedic or undesirable name changes if not using a real price feed.

**Verdict**: The evolutions logic is safe if you trust the `current_price` source. Otherwise, malicious price inputs can cause "fake" evolutions. This is more of a design/trust concern than a vulnerability in code.

---

### 4.3. `trade_pass_through` & Evolution Triggers

```rust
pub fn handle_pass_through_trade(
    ctx: Context<PassThroughTrade>,
    amount_in: u64,
    min_out: u64,
    current_price: u64,
) -> Result<()> {
    // direct transfer from input to output
    // trigger evolution based on price
}
```

- **Risks**:
  1. **Price Feed**: Currently using a mock price. In production, must ensure reliable price source.
  2. **Transfer Validation**: Must verify input/output token accounts belong to correct owners.
  3. **Compute Budget**: Evolution updates should be mindful of compute limits.

---

### 4.4. Conviction NFTs (`register_holder`, `distribute_conviction_nfts`) (Step 5)

#### `register_holder`

```rust
pub fn register_holder(ctx: Context<RegisterHolder>) -> Result<()> {
  // checks user balance >= threshold
  // adds them to registry
}
```

- **Risks**:
  1. **User Balance**: The code references `user_token_account.amount`. If the user supplies a token account that does not actually belong to them, Anchor constraints or checks are needed to ensure `user.key == user_token_account.owner`. Otherwise, they might pass someone else's big balance to get themselves registered.  
  2. **Threshold Calculation**: We do `(raw_supply * 42069) / 10000000`. Potential integer overflow is handled with `checked_mul`, `checked_div`. Good.  
  3. **Registry Growth**: If many addresses try to register, we can exceed the account's allocated space. Typically, that fails at runtime, so not an exploit, but can cause user friction.

#### `distribute_conviction_nfts`

```rust
pub fn distribute_conviction_nfts(ctx: Context<DistributeConvictionNfts>) -> Result<()> {
  // loops registry, checks balance, mints an NFT, prunes
}
```

- **Risks**:
  1. **Compute Budget**: If many holders qualify, we might run out of compute in a single transaction. Possibly break into multiple calls or an off-chain approach. Not a direct security hole but can cause partial distribution.  
  2. **NFT Mint**: Each minted NFT requires a new mint, new metadata, or an existing "edition." The code must handle Metaplex signers properly. If an attacker subverts the "authority," they might mint infinite NFTs. Not necessarily a direct funds exploit, but can degrade trust.  
  3. **Balance Checking**: We need the user's actual token account. If we rely on an off-chain script to pass them in as "remaining accounts," an attacker might supply a token account with a faked balance. Typically, you do a normal `Account<token::TokenAccount>` which ensures the correct data layout.

**Verdict**: The logic is safe as long as (a) token accounts are verified, (b) minted NFTs do not pose an economic risk if minted wrongly. The user must ensure the code doesn't have infinite loop or memory constraints with large holder sets.

---

### 4.5. Fee Distribution & Protocol Liquidity (Step 6)

**`FeeVault`**:
```rust
#[account]
pub struct FeeVault {
    pub protocol_sol_vault: Pubkey,
    pub creator_token_vault: Pubkey,
    pub protocol_pubkey: Pubkey,
    pub creator_pubkey: Pubkey,
    pub lp_token_vault: Pubkey,
}
```

**`trade_pass_through`** or similar now skims fees. We see instructions:

- `withdraw_protocol_sol`
- `withdraw_creator_tokens`

#### Potential Vulnerabilities:

1. **Unauthorized Withdraw**  
   - Must ensure only `protocol_pubkey` can call `withdraw_protocol_sol`, only `creator_pubkey` can call `withdraw_creator_tokens`. The code typically does a `require_keys_eq!(fee_vault.protocol_pubkey, ctx.accounts.protocol_signer.key())`. That's correct. A single missed check is catastrophic.  
2. **SOL Vault**  
   - If using a raw system account for `protocol_sol_vault`, direct lamport manipulation requires caution (`**account_info.lamports.borrow_mut()`). Ensure checks for `>= amount` exist.  
3. **Token Vault**  
   - Must sign with the correct authority to do an SPL `transfer`. The code's approach is correct: it references `creator_signer` and ensures it matches `creator_pubkey`.  
4. **Fee Rate**  
   - If the code is left modifiable at runtime (lack of a final "locked" param), an attacker might set the fee to 100%. Not necessarily a bug if you want that flexibility, but be sure to store fee rates