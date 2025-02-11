import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { higherrrrrrrAbi } from './abi';
import config from '../../config/config';

// Create public client
const publicClient = createPublicClient({
  chain: base,
  transport: http(config.RPC_URL)
});

// Simple pool ABI for just getting price
const PoolABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function GET(request, { params }) {
  const address = params.address;
  
  // Validate address format
  if (!address?.match(/^0x[a-fA-F0-9]{40}$/)) {
    return Response.json({ error: 'Invalid address format' }, { status: 400 });
  }

  try {
    // Get token data using multicall
    const [name, symbol, totalSupply, currentPrice, maxSupply, marketType, bondingCurve, 
           convictionNFT, convictionThreshold, minOrderSize, totalFeeBps, poolAddress, priceLevels] = 
      await publicClient.multicall({
        contracts: [
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'name'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'symbol'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'totalSupply'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'getCurrentPrice'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'MAX_TOTAL_SUPPLY'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'marketType'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'bondingCurve'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'convictionNFT'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'CONVICTION_THRESHOLD'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'MIN_ORDER_SIZE'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'TOTAL_FEE_BPS'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'poolAddress'
          },
          {
            address: address,
            abi: higherrrrrrrAbi,
            functionName: 'getPriceLevels'
          }
        ]
      });

    // Format price levels
    const formattedPriceLevels = priceLevels.result?.map((level, index) => {
      const price = index === 0 ? '0' : formatEther(level.price);
      const priceUsd = parseFloat(price) * 1800; // Temporary hardcoded ETH price
      return {
        name: level.name,
        price,
        priceUsd: priceUsd.toString(),
        marketCapUsd: (priceUsd * parseFloat(formatEther(maxSupply.result || BigInt(0)))).toString()
      };
    });

    const currentPriceEth = formatEther(currentPrice.result || BigInt(0));
    const currentPriceUsd = parseFloat(currentPriceEth) * 1800; // Temporary hardcoded ETH price

    const tokenData = {
      // Basic token info
      address: address,
      symbol: symbol.result,
      currentName: name.result,
      totalSupply: formatEther(totalSupply.result || BigInt(0)),
      maxSupply: formatEther(maxSupply.result || BigInt(0)),
      currentPrice: currentPriceEth,
      currentPriceUsd: currentPriceUsd.toString(),
      marketCapUsd: (currentPriceUsd * parseFloat(formatEther(totalSupply.result || BigInt(0)))).toString(),
      
      // Market type and chain info
      marketType: Number(marketType.result || 0) === 0 ? 'BONDING_CURVE' : 'DEX',
      chain: 'base',
      
      // Pool info
      poolAddress: poolAddress.result?.toString(),
      
      // Price levels
      priceLevels: formattedPriceLevels || [],
      
      // Contract parameters
      bondingCurve: bondingCurve.result?.toString(),
      convictionNFT: convictionNFT.result?.toString(),
      convictionThreshold: formatEther(convictionThreshold.result || BigInt(0)),
      minOrderSize: formatEther(minOrderSize.result || BigInt(0)),
      totalFeeBps: Number(totalFeeBps.result || 0),
      
      // Additional metadata (could be fetched from a database)
      details: {
        description: "A Base token with multiple levels",
        website: "",
        twitter: "",
        telegram: "",
        warpcast_url: ""
      }
    };

    return Response.json(tokenData);
    
  } catch (error) {
    console.error('Error fetching token data:', error);
    return Response.json({ error: 'Failed to fetch token data' }, { status: 500 });
  }
}