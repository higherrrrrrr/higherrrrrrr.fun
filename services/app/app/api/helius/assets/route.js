import { NextResponse } from 'next/server';
import { Helius } from 'helius-sdk';

// Add error checking for API key
if (!process.env.HELIUS_API_KEY) {
  throw new Error('HELIUS_API_KEY is not defined in environment variables');
}

const helius = new Helius(process.env.HELIUS_API_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ownerAddress = searchParams.get('owner');
  
  if (!ownerAddress) {
    return NextResponse.json(
      { error: 'Owner address is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Fetching assets for address:', ownerAddress);
    const response = await helius.rpc.getAssetsByOwner({
      ownerAddress: ownerAddress,
      page: 1,
      limit: 1000,
      displayOptions: {
        showFungible: true,
        showNativeBalance: true,
        showCollectionMetadata: true,
      },
      sortBy: {
        sortBy: "created",
        sortDirection: "desc"
      }
    });

    console.log('Response:', response);

    if (!response) {
      throw new Error('No response from Helius API');
    }

    // Let's also try a direct RPC call to verify
    const directResponse = await fetch("https://mainnet.helius-rpc.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: ownerAddress,
          page: 1,
          limit: 1000,
        },
      }),
    }).then(res => res.json());

    console.log('Direct RPC Response:', directResponse);

    console.log('Successfully fetched assets');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error.message },
      { status: error.response?.status || 500 }
    );
  }
} 