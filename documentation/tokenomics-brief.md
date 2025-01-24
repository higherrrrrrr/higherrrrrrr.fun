# Higherrrrrrr Community Brief

Hey there—welcome to the **Higherrrrrrr** community tokenomics overview. This document’s your go‐to for understanding our new meme‐style token on Solana, how `$HARDER` and `$IDK` holders fit in, and why we have this comedic “Conviction NFTs” approach. We’ll mention the ticker **once**—*it’s called **ZETA1** (wink)*—but after that, it’s just “the token.”

**Summary of the Higherrrrrrr Tokenomics Model (tl;dr)**

- **Deflationary Pressure**: A 1% trading fee on the token side gets burned, gradually shrinking the total supply. Over time, this may drive the token price upward if demand holds steady.
  
- **Self-Reinforcing Liquidity**: The 1% fee on the SOL side re-enters the liquidity pool, making the pool deeper. This reduces volatility and provides a more stable price floor.
  
- **Evolutionary Meme Mechanics**: Crossing certain price thresholds triggers comedic on-chain artwork/name changes. This “gamified” approach may spur recurring community hype each time a new threshold is reached.
  
- **Conviction NFTs**: Holding at least 0.42069% of the supply gets you special NFT rewards at each “evolution.” This may incentivize whales to keep large bags and further reduce active float.
  
- **Team & Community Distribution**: With 70% ILO, 15% to `HARDER`/`IDK` communities, and 15% to the team (with vesting), the supply is broadly spread out while still providing developer incentives.
  
- **Rational Market Expectation**: Over time, if the project gains traction, the deflationary burn + increased liquidity could create upward price pressure. However, actual performance depends on real-world demand, speculation, and community engagement.


---

## 1. What’s the Meme All About?

**Higherrrrrrr** (with seven “r”s) is about having fun while building a genuinely solid token ecosystem. Here’s the gist:

- **1,000,000,000 total tokens**, 9 decimals, **no extra minting** (burned authority).
- A comedic spin on “price‐based evolutions,” so the token’s on‐chain name/art shifts at certain thresholds.
- A special threshold of **0.42069%** for “Conviction NFTs”—yep, we did that.

We want a meme token that **evolves** over time and hands out comedic badges to big holders. The goal is to inject a bit of levity while still delivering robust tokenomics.

---

## 2. Distribution: Community First

### 2.1. How the Token Supply Splits

1. **Team: 15%**  
   - We need some stake to keep shipping code.  
   - Of that 15%, **7.7777…%** goes to Carl (the main driver), and the remaining ~7.22% is for other team members/advisors.

2. **$HARDER & $IDK Communities: 15%**  
   - If you hold `$HARDER` or `$IDK`, we’ve reserved 15% total for you.  
   - You’ll either get an airdrop or bridging claim—no final decision yet, but you won’t be left behind.

3. **Initial Liquidity Offering (ILO): 70%**  
   - The other 70% is going into a public liquidity pool on Solana.  
   - We want a **single‐sided deposit** so folks can buy in fairly without huge slippage.

**Reasoning**: We love existing meme communities, so they get a decent chunk. The team’s share is modest enough not to overshadow the rest. And 70% in a public pool ensures a wide open market from day one.

---

## 3. Evolution Mechanics

### 3.1. Price‐Based Evolution

Whenever the token’s price crosses certain lines—like $0.001, $0.01, or beyond—its name/art on‐chain **evolves**. Think about checking your wallet and seeing it morph from “Higherrrrrrr V1” to “Higherrrrrrr In Warp Drive.” It’s a comedic twist powered by Solana’s Metaplex metadata system.

### 3.2. `evolution.svg`

We store a file named `evolution.svg` that updates or transforms each time the token levels up. So, the comedic story of **Higherrrrrrr** literally unfolds in your wallet:

<img src="evolution.svg" alt="Evolution Illustration" width="400" />

Basically, watch out for new memes, new colors, or silly references inside that SVG.

### 3.3. Why Evolve?

1. **Keeps It Fun**  
   - Each threshold crossing is like an event we celebrate.  
2. **Amplifies Meme Culture**  
   - It’s not “only number go up,” it’s “number go up, *image* changes, jokes ensue.”  
3. **Dynamic**  
   - Any wallet that respects Metaplex metadata sees these comedic changes in real time.

---

## 4. Conviction NFTs (≥ 0.42069%)

### 4.1. The Meme Threshold

By now, 420 and 69 need no introduction. If you hold **0.42069%** of the token supply (4,206,900 ignoring decimals), you qualify for “Conviction” status—basically, you’re a big fish.

