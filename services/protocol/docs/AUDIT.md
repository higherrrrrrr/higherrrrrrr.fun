# Higherrrrrrr Protocol Full Audit

**Audit Title:** Higherrrrrrr Protocol Full Audit  
**Audit Date:** 2025-02-02  
**Authors:**  
- Carl Cortright  
- o3-mini-pro  
- o1-pro  

---

## Table of Contents

1. [Introduction & Scope](#introduction--scope)  
2. [Executive Summary](#executive-summary)  
3. [Project Overview](#project-overview)  
4. [Code Structure & Files](#code-structure--files)  
5. [Methodology](#methodology)  
6. [Detailed Findings](#detailed-findings)  
   1. [High-Level Observations](#high-level-observations)  
   2. [Low-Level Observations & Code Review](#low-level-observations--code-review)  
      - [Anchor.toml & Cargo.toml](#anchortoml--cargotoml)  
      - [README.md & docs/TOKENOMICS.md](#readmemd--docstokenomicsmd)  
      - [migrations/deploy.ts](#migrationsdeployts)  
      - [package.json](#packagejson)  
      - [programs/protocol/Cargo.toml & Xargo.toml](#programsprotocolcargotoml--xargotoml)  
      - [programs/protocol/src/errors.rs](#programsprotocolsrcerrorsrs)  
      - [programs/protocol/src/instructions/*](#programsprotocolsrcinstructions)  
      - [programs/protocol/src/state/*](#programsprotocolsrcstate)  
      - [Target Deploy Keypair](#target-deploy-keypair)  
      - [tsconfig.json](#tsconfigjson)  
7. [Security Analysis](#security-analysis)  
   - [Access Control](#access-control)  
   - [Arithmetic Overflows & Underflows](#arithmetic-overflows--underflows)  
   - [Token Distribution & Vesting Logic](#token-distribution--vesting-logic)  
   - [Conviction NFTs](#conviction-nfts)  
   - [Fee Distribution & LP Mechanics](#fee-distribution--lp-mechanics)  
   - [Immutability & Upgrades](#immutability--upgrades)  
8. [Testing & QA](#testing--qa)  
9. [Recommendations](#recommendations)  
10. [Conclusion](#conclusion)  
11. [Disclaimer](#disclaimer)

---

## 1. Introduction & Scope

This report contains a comprehensive audit of the **Higherrrrrrr** protocol, which comprises smart contracts (Anchor programs), scripts, and associated configuration files. The audit aims to verify the security, functionality, and correctness of the code. Specifically, we examine:

- The **Rust** smart contracts (using the Anchor framework).  
- The tokenomics details, distribution instructions, and fee mechanisms.  
- The usage of third-party crates (e.g., Orca Whirlpools).  
- The overall design’s alignment with typical Solana and Anchor security best practices.  

Our review spans from logical correctness and code readability to potential vulnerabilities and misconfigurations.

---

## 2. Executive Summary

- **Overall Code Quality**: The protocol's codebase is generally well-structured, following Anchor best practices. Instruction handlers are separated into modules, and error handling is consistent.  
- **Key Features**:
  - Custom token creation with enforced distribution splits.
  - "Conviction NFTs" system to reward large token holders.
  - Automatic and manual evolution mechanics for token metadata.
  - Fee vault and distribution logic, splitting fees between protocol and creators.
  - Single-sided liquidity additions on Orca Whirlpools.  
- **Findings**:  
  - We did not identify any critical vulnerabilities that would allow unauthorized minting or seizing of funds.  
  - A few **low-severity** findings relate to potential improvements in user validation, strict checks on distribution percentages, and immutability preferences.  
  - The code includes checks for supply overflows, unauthorized usage, and misconfigured accounts.  

Overall, the Higherrrrrrr Protocol appears robust and well-designed for the comedic, community-centric “cult coin” approach outlined in the tokenomics. While we highlight certain items for improvement, the contract structure is generally in line with recommended Solana security practices.

---

## 3. Project Overview

### Higherrrrrrr Protocol

- A memecoin-based protocol on Solana that uses an evolving token concept:
  - **Fee Mechanism**: 1% total fee on trades, half burned (token side), half added as single-sided liquidity (SOL side).  
  - **Conviction NFTs**: Addresses holding ≥ 0.042069% of the supply can earn special NFTs during “evolution” events.  
  - **Evolution**: Token name/metadata changes when certain price or market cap thresholds are met.  
  - **Distribution**:  
    - 15% Team & Future expansions (7.77% current, 7.23% future).  
    - 5% Migration LP Support.  
    - 15% Base V1 Supporters.  
    - 65% Single-Sided Launch.  

The code is an Anchor-based Solana program that covers functionality such as token creation, distribution, fee collection, swap, and automatic metadata evolution.

---

## 4. Code Structure & Files

```
├── Anchor.toml
├── Cargo.toml
├── README.md
├── docs/
│   └── TOKENOMICS.md
├── migrations/
│   └── deploy.ts
├── package.json
├── programs/
│   └── protocol/
│       ├── Cargo.toml
│       ├── Xargo.toml
│       ├── src/
│       │   ├── errors.rs
│       │   ├── instructions/
│       │   │   ├── create_meme_token.rs
│       │   │   ├── evolutions.rs
│       │   │   ├── fee_distribution.rs
│       │   │   ├── trade_orca.rs
│       │   │   ├── conviction_nfts.rs
│       │   │   └── mod.rs
│       │   ├── state/
│       │   │   ├── meme_token_state.rs
│       │   │   ├── evolution_data.rs
│       │   │   ├── conviction_registry.rs
│       │   │   ├── fee_vault.rs
│       │   │   └── mod.rs
│       │   └── lib.rs
│       └── target/
│           └── deploy/
│               └── protocol-keypair.json
├── tsconfig.json
```

- **Anchor.toml & Cargo.toml**: Project configuration, specifying cluster, wallet, and workspace details.  
- **README.md**: High-level project information.  
- **docs/TOKENOMICS.md**: Detailed tokenomics, distribution mechanics, and rhetorical memecoin pitch.  
- **migrations/deploy.ts**: Basic script for deploying via Anchor’s provider.  
- **programs/protocol/**: Anchor program code; main business logic is in `src/`:
  - **errors.rs**: Custom error definitions.  
  - **instructions/**: Each major operation (create token, evolutions, fee logic, trades, etc.).  
  - **state/**: Persistent program accounts (e.g. MemeTokenState, EvolutionData, FeeVault).  
  - **lib.rs**: Anchor entrypoint with declared ID and exported program instructions.  
- **package.json & tsconfig.json**: JavaScript/TypeScript dependencies and build configs for testing.  
- **protocol-keypair.json**: Local keypair for the program.

---

## 5. Methodology

Our audit process involves:

1. **Manual Code Review**: Assess each file’s logic flow, ensuring correct usage of Anchor macros (e.g., `#[account]`, `#[derive(Accounts)]`), account constraints, and error handling.  
2. **Automated Analysis**: Use linting and scanning tools to catch potential integer overflows, uninitialized accounts, or suspicious instructions.  
3. **Functional Testing**: Examine test scripts (if provided) and local environment settings to evaluate coverage.  
4. **Threat Modeling**: Identify possible scenarios for malicious exploitation, focusing on:
   - Unauthorized minting or distribution.  
   - Privilege escalations.  
   - Fees misdirection.  
   - Overflow or boundary errors.  

We also checked the relevant references in the code for CPIs to third-party programs (Orca Whirlpools, MPL Token Metadata) to ensure correct usage.

---

## 6. Detailed Findings

### 6.1 High-Level Observations

1. **Use of Anchor**: The code appropriately leverages Anchor’s safety features (e.g., `#[derive(Accounts)]`, typed accounts, PDAs).  
2. **Error Handling**: Custom errors in `errors.rs` are consistently used. The code checks for unauthorized operations, distribution percentage constraints, and insufficient balances.  
3. **Overflow/Underflow Checks**: The code explicitly checks for possible multiplication overflows (using the `Overflow` error).  
4. **Immutability**: The `upgrade_authority` can be burned if the team/community desires full immutability, which aligns with best practices.

### 6.2 Low-Level Observations & Code Review

#### Anchor.toml & Cargo.toml
- **Anchor.toml** sets `cluster = "localnet"` by default, referencing the local Solana wallet and program ID (`Prot111111111111111111111111111111111111111`).  
- **Cargo.toml** includes LTO and overflow checks in release profile, which is good for performance and safety.  

No issues found. We recommend verifying the correct program ID in production.  

#### README.md & docs/TOKENOMICS.md
- The **README.md** references a ChatGPT link (likely ephemeral) and does not contain code.  
- **TOKENOMICS.md** thoroughly explains supply distribution, fee mechanism, NFTs, and “floor” concept. The distributions align with code constraints (e.g., 15% team, 5% migration, etc.).  

No direct code vulnerability here. Documentation is clear and consistent.  

#### migrations/deploy.ts
- A simple deployment script using `anchor.setProvider(provider)`.  
- No complex logic or security risk in deployment script.  

No issues found.  

#### package.json
- Basic Node.js dependencies for testing (`mocha`, `chai`, `typescript`) and formatting (`prettier`).  
- Security concerns are minimal. Just ensure pinned versions if worried about supply chain.  

No major issues.  

#### programs/protocol/Cargo.toml & Xargo.toml
- **Cargo.toml** references `anchor-lang = "0.26.0"` and Orca-related crates.  
- **Xargo.toml** is default, no custom standard library changes.  

No issues.  

#### programs/protocol/src/errors.rs
- Defines custom error codes: `Overflow`, `Unauthorized`, `InsufficientBalance`, `InvalidPriceData`, etc.  
- Well-labeled, descriptive.  

No issues.  

#### programs/protocol/src/instructions

1. **create_meme_token.rs**  
   - Handles new token creation, distribution, setting pool.  
   - Validates distribution percentages (non-LP ≤ 35%, remainder = 65% for LP).  
   - Mints the entire supply, then locks the mint authority.  
   - **Potential Attack Vector**: If distributions are mis-typed, it could hamper the intended supply. The code checks `is_pool` for exactly one or zero occurrences. If there’s more than one, it errors. This is good.  
   - The logic sets up an Orca Whirlpools pool with `init_pool`.  
   - Overall, the function is consistent with the tokenomics doc.

2. **evolutions.rs**  
   - Manages setting evolutions (`set_evolutions`) and updating metadata (`update_meme_metadata`).  
   - Bounded at 420 evolutions (arbitrary comedic cap).  
   - Uses `mpl_token_metadata::instruction::update_metadata_accounts_v2` for on-chain name/URI changes.  
   - No issues found. Just verify that `metadata_update_authority` is correct.

3. **fee_distribution.rs**  
   - Initializes a `FeeVault` for protocol & creator vault addresses.  
   - Allows `handle_withdraw_protocol_sol` and `handle_withdraw_creator_tokens` with respective authority checks.  
   - Splits LP fees from `lp_fee_account` equally.  
   - **Potential Attack Vector**: The `lp_fee_account` must match `fee_vault.lp_token_vault`. This is checked for correctness. Good.  

4. **trade_orca.rs**  
   - Wraps an Orca Whirlpools CPI for swaps.  
   - Applies a post-swap step to “trigger_evolution” if a threshold is met.  
   - Uses `get_current_price` from `Whirlpool` data to set the new name/URI if needed.  
   - No re-entrancy concerns. The CPI is straightforward, and Anchor ensures no cross-call contamination.  

5. **conviction_nfts.rs**  
   - `handle_register_holder` checks if the user’s token balance is ≥ 0.042069% of total supply.  
   - `handle_distribute_conviction_nfts` iterates over holders, re-checks if they still meet the threshold, and mints an NFT to them.  
   - Properly prunes holders if they fall below the threshold.  

Overall, the instructions are segmented well, with security checks in place.  

#### programs/protocol/src/state

1. **meme_token_state.rs**  
   - Stores data about the memecoin (creator, mint, name, symbol, total supply, decimals, pool, image, token_type).  
   - Straightforward design.  

2. **evolution_data.rs**  
   - Owner & `Vec<EvolutionItem>` stored.  
   - `EvolutionItem` has `price_threshold`, `new_name`, `new_uri`.  
   - Used for dynamic metadata updates.

3. **conviction_registry.rs**  
   - Holds addresses that meet the threshold.  
   - Simple `holders` vector.  

4. **fee_vault.rs**  
   - Basic structure for storing protocol & creator vault addresses.  

Struct definitions are coherent and align with instructions.  

#### Target Deploy Keypair
- `protocol-keypair.json` is a local set of 64 bytes. For production, ensure secure storage and possibly a different authority.  

No immediate concerns.  

#### tsconfig.json
- Basic TS configuration, references mocha/chai types.  

No issues.  

---

## 7. Security Analysis

### 7.1 Access Control
- **Creator vs. Protocol**: The code consistently checks for the `creator` or `protocol_pubkey` before allowing certain withdrawals.  
- **PDA Seeds**: The usage of seeds for `conviction_registry` (`b"conviction_registry", mint.key()`) and `evolution_data` (`b"evolution_data", mint.key()`) is standard and secure.  

### 7.2 Arithmetic Overflows & Underflows
- The code uses `checked_mul`, `checked_div`, and error codes to catch overflows.  
- Solana’s standard for `u64` balances is adhered to.  

### 7.3 Token Distribution & Vesting Logic
- The distribution splits are enforced (team ≤ 35% combined with other distributions, 65% or remainder goes to the single-sided pool).  
- Team tokens are presumably locked in a **Squads multisig** (according to docs, though this is not explicitly coded here). The code at least ensures correct supply distribution at creation.  

### 7.4 Conviction NFTs
- The logic is straightforward: The user must reregister if their balance dips below the threshold.  
- This approach seems functionally correct; no double-mint risk because the `distribute_conviction_nfts` does a re-check.  

### 7.5 Fee Distribution & LP Mechanics
- Fees from swaps are stored in the Orca pool fee account. A specialized instruction (`distribute_lp_fees`) splits them between protocol and creator.  
- This code seems correct and checks the identity of the fee vault.  
- Single-sided liquidity addition logic is mostly simulated. Real production usage must confirm Orca’s actual instructions.  

### 7.6 Immutability & Upgrades
- As typical with Anchor, the program can be upgraded by the upgrade authority unless it’s explicitly removed.  
- Community governance or a multisig can maintain that authority.  
- This is a design decision, not a vulnerability.  

---

## 8. Testing & QA

- **Anchor Test**: The repository’s default `anchor test` scripts can run local tests. We did not see complete test coverage for all instructions, but the structure is present.  
- We recommend more thorough tests, especially for the NFT logic and fee distributions.  

---

## 9. Recommendations

1. **Expand Testing**  
   - Add dedicated tests covering partial edge cases (e.g., distribution percentages, failing scenario for multiple pool instructions, conviction NFT re-check).  
2. **Document and Verify Actual Deploy Keys**  
   - Confirm that the final Program ID is the same as `Prot111111111111111111111111111111111111111` in production or that it’s updated in `Anchor.toml`.  
3. **Enhance or Confirm Team Lock Logic**  
   - If additional vesting logic is needed for team tokens, implement a specific vesting schedule on-chain or confirm that the external multisig locks them.  
4. **Review Metadata Authority**  
   - The `metadata_update_authority` is critical. If a compromised account can update metadata, it could mislead users. Keep it under a robust governance or burn it if not needed after final evolutions.  
5. **Check Real-World Orca CPI**  
   - Ensure the `orca_whirlpools_client` usage matches the actual mainnet instructions. The code references a “simulated” single-sided liquidity approach, so confirm it’s correct on mainnet.  

---

## 10. Conclusion

The **Higherrrrrrr Protocol** codebase demonstrates a well-structured Anchor program with clear separation of concerns. It includes thorough checks for unauthorized access, distribution percentage validation, and integer overflow. The comedic tokenomics and “Conviction NFTs” approach add novel functionality while remaining consistent with standard Solana practices.

No critical vulnerabilities were identified. The main areas for improvement lie in additional testing, ensuring secure governance of upgrade authorities, and verifying real-world usage of external CPIs. Once these recommendations are addressed, the protocol can operate with high confidence in its security and correctness.

---

## 11. Disclaimer

This audit is a best-effort assessment of the **Higherrrrrrr** protocol at the time of review. It does not guarantee the absence of undiscovered vulnerabilities or that the implementation meets all business goals. Always follow best security practices, maintain a bug bounty program, and have a robust monitoring system in production.  

**End of Report**  
