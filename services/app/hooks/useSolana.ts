import { useEffect, useState } from 'react';
import { connection } from '@/lib/solana';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { SplToken } from '@/lib/types/solana';

export function useSolanaBalance(address: string) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchBalance() {
      try {
        const bal = await connection.getBalance(new PublicKey(address));
        setBalance(bal / LAMPORTS_PER_SOL);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [address]);

  return { balance, loading, error };
} 