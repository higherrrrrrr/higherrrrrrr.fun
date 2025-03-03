import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { GET } from '../../app/api/trades/route';
import { query } from '../../models/db';

// Mock test data
const testTrades = [
  {
    id: 1,
    transaction_hash: '3oQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
    wallet_address: 'WalletA111111111111111111111111111111111111111',
    token_in: 'TokenA2222222222222222222222222222222222222222',
    token_out: 'TokenB3333333333333333333333333333333333333333',
    amount_in: '1000000',
    amount_out: '500000',
    fees: '3500',
    price_in_usd: '1.2',
    price_out_usd: '2.4',
    value_in_usd: '1.2',
    value_out_usd: '1.2',
    block_timestamp: new Date().toISOString(),
    created_at: new Date()
  },
  {
    id: 2,
    transaction_hash: '4pQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
    wallet_address: 'WalletB111111111111111111111111111111111111111',
    token_in: 'TokenA2222222222222222222222222222222222222222',
    token_out: 'TokenC3333333333333333333333333333333333333333',
    amount_in: '2000000',
    amount_out: '1000000',
    fees: '7000',
    price_in_usd: '1.2',
    price_out_usd: '2.5',
    value_in_usd: '1.2',
    value_out_usd: '1.2',
    block_timestamp: new Date().toISOString(),
    created_at: new Date()
  }
];

// Mock the database query function
vi.mock('@/models/db', () => ({
  query: vi.fn()
}));

describe('Trades API Endpoint', () => {
  // Setup
  beforeAll(() => {
    // Default mock implementation
    query.mockImplementation((sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return Promise.resolve({ rows: [{ count: testTrades.length }] });
      }
      
      // Filter by wallet if needed
      let filteredTrades = [...testTrades];
      if (params && params.length > 0 && sql.includes('WHERE wallet_address')) {
        filteredTrades = testTrades.filter(t => t.wallet_address === params[0]);
      }
      
      return Promise.resolve({ rows: filteredTrades });
    });
  });
  
  afterAll(() => {
    vi.clearAllMocks();
  });
  
  test('Should return all trades with default pagination', async () => {
    const req = new Request('http://localhost/api/trades');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.pagination).toEqual({
      total: 2,
      limit: 10,
      offset: 0,
      hasMore: false
    });
  });
  
  test('Should filter trades by wallet address', async () => {
    // Mock implementation for wallet filtering
    query.mockImplementationOnce((sql, params) => {
      return Promise.resolve({ 
        rows: testTrades.filter(t => t.wallet_address === 'WalletA111111111111111111111111111111111111111')
      });
    });
    
    query.mockImplementationOnce((sql, params) => {
      return Promise.resolve({ rows: [{ count: 1 }] });
    });
    
    const req = new Request('http://localhost/api/trades?wallet_address=WalletA111111111111111111111111111111111111111');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].wallet_address).toBe('WalletA111111111111111111111111111111111111111');
  });
  
  test('Should paginate results correctly', async () => {
    // More test trades for pagination
    const manyTrades = Array.from({ length: 15 }, (_, i) => ({
      ...testTrades[0],
      id: i + 1,
      transaction_hash: `Transaction${i}`
    }));
    
    // Mock implementation for pagination
    query.mockImplementationOnce((sql, params) => {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      return Promise.resolve({ 
        rows: manyTrades.slice(offset, offset + limit)
      });
    });
    
    query.mockImplementationOnce((sql, params) => {
      return Promise.resolve({ rows: [{ count: 15 }] });
    });
    
    const req = new Request('http://localhost/api/trades?limit=5&offset=5');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(5);
    expect(data.pagination).toEqual({
      total: 15,
      limit: 5,
      offset: 5,
      hasMore: true
    });
  });
  
  test('Should reject invalid pagination parameters', async () => {
    const req = new Request('http://localhost/api/trades?limit=invalid');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid limit parameter');
  });
  
  test('Should handle database errors gracefully', async () => {
    query.mockImplementationOnce(() => {
      return Promise.reject(new Error('Database connection error'));
    });
    
    const req = new Request('http://localhost/api/trades');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database connection error');
  });
  
  test('Should return trades with price information', async () => {
    const req = new Request('http://localhost/api/trades');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data[0]).toHaveProperty('price_in_usd');
    expect(data.data[0]).toHaveProperty('price_out_usd');
    expect(data.data[0]).toHaveProperty('value_in_usd');
    expect(data.data[0]).toHaveProperty('value_out_usd');
    
    expect(parseFloat(data.data[0].price_in_usd)).toBe(1.2);
    expect(parseFloat(data.data[0].price_out_usd)).toBe(2.4);
  });
});