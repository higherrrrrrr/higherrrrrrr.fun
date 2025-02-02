# Higherrrrrrr Monorepo - Revolutionary Memecoin Launchpad & Token Evolution Framework

## 🚀 Overview

**Higherrrrrrr** is a groundbreaking **memecoin launchpad and token evolution framework** built with a focus on **community-driven innovation**, **transparency**, and **robust on-chain engineering**. This monorepo contains all the code and resources necessary to run the Higherrrrrrr ecosystem, from Solana smart contracts and EVM services to the frontend application and supporting scripts.

Our aim is to bridge the vibrant world of meme culture with cutting-edge blockchain technology, creating a platform that is both engaging and secure. We leverage token evolution mechanics, conviction NFTs, and advanced trading features to offer a unique and dynamic experience for memecoin creators and communities.

This monorepo is structured to facilitate modular development and clear separation of concerns between different parts of the Higherrrrrrr ecosystem.

## 📂 Monorepo Structure

The repository is organized into the following top-level directories:

```
higherrrrrrrrr.fun/
├── CONTRIBUTING.md # Guidelines for contributing to the project
├── LEGAL.md # Lawyer brief and legal disclaimers
├── LICENSE # Project license (WAGMI License)
├── README.md # 📝 You are here! - Monorepo README
├── images/ # Static images and assets
│ └── final-nfts/ # HTML and SVG files for final NFT collection display
├── scripts/ # Various utility and experimental scripts
│ ├── log-prob-experiment.py # Python script for OpenAI log probability experiment
│ ├── private-public.py # Python script to derive Ethereum address from private key
│ └── requirements.txt # Python requirements for scripts
├── services/ # Backend services and frontend application
│ ├── api/ # Flask-based REST API service (Social Media Automation)
│ │ ├── Dockerfile # Dockerfile for API service
│ │ ├── README.md # README for API service
│ │ ├── abi/ # JSON ABI files for Ethereum contracts (UniswapV3Pool)
│ │ ├── app.py # Main Flask application file
│ │ ├── clients/ # Clients for external services (OpenRouter)
│ │ ├── config.py # Configuration management
│ │ ├── migrations/ # Alembic database migrations
│ │ ├── models/ # SQLAlchemy database models (Token, Tweet)
│ │ ├── routes/ # Flask API route definitions
│ │ ├── services/ # Internal services (Price Service)
│ │ ├── templates/ # HTML templates (Twitter Callback)
│ │ └── requirements.txt # Python requirements for API service
│ ├── app/ # Next.js frontend application (EVM Alpha)
│ │ ├── Dockerfile # Dockerfile for frontend app
│ │ ├── README.md # README for frontend app
│ │ ├── api/ # API client-side functions
│ │ ├── components/ # React components
│ │ ├── data/ # Static data (featured projects, tokens)
│ │ ├── hooks/ # Custom React hooks
│ │ ├── layouts/ # Layout components
│ │ ├── onchain/ # On-chain interaction logic (ABIs, config, queries)
│ │ ├── pages/ # Next.js pages and routes
│ │ ├── public/ # Public assets (images, icons)
│ │ ├── styles/ # Global CSS and Tailwind configurations
│ │ └── jsconfig.json # Javascript configuration
│ ├── evm/ # EVM-related services
│ │ ├── characters/ # AI character configurations (JSON)
│ │ ├── ponder/ # Ponder indexing service for protocol events
│ │ │ ├── Dockerfile # Dockerfile for Ponder service
│ │ │ ├── README.md # README for Ponder service
│ │ │ ├── abis/ # ABIs for EVM contracts (v0, v1)
│ │ │ ├── ponder-env.d.ts # Ponder environment type definitions
│ │ │ ├── ponder.config.ts # Ponder configuration file
│ │ │ ├── ponder.schema.ts # Ponder GraphQL schema definition
│ │ │ ├── src/ # Ponder service source code
│ │ │ ├── package.json # npm package definition
│ │ │ └── tsconfig.json# TypeScript configuration
│ │ ├── rpc/ # Custom RPC caching proxy (NGINX)
│ │ │ ├── Dockerfile # Dockerfile for RPC cache proxy
│ │ │ ├── README.md # README for RPC cache proxy
│ │ │ └── nginx.conf # NGINX configuration file
│ │ └── subgraphs/ # TheGraph subgraphs for indexing (tokens)
│ │ ├── tokens/ # Subgraph for token events
│ │ │ ├── abis/ # ABIs for subgraph contracts (Contract, Factory, UniswapV3Pool)
│ │ │ ├── build/ # Build output directory
│ │ │ ├── generated/ # Generated code directory
│ │ │ ├── schema.graphql # GraphQL schema for subgraph
│ │ │ ├── src/ # Subgraph mapping logic (AssemblyScript)
│ │ │ ├── subgraph.yaml # Subgraph manifest file
│ │ │ ├── package.json # npm package definition
│ │ │ └── tsconfig.json # TypeScript configuration
│ └── landing/ # Landing page website (Next.js)
│ ├── Dockerfile # Dockerfile for landing page
│ ├── README.md # README for landing page
│ ├── client/ # Client-side utilities (Capsule client)
│ ├── components/ # React components for landing page
│ ├── data/ # Data for landing page (featured projects)
│ ├── layouts/ # Layout components for landing page
│ ├── pages/ # Next.js pages and routes for landing page
│ ├── public/ # Public assets for landing page
│ ├── styles/ # Styles (globals.css) for landing page
│ ├── next.config.js # Next.js configuration file (JS version)
│ └── next.config.mjs# Next.js configuration file (MJS version)
└── services/protocol/ # Solana smart contracts (Anchor) - detailed README.md in subdirectory
```


