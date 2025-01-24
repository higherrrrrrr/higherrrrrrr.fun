# Higherrrrrrr Community Brief

Welcome to the **Higherrrrrrr** community memo! Below, you’ll find everything you need to know about our new meme‐inspired token mechanics, including distribution, how existing coin holders (`$HARDER` and `$IDK`) are getting involved, and how we’ll handle the comedic threshold for “Conviction NFTs.” We only mention the ticker once—*psst, it’s called **ZETA1** (wink)*—but for the rest of this doc, we’ll just call it **“the token.”**

---

## 1. What’s the Meme?

Higherrrrrrr (with seven “r”s at the end) is all about community fun. Our protocol on Solana blends comedic mechanics—like **price‐based evolutions** and **conviction thresholds**—with strong crypto fundamentals:

- **Fixed Total Supply** of **1,000,000,000** tokens (9 decimals)  
- **No Future Minting** (we’ve burned the mint authority)  
- **Comedic Nudges**:  
  - The token’s name changes on‐chain at certain price levels.  
  - **≥ 0.42069%** holders can get special NFTs each time the token “levels up.”  

The result is a meme platform with big laughs *and* robust, transparent tokenomics.

---

## 2. Community‐First Distribution

### 2.1. Overall Split

We’re distributing the token in three big ways:

1. **Team: 15%**  
   - This chunk ensures developers and core contributors stay motivated.  
   - Inside that 15%, about **7.7777…%** of the total supply goes to Carl (the original mastermind), with the rest spread among a couple of other team members and advisors.

2. **$HARDER & $IDK Communities: 15%**  
   - We’re giving longtime `$HARDER` and `$IDK` communities a combined **15%** of supply.  
   - These folks have shown unwavering meme loyalty and deserve a direct stake in Higherrrrrrr.  
   - If you hold `$HARDER` or `$IDK`, expect an airdrop or bridging instructions soon—depending on how we finalize the distribution process.
   - Airdrop amount depends on relative value of the tokens you hold. There will be a snapshot TBD announcement. This is separate from the migrations of these tokens.

3. **Initial Liquidity Offering (ILO): 70%**  
   - The biggest slice—**70%**—goes into a public offering on Solana.  
   - Think of it as “single‐sided” liquidity, meaning we’ll deposit the tokens in a decentralized exchange (like Orca) so anyone can buy them with minimal slippage.  
   - This approach makes our token super accessible from day one.

**Why this split?**  
- **Community Roots**: We reward existing meme‐coin fans ($HARDER & $IDK) for their degenerate devotion.  
- **Fair Entry**: Most tokens go to a public liquidity pool, so everyone can jump in equally.  
- **Team Alignment**: A moderate share (15%) ensures devs can keep building without overshadowing community holdings.

---

## 3. Evolution Mechanics

### 3.1. Price‐Based Renaming

We love comedic theatrics, so whenever the token’s price crosses certain levels (for instance, $0.001, $0.01, $0.10, or higher), the on‐chain name can update to something new and hilarious. Wallets that support Solana’s Metaplex metadata will see these changes automatically—like you’ll open your wallet one day and notice:

> “Oh, the token calls itself ‘Higherrrrrrr Reaches 420 Nirvana’ now. Sweet.”

We keep the *core symbol* same on the blockchain, but the displayed name is up for comedic grabs.

### 3.2. Why “`evolution.svg`?”

We’re storing some references to an **`evolution.svg`** file so that if your wallet or marketplace fetches the token’s URI, it can show a snazzy little meme image that evolves, too. Think of it like a living, breathing meme that updates at set price thresholds.

---

## 4. Conviction NFTs (≥ 0.42069% Supply)

### 4.1. 0.42069%? Why?

Yes, it’s exactly what you think—a tongue‐in‐cheek tribute to two infamous meme numbers: **420** and **69**. If you hold that fraction of supply (which is 4,206,900 tokens ignoring decimals, or 4,206,900 × 10^9 on‐chain), you qualify for “Conviction” status.

### 4.2. Registry & Rewards

We maintain an on‐chain list (registry) of these big holders. If you buy enough tokens through our interface, we might auto‐register you. Or, if you bought your tokens somewhere else, you can manually call a “register_holder” function. Then:

