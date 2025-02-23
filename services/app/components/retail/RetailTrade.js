'use client';

import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { GlowBorder } from '../GlowBorder';

export function RetailTrade({ token }) {
  const { publicKey, toBase58 } = useWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleBuy() {
    if (!publicKey) {
      setMessage('Please connect wallet');
      return;
    }
    
    if (typeof window === 'undefined' || !window.Jupiter) {
      setMessage('Jupiter not available');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      window.Jupiter.init({
        endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
        displayMode: "modal",
        defaultExplorer: "Solana Explorer",
        strictTokenList: false,
        formProps: {
          initialInputMint: "So11111111111111111111111111111111111111112", // SOL
          fixedInputMint: false,
          initialOutputMint: token.mint || token.token_address,
          fixedOutputMint: false,
          swapMode: "ExactIn"
        }
      });

      if (typeof window !== 'undefined' && window.Jupiter) {
        try {
          const instance = window.Jupiter.init({
            endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
            displayMode: "modal",
            defaultExplorer: "Solana Explorer",
            strictTokenList: false,
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112", // SOL
              fixedInputMint: false,
              initialOutputMint: token.mint || token.token_address,
              fixedOutputMint: false,
              swapMode: "ExactIn"
            }
          });

          // Listen for swap completion
          instance.on('swapSuccess', async (result) => {
            try {
              await fetch('/api/achievements/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  wallet: toBase58(),
                  tokenMint: token.mint || token.token_address,
                  txSignature: result.signature
                })
              });
            } catch (err) {
              console.error('Failed to check achievements:', err);
            }
          });
        } catch (err) {
          console.error('Failed to open Jupiter Terminal:', err);
          setMessage('Failed to initialize swap');
        }
      }
    } catch (err) {
      console.error('Failed to open Jupiter Terminal:', err);
      setMessage('Failed to initialize swap');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlowBorder className="p-6 bg-black/20">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            Buy {token.symbol || token.name || 'Token'}
          </h3>
          <div className="text-sm text-green-500/70">
            Using Jupiter
          </div>
        </div>

        <button
          onClick={handleBuy}
          disabled={loading || !publicKey}
          className={`w-full py-3 px-6 rounded ${
            loading || !publicKey
              ? 'bg-green-500/20 text-green-500/50 cursor-not-allowed'
              : 'bg-green-500/30 text-green-400 hover:bg-green-500/40'
          }`}
        >
          {loading ? 'Initializing...' : 'Swap SOL for Token'}
        </button>

        {message && (
          <div className="text-sm text-red-400">
            {message}
          </div>
        )}
      </div>
    </GlowBorder>
  );
} 