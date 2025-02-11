'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { env } from '@/lib/env.mjs';
import { toast } from 'react-hot-toast';

type SolanaContextType = {
  connection: Connection;
  isReady: boolean;
  currentRpcIndex: number;
  switchRpc: () => void;
};

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
    const rpcUrl = env.NEXT_PUBLIC_HELIUS_RPC_URL;
    
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: rpcUrl.includes('helius') ? rpcUrl.replace('https', 'wss') : undefined,
    });
  });

  const switchRpc = () => {
    const nextIndex = (currentRpcIndex + 1) % (FALLBACK_RPCS.length + 1);
    setCurrentRpcIndex(nextIndex);
    
    const rpcUrl = nextIndex === -1 
      ? env.NEXT_PUBLIC_HELIUS_RPC_URL
      : FALLBACK_RPCS[nextIndex];
    
    setConnection(new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: rpcUrl.includes('helius') ? rpcUrl.replace('https', 'wss') : undefined,
    }));
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await connection.getLatestBlockhash();
        setIsReady(true);
      } catch (error) {
        console.error('RPC connection failed:', error);
        switchRpc();
      }
    };

    checkConnection();
  }, [connection]);

  return (
    <SolanaContext.Provider value={{ connection, isReady, currentRpcIndex, switchRpc }}>
      {children}
    </SolanaContext.Provider>
  );
}

export const useSolana = () => useContext(SolanaContext); 