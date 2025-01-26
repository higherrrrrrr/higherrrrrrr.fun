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
  /styles
    - globals.css         # Global styles + Tailwind directives
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

3. Set up your environment:
Create `.env.local` with:
```env
NEXT_PUBLIC_RPC_URL=your-evm-node-url
NEXT_PUBLIC_REFRESH_INTERVAL=60000  # Data refresh in ms
```

4. Start it up:
```bash
npm run dev
```

5. Visit [http://localhost:3000](http://localhost:3000) and watch number go up (hopefully)

## Contributing

PRs welcome, especially for:
- More token integrations
- Better price feed sources
- Degen-friendly UI improvements
- Gas optimizations

## Notes

- Designed for EVM-compatible chains
- Price feeds update every minute by default
- Trend data based on 6hr volume
- Keep an eye on your RPC rate limits

---

Built with 💎🤲 and Next.js