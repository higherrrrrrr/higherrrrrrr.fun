'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { env } from '@/lib/env';
import { toast } from 'react-hot-toast';

interface SolanaContextType {
  connection: Connection;
  network: string;
  isReady: boolean;
}

const SolanaContext = createContext<SolanaContextType>({} as SolanaContextType);

// List of fallback RPCs in order of preference
const FALLBACK_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  clusterApiUrl('mainnet-beta')
];

// Default Helius RPC URL format
const DEFAULT_HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${env.NEXT_PUBLIC_HELIUS_API_KEY}`;

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [currentRpcIndex, setCurrentRpcIndex] = useState(-1); // -1 means using Helius
  
  const [connection, setConnection] = useState(() => {
    // Use default Helius RPC if env variable is not set
    const rpcUrl = env.NEXT_PUBLIC_HELIUS_RPC_URL || DEFAULT_HELIUS_RPC;
    
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      // Only set wsEndpoint if using Helius
      wsEndpoint: rpcUrl.includes('helius') ? rpcUrl.replace('https', 'wss') : undefined,
    });
  });

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function checkConnection() {
      try {
        await connection.getLatestBlockhash();
        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to connect to Solana:', error);
        
        // Try next RPC in the list
        const nextIndex = currentRpcIndex + 1;
        if (nextIndex < FALLBACK_RPCS.length) {
          console.log(`Switching to fallback RPC ${nextIndex + 1}...`);
          const newConnection = new Connection(FALLBACK_RPCS[nextIndex], {
            commitment: 'confirmed',
          });
          if (mounted) {
            setConnection(newConnection);
            setCurrentRpcIndex(nextIndex);
          }
        } else {
          // If we've tried all RPCs, wait and retry from Helius
          console.log('All fallbacks failed, retrying with Helius...');
          if (mounted) {
            setCurrentRpcIndex(-1);
            retryTimeout = setTimeout(() => {
              const heliusUrl = env.NEXT_PUBLIC_HELIUS_RPC_URL || DEFAULT_HELIUS_RPC;
              const heliusConnection = new Connection(heliusUrl, {
                commitment: 'confirmed',
                wsEndpoint: heliusUrl.replace('https', 'wss'),
              });
              if (mounted) {
                setConnection(heliusConnection);
              }
            }, 5000);
          }
        }
      }
    }

    checkConnection();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [connection, currentRpcIndex]);

  return (
    <SolanaContext.Provider value={{ 
      connection, 
      network: env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
      isReady 
    }}>
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana() {
  return useContext(SolanaContext);
} 