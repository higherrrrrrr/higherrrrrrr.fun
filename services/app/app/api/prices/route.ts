import { NextResponse } from 'next/server';

const BATCH_SIZE = 100; // Jupiter API limit

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let tokens = searchParams.get('tokens');

  if (!tokens) {
    return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
  }

  // Remove duplicate tokens and filter out empty strings
  const uniqueTokens = [...new Set(tokens.split(','))].filter(Boolean);
  const priceData: { [key: string]: any } = {};

  try {
    // First try to get all token prices in one batch using Jupiter's official endpoint
    const response = await fetch(
      `https://jupiter.api.solana.fm/v4/price?ids=${uniqueTokens.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      console.error('Jupiter API error:', await response.text());
      
      // If first attempt fails, try batching
      for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
        const batch = uniqueTokens.slice(i, i + BATCH_SIZE);
        const batchResponse = await fetch(
          `https://jupiter.api.solana.fm/v4/price?ids=${batch.join(',')}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0',
            }
          }
        );

        if (!batchResponse.ok) {
          console.error('Jupiter API batch error:', await batchResponse.text());
          continue;
        }

        const batchData = await batchResponse.json();
        Object.entries(batchData.data || {}).forEach(([mint, price]: [string, any]) => {
          priceData[mint] = {
            price: parseFloat(price.price) || 0,
            volume_24h: parseFloat(price.volume24h) || 0,
            market_cap: parseFloat(price.marketCap) || 0,
            price_change_24h: parseFloat(price.priceChange24h) || 0
          };
        });
      }
    } else {
      const jupiterData = await response.json();
      Object.entries(jupiterData.data || {}).forEach(([mint, price]: [string, any]) => {
        priceData[mint] = {
          price: parseFloat(price.price) || 0,
          volume_24h: parseFloat(price.volume24h) || 0,
          market_cap: parseFloat(price.marketCap) || 0,
          price_change_24h: parseFloat(price.priceChange24h) || 0
        };
      });
    }

    // Ensure all requested tokens have a price entry, even if zero
    uniqueTokens.forEach((mint) => {
      if (!priceData[mint]) {
        priceData[mint] = {
          price: 0,
          volume_24h: 0,
          market_cap: 0,
          price_change_24h: 0
        };
      }
    });

    console.log('Returning price data:', { data: priceData });
    return NextResponse.json({ data: priceData });
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    // Return empty data with expected structure
    return NextResponse.json({
      data: uniqueTokens.reduce((acc: any, mint: string) => {
        acc[mint] = {
          price: 0,
          volume_24h: 0,
          market_cap: 0,
          price_change_24h: 0
        };
        return acc;
      }, {})
    });
  }
} 