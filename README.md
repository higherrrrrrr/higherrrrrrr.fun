# Higherrrrrrr Protocol

A revolutionary memecoin launchpad & token evolution framework built on Solana. This project enables the creation of tokens that evolve based on market performance, featuring on-chain metadata updates, conviction NFTs, and advanced trading mechanics.

## 🏗️ Project Structure

```
/services
  /api             # Backend REST API service
  /app             # Next.js frontend application
  /evm             # EVM-related services & migrations
    /characters    # AI character configurations
    /ponder       # Indexing service for protocol events
    /rpc          # Custom RPC caching proxy
    /subgraphs    # TheGraph subgraphs for indexing
  /landing        # Landing page website
  /protocol       # Solana smart contracts (Anchor)
```

## 🚀 Key Features

- **Token Evolution Framework**: Tokens that autonomously evolve based on price milestones
- **Conviction NFTs**: Special NFTs awarded to significant holders through market achievements
- **Single-sided Liquidity**: Advanced liquidity provision mechanisms via Orca
- **Real-time Indexing**: TheGraph & Ponder services for protocol data
- **AI-powered Social**: Character-driven social media automation
- **Performance Optimized**: Custom RPC caching and advanced data indexing

## 🛠 Technology Stack

- **Frontend**: Next.js, TailwindCSS, wagmi
- **Backend**: Flask, PostgreSQL
- **Blockchain**:
  - Solana (Anchor Framework)
  - Base Network (EVM)
- **Infrastructure**:
  - TheGraph for indexing
  - Ponder for EVM event processing
  - NGINX for RPC caching
  - OpenRouter for AI integration

## 🏃‍♂️ Running the Project

### Prerequisites

- Node.js 18+
- Python 3.11+
- Rust & Solana CLI
- Docker & Docker Compose
- Postgres 14+

### API Service

```bash
cd services/api
cp .env.example .env  # Configure environment variables
pip install -r requirements.txt
flask run
```

### Frontend App

```bash
cd services/app
yarn install
yarn dev
```

### Protocol (Solana Contracts)

```bash
cd services/protocol
anchor build
anchor deploy
```

### EVM Services

```bash
# Run indexer
cd services/evm/ponder
npm install
npm run dev

# Run RPC cache
cd services/evm/rpc
docker build -t rpc-cache .
docker run -p 8080:8080 rpc-cache
```

## 🔐 Security

- Smart contract security details are documented in [SECURITY-POSTURE.md](services/protocol/docs/SECURITY-POSTURE.md)
- Regular audits and AI-based security scanning
- Bug bounty program for critical vulnerabilities

## 📈 Tokenomics

See [TOKENOMICS.md](services/protocol/docs/TOKENOMICS.md) for detailed information about:
- Token distribution & vesting
- Evolution mechanics
- Fee structures
- Liquidity mechanics

## 📄 Legal

This project is licensed under the WAGMI License (MIT-Compatible).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## 🌐 Resources

- [Documentation](https://docs.higherrrrrrr.fun)
- [Website](https://higherrrrrrr.fun)
- [Twitter](https://twitter.com/higherrrrrrrfun)
- [Telegram](https://t.me/higherrrrrrrfun)

## ⚠️ Disclaimer

This project is experimental and should be used at your own risk. Always conduct thorough research before interacting with any blockchain protocols.