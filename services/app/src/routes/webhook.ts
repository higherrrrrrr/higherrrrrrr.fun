import { Router } from 'express';
import crypto from 'crypto';
import { 
  getTokenMetadata, 
  getTokenHolders, 
  calculateDistributionCategory,
  formatTokenData 
} from '../services/helius';
import db from '../db';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for webhook endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Verify Helius webhook signature
function verifySignature(signature: string, body: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Apply rate limiting to webhook endpoint
router.post('/helius', limiter, async (req, res) => {
  try {
    // Verify webhook signature if configured
    const signature = req.headers['x-helius-signature'];
    const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      if (!verifySignature(signature as string, JSON.stringify(req.body), webhookSecret)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    
    // Log incoming webhook
    console.log('Received webhook event:', {
      type: event.type,
      timestamp: new Date().toISOString(),
      data: event.data
    });

    if (event.type === 'TOKEN_CREATED') {
      const mintAddress = event.data.mintAddress;
      console.log(`Processing new token: ${mintAddress}`);

      // Fetch token details in parallel
      const [metadataResponse, holdersResponse] = await Promise.all([
        getTokenMetadata([mintAddress]),
        getTokenHolders(mintAddress)
      ]);

      const metadata = metadataResponse[0];
      const holders = holdersResponse.holders;

      // Calculate distribution category
      const distributionCategory = calculateDistributionCategory(holders);

      // Format token data
      const tokenData = formatTokenData(metadata);

      // Begin transaction
      const transaction = db.transaction(() => {
        // Insert new token
        db.prepare(`
          INSERT INTO tokens (
            mint_address,
            name,
            symbol,
            total_supply,
            circulating_supply,
            market_cap,
            volume_24h,
            current_price,
            holders_count,
            distribution_category,
            launch_date,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(mint_address) DO UPDATE SET
            name = excluded.name,
            symbol = excluded.symbol,
            total_supply = excluded.total_supply,
            circulating_supply = excluded.circulating_supply,
            market_cap = excluded.market_cap,
            volume_24h = excluded.volume_24h,
            current_price = excluded.current_price,
            holders_count = excluded.holders_count,
            distribution_category = excluded.distribution_category,
            updated_at = CURRENT_TIMESTAMP
        `).run(
          mintAddress,
          tokenData.name,
          tokenData.symbol,
          tokenData.totalSupply,
          tokenData.circulatingSupply,
          tokenData.marketCap,
          tokenData.volume24h,
          tokenData.currentPrice,
          holders.length,
          distributionCategory
        );

        // Log webhook processing
        db.prepare(`
          INSERT INTO webhook_logs (
            event_type,
            mint_address,
            processed_at,
            success
          ) VALUES (?, ?, CURRENT_TIMESTAMP, 1)
        `).run(event.type, mintAddress);
      });

      // Execute transaction
      transaction();

      console.log(`Successfully processed new token: ${mintAddress}`);
      return res.status(200).json({ 
        message: 'Token processed successfully',
        mintAddress
      });
    }

    // Handle other event types
    if (event.type === 'TOKEN_TRANSFER') {
      // TODO: Implement transfer handling
      return res.status(200).json({ message: 'Transfer event acknowledged' });
    }

    console.warn(`Unhandled event type: ${event.type}`);
    return res.status(400).json({ error: 'Unsupported event type' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log webhook error
    if (req.body?.data?.mintAddress) {
      db.prepare(`
        INSERT INTO webhook_logs (
          event_type,
          mint_address,
          processed_at,
          success,
          error_message
        ) VALUES (?, ?, CURRENT_TIMESTAMP, 0, ?)
      `).run(
        req.body.type,
        req.body.data.mintAddress,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;