### 4.2. The Registry & The Reward

We keep an on‐chain list of addresses above 0.42069%. If you pass that threshold, you can “register_holder.” Then, whenever the token crosses a new price threshold:

- Everyone still on that registry (≥ 0.42069%) gets an NFT to commemorate the “old level” we just transcended.

### 4.3. Degen‐Friendly

We anticipate maybe 200 big holders at most, so it’s easy to handle. If you dip below 0.42069%, you’ll be pruned from the registry. Gotta stay big to stay convicted.

---

## 5. Fees & Burning Mechanic

This is where the new twist comes in:

### 5.1. Trading Fees

We take a small fee on each swap— 1%. Then:

- **Token Side**: We burn those tokens outright, removing them from circulation. The more trading volume, the more tokens vanish over time—making the remaining supply more scarce.  
- **SOL Side**: The fee in SOL doesn’t go to the treasury; we put it **back into the liquidity pool**. That helps keep the pool deep, reduces volatility, and supports a healthier market.

### 5.2. Building Protocol Liquidity

Because the SOL side of fees goes back in the pool, the liquidity effectively grows each time a trade happens. Think of it as an *auto‐reinforcing liquidity system.* The protocol itself doesn’t keep SOL from the fees—it just recycles it into the AMM to stabilize price dynamics.

### 5.3. Transparency

You’ll see the burn transactions for tokens on the Solana explorer (they go to a known burn address). And the SOL is just re-added to the same liquidity pool. No hidden vault, no single team wallet. Totally visible and trackable.

---

## 6. Team Vesting & Security

### 6.1. Team’s 15%

Carl’s 7.7777…% is on a vesting schedule—like monthly or quarterly. The other ~7.22% is also vested for the rest of the team. No day-one dumps, no behind-the-scenes drama.

### 6.2. Multi‐Sig & Optional Immutability

A multi-sig (e.g., Squads) controls the upgrade authority. If a bug arises, we can patch it with multiple signers. If the community eventually wants total immutability, we burn that authority, and no more changes can occur.

---

## 7. $HARDER & $IDK Communities

A total of 15% is reserved for `$HARDER` and `$IDK` holders. We’re fans of your memetic spirit, so we want you in on Higherrrrrrr. You’ll either get an airdrop or bridging instructions soon. Stay tuned on Discord or Twitter. We promise you’re part of the plan.

---

## 8. Launch Plan (70% ILO)

### 8.1. Single‐Sided Liquidity

We’ll deposit 700 million tokens into a Solana DEX (like Orca) on day one. This ensures a fair open market, minimal slippage, and no insider ratio. The community sets the price—demand + supply do the rest.

### 8.2. Keep an Eye on Evolutions

If trading volume spikes the price past a threshold, you’ll see the comedic rename or updated `evolution.svg` effect. And if you’re above 0.42069% in holdings, you’ll snag your first “Conviction NFT” for the old level.

---

## 9. Next Steps for You

1. **Check Out the Liquidity Offering**: Once we’re live, you can buy in.  
2. **Register if You’re a Big Holder**: If you surpass 0.42069%, call the “register_holder” function.  
3. **Watch the Art**: Keep an eye on your wallet to see if the token’s name or image evolves.  
4. **HODL or Trade**: Up to you. But the comedic evolutions might make you want to stick around.  
5. **Chime In**: Suggest new comedic slogans or help us craft the next version of `evolution.svg`.

---

## 10. Recap: The Setup

- **1B tokens** total, 0 minted after launch (burn authority = gone).  
- **Distribution**: 
  - 15% team (Carl at 7.7777…%),  
  - 15% `$HARDER & $IDK`,  
  - 70% ILO.  
- **Evolution**: On-chain comedic name changes, referencing `evolution.svg`.  
- **Conviction**: ≥ 0.42069% gets you NFTs whenever we cross a new price threshold.  
- **Fees**: We **burn** tokens on the token side, and **re-add** SOL to the liquidity pool.  
- **Upgrade**: Multi-sig. Possibly locked forever if the community demands it.

---

We hope you’ll jump in and help push **Higherrrrrrr** to comedic, possibly profitable extremes. Stay tuned on your favorite channels, and let’s see how far we can take this meme. Thanks for reading, buddy!

**—From the Higherrrrrrr Community**  
*(Where the meme meets creative engineering—and a dash of silliness.)*

[Fancy Math Version](https://chatgpt.com/share/6792ed2a-5d60-8000-bcc4-121f19028944)
