# Higherrrrrrr Protocol Indexer

An indexing service for the Higherrrrrrr Protocol built with [Ponder](https://ponder.sh/). This service indexes token and NFT data from the protocol's smart contracts on the Base network and provides both REST and GraphQL APIs for querying the data.

## Features

- Indexes both v0 and v1 versions of the Higherrrrrrr Protocol
- Tracks token creations, transfers, and market transitions
- Indexes conviction NFTs and their metadata
- Provides REST and GraphQL APIs for data access
- Docker support for easy deployment

## Prerequisites

- Node.js v20 or higher
- Access to a Base network RPC endpoint

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```bash
PONDER_RPC_URL_8453=            # Base network RPC URL
HIGHERRRRRRR_FACTORY_V0_ADDRESS=0x6f599293d4bb71750bbe7dd4d7d26780ad4c22e1
HIGHERRRRRRR_V0_INDEXING_START_BLOCK=22936917
HIGHERRRRRRR_FACTORY_V1_ADDRESS=0x9425E9264BA541Eb00E30606F04c248Db5d0E759
HIGHERRRRRRR_V1_INDEXING_START_BLOCK=23806755
ENABLE_GRAPHQL_API=true         # Optional: Enable GraphQL API endpoint
```

## Installation

```bash
# Install dependencies
npm install

# Start the indexer
npm start
```

## Docker Deployment

```bash
# Build the Docker image
docker build -t higherrrrrrr-indexer .

# Run the container
docker run -p 8545:8545 higherrrrrrr-indexer
```

## API Endpoints

### REST API

- `GET /tokens/latest` - Get the most recent tokens (limited to 2000)
- `GET /tokens/top-trading` - Get top trading tokens in the last 12 hours
- `GET /tokens/:address` - Get token details by address
- `GET /tokens/:address/nfts` - Get all NFTs for a token
- `GET /tokens/:address/nfts/:id` - Get specific NFT details for a token
- `GET /accounts/:address/nfts` - Get all NFTs owned by an address

### GraphQL API

Available at `/graphql` when enabled via `ENABLE_GRAPHQL_API=true`. The schema includes queries for:

- Tokens
- Token transfers
- Conviction NFTs
- Market state transitions

## Data Schema

### Token

```typescript
{
  address: string;
  name: string;
  symbol: string;
  protocolVersion: "v0" | "v1";
  tokenType: "REGULAR" | "TEXT_EVOLUTION" | "IMAGE_EVOLUTION";
  marketType: "BONDING_CURVE" | "UNISWAP_POOL";
  poolAddress?: string;
  convictionAddress: string;
  creatorAddress: string;
  blockNumber: bigint;
  blockTimestamp: bigint;
}
```

### Conviction NFT

```typescript
{
  address: string;
  tokenAddress: string;
  id: bigint;
  minter?: string;
  owner: string;
  metadata: {
    name: string;
    amount: string;
    price: string;
    timestamp: Date;
    imageURI?: string;
  }
}
```

## Development

The project uses TypeScript and follows a modular structure:

- `/src` - Main source code
  - `/api` - REST and GraphQL API endpoints
  - `HigherrrrrrrV0.ts` - v0 protocol indexing logic
  - `HigherrrrrrrV1.ts` - v1 protocol indexing logic
- `/abis` - Smart contract ABIs
  - `/v0` - Version 0 contract ABIs
  - `/v1` - Version 1 contract ABIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

## License

[License information should be added here]