- **When Price Crosses a Threshold**:  
  - Everyone on the registry who still meets the 0.42069% requirement gets a special NFT minted to them.  
  - This NFT references the “previous” level we just left behind—like a trophy proving you were on board before the pump.

### 4.3. Taming the Degens

We suspect there won’t be more than 200–300 addresses at that threshold in the worst case, so we can manage them on‐chain with minimal fuss. If you sell some tokens and drop below 0.42069%, we’ll prune you from the registry.

---

## 5. Fee & Treasury

### 5.1. Trading Fees

We take a small cut each time you swap tokens (like 0.3%, for instance). This is split:

- **If the swap is from SOL** (or another base asset), the protocol’s treasury gets that fee in SOL.  
- **If the swap is from the token** (selling back into SOL), the team or “creator vault” collects the token fees.

### 5.2. Protocol Liquidity

We may use some fees to deepen liquidity pools. That means sometimes we’ll deposit SOL + tokens back into the AMM, receiving “LP tokens” in a separate vault. This ensures fewer price dumps if big whales move.

### 5.3. Transparency & Withdrawals

- We’ll post addresses for the treasury accounts.  
- The team’s multi‐signature wallet can withdraw fees as needed.  
- Community can see it all on the Solana explorer.

---

## 6. Team Vesting & Security

### 6.1. Team Allocation = 15%

Carl’s 7.7777…% is locked in a schedule (like a linear vest over many months), so there’s no sudden flood of tokens on day one. The rest of the team’s 7.22% is similarly vested.

### 6.2. Upgradability & Multisig

For safety, the protocol’s upgrade authority is held by a multi‐sig (e.g., a Squads wallet). If major bugs appear, we can patch them with multiple signers concurring. If the community eventually decides “No more changes,” we can burn that authority permanently, making everything immutable.

---

## 7. $HARDER & $IDK Communities

A big chunk (15%!) of supply is dedicated to these existing meme communities. We love your degenerate spirit and want you along for the ride. Expect:

- **Airdrops or Bridging**: If you hold `$HARDER` or `$IDK`, you’ll likely get a claim or direct distribution.  
- **No Abandonment**: We’ll keep you posted on Discord/Twitter about the claim process.  
- **Your Share**: We anticipate you’ll continue the meme hype and help shape new comedic thresholds.

---

## 8. Launch Plan (70% ILO)

### 8.1. Single‐Sided Liquidity

We’ll put 700 million tokens (70% supply) on a Solana AMM (like Orca). This means you can buy tokens from day one without huge slippage. The price will be discovered naturally as the market sets it.

### 8.2. Ongoing Evolutions

Right after launch, if volume surges and the price crosses a comedic threshold, the token might rename itself on‐chain to celebrate. If you’re a big holder, prepare for that first “Conviction NFT” drop!

---

## 9. Where to Next?

1. **Participate**: Grab tokens from the ILO on launch.  
2. **Register**: If you surpass 0.42069%, register for Conviction rewards.  
3. **Watch**: Keep an eye on the comedic name changes.  
4. **Hold**: The more you hold (and the more we cross thresholds), the more comedic accolades you might accumulate.  
5. **Contribute**: Join our chats; propose new comedic naming ideas or updated `evolution.svg` files. This is a living meme!

---

## 10. In a Nutshell

- **Fixed Supply**: 1 billion tokens, no inflation.  
- **Distribution**: 15% Team, 15% for `$HARDER` & `$IDK`, 70% for public liquidity.  
- **Comedy**: Price triggers on‐chain name evolutions, with an SVG references.  
- **Conviction**: ≥ 0.42069% gets you special NFTs each time we “level up.”  
- **Fees**: A tiny cut from each trade, feeding treasury & supporting the team.  
- **Security**: Multi‐sig for upgrades, optional immutability later.  

We can’t wait for you to join us on this journey as Higherrrrrrr aims to push the boundaries of meme‐driven, comedic token fun on Solana. Stick around for updates, and let’s collectively ascend to comedic (and maybe financial) heights!

---

_**From the Higherrrrrrr Community**_  
_—Where the Meme meets the Machine_  
