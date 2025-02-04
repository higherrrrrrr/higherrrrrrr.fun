import cron from 'node-cron';
import db from '../db';
import { 
  getTokenMetadata, 
  getTokenHolders, 
  calculateDistributionCategory,
  formatTokenData 
} from '../services/helius';
import { TokenData } from '../types';

// Constants for job configuration
const BATCH_SIZE = 10; // Number of tokens to process in parallel
const UPDATE_INTERVAL = '*/5 * * * *'; // Every 5 minutes
const MAX_RETRIES = 3;

interface UpdateMetrics {
  totalTokens: number;
  successfulUpdates: number;
  failedUpdates: number;
  startTime: Date;
  endTime?: Date;
}

async function updateTokenBatch(tokens: { mint_address: string }[], metrics: UpdateMetrics) {
  return Promise.all(
    tokens.map(async (token) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          // Fetch token data in parallel
          const [metadataResponse, holdersResponse] = await Promise.all([
            getTokenMetadata([token.mint_address]),
            getTokenHolders(token.mint_address)
          ]);

          const metadata = metadataResponse[0];
          const holders = holdersResponse.holders;

          // Calculate distribution category
          const distributionCategory = calculateDistributionCategory(holders);

          // Format token data
          const tokenData = formatTokenData(metadata);

          // Update token in database
          db.prepare(`
            UPDATE tokens 
            SET 
              name = ?,
              symbol = ?,
              total_supply = ?,
              circulating_supply = ?,
              market_cap = ?,
              volume_24h = ?,
              current_price = ?,
              holders_count = ?,
              distribution_category = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE mint_address = ?
          `).run(
            tokenData.name,
            tokenData.symbol,
            tokenData.totalSupply,
            tokenData.circulatingSupply,
            tokenData.marketCap,
            tokenData.volume24h,
            tokenData.currentPrice,
            holders.length,
            distributionCategory,
            token.mint_address
          );

          metrics.successfulUpdates++;
          console.log(`Updated token: ${token.mint_address}`);
          return;
        } catch (error) {
          retries++;
          console.error(`Error updating token ${token.mint_address} (attempt ${retries}/${MAX_RETRIES}):`, error);
          if (retries === MAX_RETRIES) {
            metrics.failedUpdates++;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    })
  );
}

async function updateTokenMetrics(): Promise<UpdateMetrics> {
  const metrics: UpdateMetrics = {
    totalTokens: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    startTime: new Date()
  };

  try {
    console.log('Starting token metrics update job...');

    // Get all tokens from DB
    const tokens = db.prepare('SELECT mint_address FROM tokens').all();
    metrics.totalTokens = tokens.length;

    // Process tokens in batches
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      await updateTokenBatch(batch, metrics);
      
      // Log progress
      console.log(`Progress: ${i + batch.length}/${tokens.length} tokens processed`);
    }

  } catch (error) {
    console.error('Error during token update job:', error);
  } finally {
    metrics.endTime = new Date();
    
    // Log job summary
    console.log('Token update job complete:', {
      totalTokens: metrics.totalTokens,
      successful: metrics.successfulUpdates,
      failed: metrics.failedUpdates,
      duration: `${(metrics.endTime.getTime() - metrics.startTime.getTime()) / 1000}s`
    });

    // Store metrics in database for monitoring
    db.prepare(`
      INSERT INTO job_metrics (
        job_name,
        total_items,
        successful_items,
        failed_items,
        duration_ms,
        started_at,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'token_updater',
      metrics.totalTokens,
      metrics.successfulUpdates,
      metrics.failedUpdates,
      metrics.endTime.getTime() - metrics.startTime.getTime(),
      metrics.startTime.toISOString(),
      metrics.endTime.toISOString()
    );
  }

  return metrics;
}

// Schedule the job
const job = cron.schedule(UPDATE_INTERVAL, () => {
  updateTokenMetrics().catch(error => {
    console.error('Failed to run token update job:', error);
  });
}, {
  scheduled: false
});

// Export for manual triggering and control
export const tokenUpdater = {
  start: () => {
    console.log(`Token updater scheduled to run every 5 minutes`);
    job.start();
    // Run once immediately on startup
    updateTokenMetrics().catch(console.error);
  },
  stop: () => {
    console.log('Token updater stopped');
    job.stop();
  },
  runNow: () => {
    console.log('Running token updater manually');
    return updateTokenMetrics();
  }
}; 