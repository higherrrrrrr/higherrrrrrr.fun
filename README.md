# Higherrrrrrr – Memecoin Launchpad & Evolutionary Token Framework

**Welcome to the Higherrrrrrr repo!** This project provides a **Solana-based launchpad** for community-driven tokens, featuring:

- **Dynamic Token Metadata** (on-chain "evolutions" tied to price or market milestones)  
- **Conviction NFTs** (awarded to big holders when thresholds are crossed)  
- **Flexible Fee Splits** (supporting token burns, protocol revenue, and single-sided liquidity)  
- **Secure, Modular Architecture** (anchor-based smart contracts, PDAs, audits, etc.)

Whether you're a developer integrating new token projects or just exploring how the platform works, this repo has everything you need to **get started**.

---

## Getting Started

1. **Clone the Repo**  
   ```bash
   git clone https://github.com/higherrrrrrr/higherrrrrrr.fun.git
   cd higherrrrrrr
   ```
   
2. **Read the Docs**  
   - The main documents live in the `docs/` directory, and additional guides for advanced topics are in dedicated Markdown files.  
   - For a **technical deep dive**, check out:  
     - [`docs/technical-design-document.md`](./docs/technical-design-document.md) – Extended architecture, logic, and data structures.  
     - [`docs/tokenomics.md`](./docs/tokenomics.md) – Overview of the deflationary model, supply distribution, and threshold-based mechanics.  
     - [`docs/creator-guide.md`](./docs/creator-guide.md) – Quickstart for launching your own Cult Coin or meme token using Higherrrrrrr.  
     - Other references (e.g., `docs/whitepaper.md`, `docs/security-posture.md`) for deeper context.  

3. **Services & Their Readmes**  
   - All major services live in the [`/services`](./services) folder.  
   - Each service has its **own** `README` explaining what it does, how to configure it, and how to run it. For example:  
     - `services/service-name/README.md`  
   - This modular design helps you integrate or modify only the parts relevant to your project's needs.

4. **Run or Test Locally**  
   - If you plan to develop locally (e.g., on a Solana devnet), follow the instructions in each service's README for setup, environment variables, and testing scripts.  
   - Typical steps involve installing dependencies via `yarn` or `npm` and using Anchor's CLI to deploy the program in a local validator or on devnet.

5. **Join the Community**  
   - For questions, ideas, or general discussion, check out the official Higherrrrrrr social channels (Discord, Telegram, Twitter, etc.).  
   - We encourage open-source collaboration and welcome PRs, bug reports, and feature suggestions.

---

## Documentation Overview

Here's a quick rundown of the **key** docs in the `docs/` directory:

- **[`docs/technical-design-document.md`](./docs/technical-design-document.md)**  
  The extended TDD covering all data structures, instruction flows, validation steps, and corner cases. Start here if you need a full architectural overview.

- **[`README.md`](./README.md)**  
  This file—an overview of the entire repo and how to navigate it.

- **[`docs/tokenomics.md`](./docs/tokenomics.md)**  
  Explains the core tokenomics approach (e.g., deflationary mechanics, big-holder NFT thresholds, single-sided liquidity) in a concise community briefing style.

- **[`docs/creator-guide.md`](./docs/creator-guide.md)**  
  A high-level guide for token creators, focusing on how to launch their own "Cult Coin" with on-chain evolutions and NFT rewards.

- **[`docs/whitepaper.md`](./docs/whitepaper.md)**  
  A more formal deep dive into the philosophy, architecture, tokenomics, and governance model of the Higherrrrrrr protocol.

- **[`docs/security-posture.md`](./docs/security-posture.md)**  
  Outlines the project's approach to security, including design reviews, audits, and how the program handles on-chain risk.

- **Other** (e.g., `docs/contributing.md`, `docs/content-guidelines.md`, etc.)  
  - **`docs/contributing.md`** covers how to submit pull requests or propose integrations as a service provider.  
  - **`docs/content-guidelines.md`** describes constraints on token/metadata content to keep the ecosystem safe and positive.

---

## Contributing

We welcome contributions! Whether you want to fix bugs, propose new features, or build your own services under the Higherrrrrrr umbrella:

1. **Fork** the repo and create a new branch.  
2. **Make your changes** and ensure all tests pass locally.  
3. **Open a PR** describing your updates—be as clear as possible so reviewers can provide quick feedback.

For more details, see our [`docs/contributing.md`](./docs/contributing.md).

---

## License

Higherrrrrrr is an open-source project aiming to bring meme-level fun and robust engineering to Solana's token ecosystem. See the `LICENSE` file for specific terms.

**Thank you** for exploring the Higherrrrrrr platform. If you have any questions or feedback, jump into our community chats—we look forward to seeing the next wave of evolutionary meme tokens take flight!