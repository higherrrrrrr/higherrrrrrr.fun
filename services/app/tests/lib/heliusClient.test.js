import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { HeliusClient } from '../../lib/helius/client';

// Mock global fetch
global.fetch = vi.fn();

describe('Helius Client', () => {
  let heliusClient;
  
  beforeEach(() => {
    heliusClient = new HeliusClient('test-api-key');
    
    // Reset fetch mock
    fetch.mockReset();
  });
  
  test('Should fetch transaction details', async () => {
    // Mock API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        signature: 'test-signature',
        instructions: [
          { programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' }
        ]
      })
    });
    
    const result = await heliusClient.getTransaction('test-signature');
    
    expect(result).toEqual({
      signature: 'test-signature',
      instructions: [
        { programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' }
      ]
    });
    
    expect(fetch).toHaveBeenCalledWith(
      'https://api.helius.xyz/v0/transactions/test-signature?api-key=test-api-key'
    );
  });
  
  test('Should fetch Jupiter transactions', async () => {
    // Mock API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { signature: 'sig1' },
        { signature: 'sig2' }
      ])
    });
    
    const result = await heliusClient.getJupiterTransactions(null, 2);
    
    expect(result).toEqual([
      { signature: 'sig1' },
      { signature: 'sig2' }
    ]);
    
    const expectedUrl = 'https://api.helius.xyz/v0/addresses/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4/transactions?api-key=test-api-key&limit=2&commitment=confirmed&program-id=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
    expect(fetch).toHaveBeenCalledWith(expectedUrl);
  });
  
  test('Should fetch token prices', async () => {
    // Mock SDK client instead of API
    const mockGetAsset = vi.fn().mockResolvedValue({
      token_info: {
        price_info: {
          price_per_token: 1.5
        }
      }
    });
    
    // Mock the SDK client's rpc.getAsset method
    heliusClient.sdkClient = {
      rpc: {
        getAsset: mockGetAsset
      }
    };
    
    const result = await heliusClient.getTokenPrices(['token1', 'token2']);
    
    expect(result).toEqual({
      'token1': 1.5,
      'token2': 1.5
    });
    
    // Check that SDK was called for each token
    expect(mockGetAsset).toHaveBeenCalledTimes(2);
    expect(mockGetAsset).toHaveBeenCalledWith({ id: 'token1' });
    expect(mockGetAsset).toHaveBeenCalledWith({ id: 'token2' });
  });
  
  test('Should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });
    
    await expect(heliusClient.getTransaction('test-signature'))
      .rejects
      .toThrow('Helius API error: Internal Server Error');
  });
}); 