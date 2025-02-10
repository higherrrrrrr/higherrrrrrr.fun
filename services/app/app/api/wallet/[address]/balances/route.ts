import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const SOL_DECIMALS = 9;
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Create connection for native balance
const connection = new Connection(process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com');

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  try {
    // Get native SOL balance first
    let nativeBalance = 0;
    try {
      nativeBalance = await connection.getBalance(new PublicKey(address));
    } catch (solError) {
      console.error('Failed to fetch SOL balance:', solError);
    }

    // Get list of tradeable tokens from Jupiter first
    const jupiterResponse = await fetch('https://token.jup.ag/all');
    if (!jupiterResponse.ok) {
      console.error('Jupiter token list error:', await jupiterResponse.text());
      throw new Error('Failed to fetch token list');
    }
    const jupiterTokens = await jupiterResponse.json();
    
    // Create map of token metadata for quick lookup
    const tokenMetadata = new Map(
      jupiterTokens.map((token: any) => [
        token.address,
        {
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals
        }
      ])
    );

    // Use Helius DAS API
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Helius API error:', await response.text());
      throw new Error('Failed to fetch balances');
    }

    const data = await response.json();

    // Transform the response to match expected format
    const balanceResponse = {
      nativeBalance,
      tokens: [
        // Add SOL as a token
        {
          mint: SOL_MINT,
          amount: nativeBalance,
          decimals: SOL_DECIMALS,
          symbol: 'SOL',
          name: 'Solana'
        }
      ]
    };

    // Add other tokens, but only if they're tradeable on Jupiter
    if (data.tokens) {
      balanceResponse.tokens.push(
        ...data.tokens
          .filter((token: any) => 
            token.amount > 0 && 
            tokenMetadata.has(token.mint)
          )
          .map((token: any) => {
            const metadata = tokenMetadata.get(token.mint) || {
              symbol: '',
              name: '',
              decimals: token.decimals || 0
            };
            return {
              mint: token.mint,
              amount: token.amount,
              decimals: metadata.decimals,
              symbol: metadata.symbol,
              name: metadata.name
            };
          })
      );
    }

    console.log('Returning balances:', balanceResponse);
    return NextResponse.json(balanceResponse);
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
} 