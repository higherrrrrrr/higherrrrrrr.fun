import { Router } from 'express';
import db from '../db';
import { TokenData } from '../types';

const router = Router();

interface TokenQueryParams {
  search?: string;
  marketCapMin?: number;
  marketCapMax?: number;
  volumeMin?: number;
  volumeMax?: number;
  launchAfter?: string;
  launchBefore?: string;
  holdersMin?: number;
  distributionCategory?: 'excellent' | 'fair' | 'sketch';
}

router.get('/', async (req, res) => {
  try {
    const {
      search,
      marketCapMin,
      marketCapMax,
      volumeMin,
      volumeMax,
      launchAfter,
      launchBefore,
      holdersMin,
      distributionCategory
    } = req.query as TokenQueryParams;

    let query = 'SELECT * FROM tokens WHERE 1=1';
    const params: any[] = [];

    // Build query conditions
    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      query += ` AND (name LIKE ? OR symbol LIKE ? OR mint_address LIKE ?)`;
    }

    if (marketCapMin) {
      params.push(marketCapMin);
      query += ` AND market_cap >= ?`;
    }

    if (marketCapMax) {
      params.push(marketCapMax);
      query += ` AND market_cap <= ?`;
    }

    if (volumeMin) {
      params.push(volumeMin);
      query += ` AND volume_24h >= ?`;
    }

    if (volumeMax) {
      params.push(volumeMax);
      query += ` AND volume_24h <= ?`;
    }

    if (launchAfter) {
      params.push(launchAfter);
      query += ` AND launch_date >= ?`;
    }

    if (launchBefore) {
      params.push(launchBefore);
      query += ` AND launch_date <= ?`;
    }

    if (holdersMin) {
      params.push(holdersMin);
      query += ` AND holders_count >= ?`;
    }

    if (distributionCategory) {
      params.push(distributionCategory);
      query += ` AND distribution_category = ?`;
    }

    // Add default sorting
    query += ` ORDER BY market_cap DESC`;

    // Execute query
    const tokens = db.prepare(query).all(...params);

    res.json({
      tokens,
      count: tokens.length,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// Get a specific token by mint address
router.get('/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const token = db.prepare(
      'SELECT * FROM tokens WHERE mint_address = ?'
    ).get(mintAddress);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

export default router;
