import { NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';
import { withApiHandler } from '../../../lib/apiHandler';
import { quoteSchema } from '../schemas';
import { withRetry } from '../../../lib/retry';

export const GET = withApiHandler(async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  
  try {
    await quoteSchema.validate(params);
  } catch (error) {
    logger.warn('Quote validation failed:', { params, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!process.env.ZEROEX_API_KEY) {
    logger.error('ZEROEX_API_KEY not configured');
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 500 }
    );
  }

  try {
    const data = await withRetry(async () => {
      const response = await fetch(
        `https://api.0x.org/swap/v1/quote?${request.nextUrl.searchParams}`,
        {
          headers: {
            '0x-api-key': process.env.ZEROEX_API_KEY
          }
        }
      );
      return response.json();
    });
    
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    );
  }
}); 