## ✨ Key Features

The Higherrrrrrr ecosystem is packed with features that blend memecoin culture with robust on-chain functionality:

- **Token Evolution Framework**: Tokens autonomously evolve based on price milestones, reflecting market performance and community growth.
- **Conviction NFTs**: Unique NFTs awarded to significant token holders, commemorating their early support and participation in token evolution.
- **Single-sided Liquidity**: Utilizes advanced liquidity provision mechanisms through Orca, ensuring efficient and stable trading.
- **Real-time Indexing**: Employs TheGraph and Ponder services to index protocol data, providing real-time analytics and data accessibility.
- **AI-powered Social Automation**: Features AI-driven social media automation, enabling character-driven content generation and engagement.
- **Performance Optimized Infrastructure**: Leverages custom RPC caching and advanced data indexing for optimal performance and scalability.
- **Transparent Service Provider Integrations**: Facilitates open and competitive integration of third-party services through a transparent proposal process.
- **Open-Source Contribution Model**: Encourages community contributions through clear guidelines for open-source code improvements and service provider proposals.

## 🛠 Technology Stack

The Higherrrrrrr monorepo utilizes a diverse and powerful technology stack:

- **Frontend**:
    - **Framework**: Next.js
    - **Styling**: TailwindCSS
    - **Wallet Integration**: wagmi, ConnectKit, Capsule SDK
- **Backend**:
    - **API Service**: Flask (Python), PostgreSQL
    - **EVM Services**: Node.js, Docker
- **Blockchain**:
    - **Solana**: Anchor Framework (Rust)
    - **Base Network**: EVM Compatibility
- **Infrastructure**:
    - **Indexing**: TheGraph, Ponder
    - **RPC Caching**: NGINX
    - **AI Integration**: OpenRouter API

## 🏃‍♂️ Running the Project

To run the entire Higherrrrrrr ecosystem locally, you'll need to set up and run each service individually. Refer to the README.md files within each subdirectory in `services/` for detailed instructions. Here's a high-level overview:

1.  **API Service (`services/api`)**:
    - Set up Python 3.11+ and PostgreSQL.
    - Configure environment variables in `.env` (copy from `.env.example`).
    - Install Python dependencies: `pip install -r requirements.txt`.
    - Run the Flask development server: `flask run`.

2.  **Frontend App (`services/app`)**:
    - Ensure Node.js 18+ is installed.
    - Install JavaScript dependencies: `yarn install`.
    - Configure environment variables in `.env.local` (copy from `.env.example`).
    - Start the Next.js development server: `yarn dev`.

3.  **Protocol (Solana Contracts) (`services/protocol`)**:
    - Install Rust, Solana CLI, and Anchor CLI.
    - Build the Solana program: `anchor build`.
    - Deploy the program to localnet: `anchor deploy`.

4.  **EVM Services (`services/evm`)**:
    - **Ponder Indexer (`services/evm/ponder`)**:
        - Install Node.js dependencies: `npm install`.
        - Configure environment variables in `.env` (copy from `.env.example`).
        - Start the Ponder development server: `npm run dev`.
    - **RPC Cache (`services/evm/rpc`)**:
        - Ensure Docker is installed.
        - Build the Docker image: `docker build -t rpc-cache .`.
        - Run the Docker container: `docker run -p 8080:8080 rpc-cache`.
    - **Subgraphs (`services/evm/subgraphs`)**:
        - Requires TheGraph CLI to be installed globally.
        - Navigate to `services/evm/subgraphs/tokens`.
        - Configure subgraph manifest (`subgraph.yaml`) with your endpoint.
        - Build and deploy the subgraph using TheGraph CLI commands (refer to `package.json` scripts).

**Note**: Running all services requires a comprehensive setup and configuration. For development purposes, you might choose to run only the services you are actively working on.

## 🔐 Security & 📜 Legal

- **Security**:  Refer to [SECURITY-POSTURE.md](./services/protocol/docs/SECURITY-POSTURE.md) for a detailed overview of the project's security posture, methodologies, and practices.
- **Legal**:  Consult [LEGAL.md](./LEGAL.md) for important legal disclaimers and a lawyer brief (non-legal advice).
- **Tokenomics**:  Detailed tokenomics information can be found in [TOKENOMICS.md](./services/protocol/docs/TOKENOMICS.md).

**Disclaimer**: Both `LEGAL.md` and `SECURITY-POSTURE.md` are crucial documents to review before interacting with or contributing to the Higherrrrrrr ecosystem.

## 🤝 Contributing

We highly encourage community contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on how to contribute to the project, whether it's through code improvements, feature suggestions, or service provider proposals.

## 🌐 Resources

- **Documentation**: [https://docs.higherrrrrrr.fun](https://docs.higherrrrrrr.fun) (Placeholder - documentation is under development)
- **Website**: [https://higherrrrrrr.fun](https://higherrrrrrr.fun)
- **Alpha Platform**: [https://alpha.higherrrrrrr.fun](https://alpha.higherrrrrrr.fun)
- **Twitter**: [https://twitter.com/higherrrrrrrfun](https://twitter.com/higherrrrrrrfun)
- **Telegram**: [https://t.me/higherrrrrrrfun](https://t.me/higherrrrrrrfun)
- **GitHub Issues**: [https://github.com/higherrrrrrr/higherrrrrrrrr.fun/issues](https://github.com/higherrrrrrr/higherrrrrrrrr.fun/issues) (For bug reports and feature requests)

## ⚠️ Disclaimer

**This project is highly experimental and should be used at your own risk.**  Cryptocurrency and blockchain technologies are inherently risky. Always conduct thorough research and understand the risks involved before interacting with any blockchain protocols or memecoin projects.

## 📜 License

This project is licensed under the **WAGMI License** (MIT-Compatible). See [LICENSE](./LICENSE) for the full license text.

---

**We are excited to build the future of memecoins with you!**

**The Higherrrrrrr Team**