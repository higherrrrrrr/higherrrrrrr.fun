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
- OpenAI API key (for AI support)
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

3. Set up your environment:
Create `.env.local` with:
```env
NEXT_PUBLIC_RPC_URL=your-evm-node-url
NEXT_PUBLIC_REFRESH_INTERVAL=60000  # Data refresh in ms
OPENAI_API_KEY=your-openai-api-key  # For AI support chat
```

4. Build the knowledge base:
```bash
# This scans all markdown files in the repo and builds the AI knowledge base
yarn build-knowledge
```

5. Start it up:
```bash
npm run dev
```

6. Visit [http://localhost:3000](http://localhost:3000) and watch number go up (hopefully)

## Contributing

PRs welcome, especially for:
- More token integrations
- Better price feed sources
- Degen-friendly UI improvements
- Gas optimizations
- Documentation improvements (automatically included in AI support)

## Notes

- Designed for EVM-compatible chains
- Price feeds update every minute by default
- Trend data based on 6hr volume
- Keep an eye on your RPC rate limits
- AI support knowledge base is automatically rebuilt during `yarn build`
- Knowledge base includes all `.md` files from the repo

---

Built with 💎🤲 and Next.js