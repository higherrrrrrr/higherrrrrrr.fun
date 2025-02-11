export async function GET(request, { params }) {
  // Mock data - in production this would fetch from your backend
  const mockTokenData = {
    // Basic token info
    address: params.address,
    symbol: "TOKEN",
    currentName: "Example Token",
    totalSupply: "500000000",
    maxSupply: "1000000000",
    currentPrice: "0.0001",
    currentPriceUsd: "0.15", // Price in USD
    marketCapUsd: "75000000", // Market cap in USD
    
    // Market type: 'DEX' or 'BONDING_CURVE'
    marketType: "DEX",
    chain: "base", // or 'solana'
    
    // For DEX tokens
    poolAddress: "0x123...", // Used for price charts
    
    // Price levels for name changes
    priceLevels: [
      { 
        name: "Level 1 Name", 
        price: "0",
        priceUsd: "0",
        marketCapUsd: "0"
      },
      { 
        name: "Level 2 Name", 
        price: "0.0001",
        priceUsd: "0.15",
        marketCapUsd: "150000000"
      },
      { 
        name: "Level 3 Name", 
        price: "0.001",
        priceUsd: "1.50",
        marketCapUsd: "1500000000"
      },
      { 
        name: "Level 4 Name", 
        price: "0.01",
        priceUsd: "15.00",
        marketCapUsd: "15000000000"
      }
    ],
    
    // Additional metadata
    details: {
      description: "An example token with multiple levels",
      website: "https://example.com",
      twitter: "https://twitter.com/example",
      telegram: "https://t.me/example",
      warpcast_url: "https://warpcast.com/example"
    },
    
    // Creator info
    creator: "0x456..."
  };

  return Response.json(mockTokenData);
} 