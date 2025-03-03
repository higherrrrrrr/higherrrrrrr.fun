import { NextResponse } from 'next/server';
import { Helius } from 'helius-sdk';
// Try a different import approach
// import tokenCache from '../../../../services/tokens';
// Or remove the tokenCache approach entirely since it's just for testing

export async function GET(request) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    // Real token addresses
    const SOL = 'So11111111111111111111111111111111111111112';
    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const BONK = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
    
    // Initialize Helius SDK
    const helius = new Helius(process.env.HELIUS_API_KEY);
    
    console.log('Testing different price fetching approaches:');
    
    const results = {};
    
    // Skip token cache for now since it's causing issues
    // Try Helius SDK for asset data
    console.log('Using Helius SDK...');
    try {
      const assetData = await helius.rpc.getAsset({
        id: SOL
      });
      
      results.solAssetFromSDK = assetData;
      
      // Also try USDC and BONK
      const usdcData = await helius.rpc.getAsset({
        id: USDC
      });
      
      results.usdcAssetFromSDK = usdcData;
      
      const bonkData = await helius.rpc.getAsset({
        id: BONK
      });
      
      results.bonkAssetFromSDK = bonkData;
      
      // Add extracted price data for clarity
      results.priceData = {
        SOL: assetData?.token_info?.price_info?.price_per_token,
        USDC: usdcData?.token_info?.price_info?.price_per_token,
        BONK: bonkData?.token_info?.price_info?.price_per_token
      };
    } catch (e) {
      console.error('Error using Helius SDK:', e);
      results.sdkError = e.message;
    }

    // Return all results for debugging
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('Error testing prices:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 