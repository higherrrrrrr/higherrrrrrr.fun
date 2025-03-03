import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { POST } from '../../app/api/trades/record/route';
import { query } from '../../models/db';

// Mock the database query function
vi.mock('@/models/db', () => ({
  query: vi.fn()
}));

describe('Trade Recording API Endpoint', () => {
  beforeAll(() => {
    // Default mock implementation
    query.mockImplementation(() => {
      return Promise.resolve({ rows: [{ id: 1 }] });
    });
  });
  
  afterAll(() => {
    vi.clearAllMocks();
  });
  
  test('Should record a trade with fee and price data', async () => {
    const tradeData = {
      transaction_hash: '3oQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
      wallet_address: 'WalletA111111111111111111111111111111111111111',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '1000000',
      amount_out: '500000',
      fees: '3500',
      price_in_usd: '1.2',
      price_out_usd: '2.4',
      block_timestamp: new Date().toISOString()
    };
    
    const req = new Request('http://localhost/api/trades/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeData)
    });
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.trade_id).toBe(1);
    
    // Verify query was called with all parameters
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO trades'),
      expect.arrayContaining([
        tradeData.transaction_hash,
        tradeData.wallet_address,
        tradeData.token_in,
        tradeData.token_out,
        tradeData.amount_in,
        tradeData.amount_out,
        expect.any(String), // timestamp
        tradeData.fees,
        tradeData.price_in_usd,
        tradeData.price_out_usd
      ])
    );
  });
  
  test('Should handle missing price and fee data', async () => {
    const tradeData = {
      transaction_hash: '3oQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
      wallet_address: 'WalletA111111111111111111111111111111111111111',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '1000000',
      amount_out: '500000'
    };
    
    const req = new Request('http://localhost/api/trades/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeData)
    });
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify default values were used
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO trades'),
      expect.arrayContaining([
        expect.any(String), // transaction_hash
        expect.any(String), // wallet_address
        expect.any(String), // token_in
        expect.any(String), // token_out
        expect.any(String), // amount_in
        expect.any(String), // amount_out
        expect.any(String), // timestamp
        0, // default fee
        0, // default price_in_usd
        0  // default price_out_usd
      ])
    );
  });
}); 