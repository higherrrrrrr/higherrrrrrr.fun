import { NextResponse } from 'next/server';
import { Helius } from 'helius-sdk';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logger } from '../../../../lib/logger';
import { withApiHandler } from '../../../../lib/apiHandler';
import { heliusAssetsSchema } from '../../schemas';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner')?.toLowerCase();

  logger.info('Fetching assets for wallet:', owner);

  if (!owner || owner === 'null' || owner === 'undefined') {
    logger.warn('Invalid owner parameter:', owner);
    return NextResponse.json(
      { error: 'Valid owner address is required' },
      { status: 400 }
    );
  }

  try {
    await heliusAssetsSchema.validate({ owner });
  } catch (error) {
    logger.warn('Helius assets validation failed:', { owner, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    if (!process.env.HELIUS_API_KEY) {
      throw new Error('HELIUS_API_KEY not configured');
    }

    const helius = new Helius(process.env.HELIUS_API_KEY);
    
    logger.info('Fetching SOL balance and assets...');
    const [balanceResponse, solPrice, assets] = await Promise.all([
      helius.rpc.getBalance({ account: owner })
        .catch(e => {
          logger.error('Failed to fetch SOL balance:', e);
          return 0;
        }),
      helius.rpc.getPrice({ id: "SOL" })
        .catch(e => {
          logger.error('Failed to fetch SOL price:', e);
          return { value: 0 };
        }),
      helius.rpc.getAssetsByOwner({
        ownerAddress: owner,
        page: 1, 
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: false  // We get this separately
        }
      }).catch(e => {
        logger.error('Failed to fetch assets:', e);
        return { items: [] };
      })
    ]);

    const nativeBalanceUsd = (balanceResponse / LAMPORTS_PER_SOL) * (solPrice?.value || 0);
    
    logger.info('Successfully fetched assets:', {
      solBalance: balanceResponse / LAMPORTS_PER_SOL,
      solPrice: solPrice?.value,
      tokenCount: assets.items?.length
    });

    return NextResponse.json({
      items: assets.items || [],
      nativeBalance: balanceResponse,
      nativeBalanceUsd
    });
  } catch (error) {
    logger.error('Helius API error:', { owner, error });
    return NextResponse.json({
      items: [],
      nativeBalance: 0,
      nativeBalanceUsd: 0
    });
  }
}); 