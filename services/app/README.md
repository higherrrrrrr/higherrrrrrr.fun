# Higherrrrrrr.fun - EVM Alpha

Real-time token trading dashboard for the degen in all of us. Track trending EVM tokens with price action, market caps, and more.

## Architecture

```
/src
  /components
    - TokenCard.jsx        # Individual token display cards
    - TrendingGrid.jsx     # Main grid layout for tokens
    - PriceProgress.jsx    # Progress bar visualization
  /lib
    - tokenService.js      # Token data fetching and processing
    - priceFeeds.js        # Price feed integrations
  /scripts
    - build-knowledge.js   # Builds AI knowledge base from docs
  /styles
    - globals.css         # Global styles + Tailwind directives
  /data
    - knowledge-base.json # Generated AI support knowledge base
```

## Local Development

### Prerequisites
- Node.js 18+
- Your favorite EVM node URL (Infura/Alchemy)
- Coffee ☕

### Setup

1. Clone the repo:
```bash
git clone https://github.com/higherrrrrrr/higherrrrrrrrr.fun.git
cd higherrrrrrrrr.fun
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
Create `.env.local` with:
```env
NEXT_PUBLIC_RPC_URL=your-evm-node-url
NEXT_PUBLIC_REFRESH_INTERVAL=60000  # Data refresh in ms
```

4. Build the knowledge base:
```bash
# This scans all markdown files in the repo and builds the AI knowledge base
yarn build-knowledge
```

5. Start PostgreSQL:
```bash
docker-compose up -d postgres
```

6. Run migrations:
```bash
pnpm migrate
```

7. Start it up:
```bash
pnpm dev
```

## Development

Start the development server:
```bash
pnpm dev
```

Run tests:
```bash
pnpm test
```

## API Routes

### Achievements
- `GET /api/achievements` - List user achievements
- `POST /api/achievements/check` - Check for new achievements
- `GET /api/achievements/progress` - Get achievement progress
- `GET /api/achievements/stats` - Get achievement statistics

### Tokens
- `GET /api/tokens/all` - List all tokens
- `GET /api/price/solana` - Get Solana price

### Balance
- `POST /api/snapshot-balance` - Record wallet balance
- `GET /api/balance-history` - Get balance history

## Schema Validation

Uses Yup for request validation. See schemas in:

## Rate Limiting

API routes are rate-limited. See configuration in:

## Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit PR

## License

MIT
