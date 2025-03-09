import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/trades/record/route';
import { query } from '@/models/db';
import { heliusClient } from '@/lib/helius/client';

// Mock the database query function
vi.mock('@/models/db', () => ({
  query: vi.fn()
}));

// Mock the Helius client
vi.mock('@/lib/helius/client', () => ({
  heliusClient: {
    getTokenPrices: vi.fn()
  }
}));

describe('Trade Recording API with Helius Price Data', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Default query mock implementation
    query.mockImplementation(() => {
      return Promise.resolve({ rows: [{ id: 1 }] });
    });
    
    // Mock the heliusClient
    heliusClient.getTokenPrices.mockImplementation((tokens) => {
      // Create a response object with token addresses as keys
      const response = {};
      tokens.forEach(token => {
        if (token === 'TokenA2222222222222222222222222222222222222222') {
          response[token] = '1.2';
        } else if (token === 'TokenB3333333333333333333333333333333333333333') {
          response[token] = '2.4';
        } else {
          response[token] = '0';
        }
      });
      return Promise.resolve(response);
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('Should fetch price data from Helius if not provided', async () => {
    const tradeData = {
      transaction_hash: '3oQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
      wallet_address: 'WalletA111111111111111111111111111111111111111',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '1000000',
      amount_out: '500000',
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
    
    // Should have called Helius price service
    expect(heliusClient.getTokenPrices).toHaveBeenCalledWith([
      'TokenA2222222222222222222222222222222222222222', 
      'TokenB3333333333333333333333333333333333333333'
    ]);
    
    // Should use price data from Helius
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
        '1.2', // price from helius mock
        '2.4'  // price from helius mock
      ])
    );
  });
  
  test('Should use provided price data if available', async () => {
    // Clear previous mock calls to avoid interference
    vi.clearAllMocks();
    
    const tradeData = {
      transaction_hash: '4pQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
      wallet_address: 'WalletB111111111111111111111111111111111111111',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '2000000',
      amount_out: '1000000',
      price_in_usd: '1.5',
      price_out_usd: '3.0',
      value_in_usd: '3.0',
      value_out_usd: '3.0',
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
    
    // Should NOT have called Helius price service
    expect(heliusClient.getTokenPrices).not.toHaveBeenCalled();
    
    // Should use provided prices
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
        '1.5', // provided price_in_usd 
        '3.0'  // provided price_out_usd
      ])
    );
  });
  
  test('Should handle Helius service errors gracefully', async () => {
    // Make Helius service throw an error
    heliusClient.getTokenPrices.mockRejectedValue(new Error('Helius service down'));
    
    const tradeData = {
      transaction_hash: '5rQsNb3ZnTom8hadvQBjQ6t2MQ4AGiiRTyS9QJ8V9RV4vCPN4PmuXjfgZc7nxZRMc3w1u85xprAKeDoSxcRM94St',
      wallet_address: 'WalletC111111111111111111111111111111111111111',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '3000000',
      amount_out: '1500000',
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
    
    // Should still succeed even if Helius service fails
    expect(res.status).toBe(200);
  });
  
  test('Should not fetch prices when already provided', async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock DB query to return success
    query.mockResolvedValueOnce({ rows: [{ id: 123 }] });
    
    // Create trade data with valid non-zero prices
    const tradeData = {
      transaction_hash: 'abc123',
      wallet_address: 'wallet123',
      token_in: 'TokenA2222222222222222222222222222222222222222',
      token_out: 'TokenB3333333333333333333333333333333333333333',
      amount_in: '3000000',
      amount_out: '1500000',
      block_timestamp: new Date().toISOString(),
      price_in_usd: '1.23', // Valid non-zero price
      price_out_usd: '4.56'  // Valid non-zero price
    };
    
    const req = new Request('http://localhost/api/trades/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeData)
    });
    
    const res = await POST(req);
    
    // Should not have called Helius price service
    expect(heliusClient.getTokenPrices).not.toHaveBeenCalled();
    
    // Should use provided prices
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO trades'),
      expect.arrayContaining([
        tradeData.transaction_hash,
        tradeData.wallet_address,
        tradeData.token_in,
        tradeData.token_out,
        tradeData.amount_in,
        tradeData.amount_out,
        expect.anything(), // timestamp
        '1.23', // Using the provided price
        '4.56'  // Using the provided price
      ])
    );
    
    expect(await res.json()).toEqual(expect.objectContaining({
      success: true
    }));
  });
}); 