import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { JupiterIndexer } from '../../lib/jupiter/transactionIndexer';
import { recordJupiterTrade } from '../../lib/jupiter/tradeRecorder';
import { heliusClient } from '../../lib/helius/client';

// Mock dependencies
vi.mock('../../lib/jupiter/tradeRecorder', () => ({
  recordJupiterTrade: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('../../lib/helius/client', () => ({
  heliusClient: {
    getJupiterTransactions: vi.fn(),
    getTransaction: vi.fn(),
    getTokenPrices: vi.fn()
  }
}));

describe('Jupiter Transaction Indexer with Helius', () => {
  let indexer;
  
  beforeEach(() => {
    vi.useFakeTimers();
    indexer = new JupiterIndexer();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default Helius mocks
    heliusClient.getJupiterTransactions.mockResolvedValue([
      { signature: 'sig1' },
      { signature: 'sig2' }
    ]);
    
    heliusClient.getTransaction.mockImplementation((sig) => {
      if (sig === 'sig1') {
        return Promise.resolve({
          signature: sig,
          feePayer: 'wallet123',
          timestamp: Date.now() / 1000,
          instructions: [
            { programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' }
          ],
          tokenTransfers: [
            {
              fromUserAccount: 'wallet123',
              toUserAccount: 'program1',
              mint: 'token1',
              tokenAmount: '-100.0'
            },
            {
              fromUserAccount: 'program1',
              toUserAccount: 'wallet123',
              mint: 'token2',
              tokenAmount: '50.0'
            }
          ]
        });
      }
      return Promise.resolve(null);
    });
    
    heliusClient.getTokenPrices.mockResolvedValue({
      'token1': 1.0,
      'token2': 2.0
    });
  });
  
  afterEach(() => {
    indexer.stop();
    vi.useRealTimers();
  });
  
  test('Should poll for Jupiter transactions using Helius', async () => {
    // Start indexer
    indexer.start();
    
    // Fast-forward time to trigger polling
    await vi.runOnlyPendingTimersAsync();
    
    // Should have fetched transactions
    expect(heliusClient.getJupiterTransactions).toHaveBeenCalled();
    
    // Should have processed transactions
    expect(heliusClient.getTransaction).toHaveBeenCalledWith('sig1');
    
    // Should have fetched token prices
    expect(heliusClient.getTokenPrices).toHaveBeenCalledWith(['token1', 'token2']);
    
    // Should have recorded trade - manually check each important field
    expect(recordJupiterTrade).toHaveBeenCalled();
    
    const calledWith = recordJupiterTrade.mock.calls[0][0];
    expect(calledWith.transaction_hash).toBe('sig1');
    expect(calledWith.wallet_address).toBe('wallet123');
    expect(calledWith.token_in).toBe('token1');
    expect(calledWith.token_out).toBe('token2');
    expect(calledWith.price_in_usd).toBe('1'); // String representation
    expect(calledWith.price_out_usd).toBe('2'); // String representation
  });
  
  test('Should extract correct swap details from Helius transaction', () => {
    const txDetails = {
      feePayer: 'wallet456',
      timestamp: Date.now() / 1000,
      instructions: [
        { programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' }
      ],
      tokenTransfers: [
        {
          fromUserAccount: 'wallet456',
          toUserAccount: 'program1',
          mint: 'USDC',
          tokenAmount: '-100.0'
        },
        {
          fromUserAccount: 'program1',
          toUserAccount: 'wallet456',
          mint: 'SOL',
          tokenAmount: '0.5'
        }
      ]
    };
    
    const details = indexer.extractJupiterSwapDetails(txDetails, 'tx123');
    
    expect(details).toEqual({
      transaction_hash: 'tx123',
      wallet_address: 'wallet456',
      token_in: 'USDC',
      token_out: 'SOL',
      amount_in: '100',
      amount_out: '0.5',
      block_timestamp: expect.any(String),
      price_in_usd: '0',
      price_out_usd: '0',
      value_in_usd: '0',
      value_out_usd: '0'
    });
  });
  
  test('Should handle transactions without Jupiter instructions', () => {
    const txDetails = {
      feePayer: 'wallet456',
      instructions: [
        { programId: 'OtherProgram' }
      ]
    };
    
    const details = indexer.extractJupiterSwapDetails(txDetails, 'tx123');
    expect(details).toBeNull();
  });
}); 