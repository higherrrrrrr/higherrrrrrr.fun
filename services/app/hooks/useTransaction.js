import { useState } from 'react';
import { ethers } from 'ethers';

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeTransaction = async (transactionFn, options = {}) => {
    const { onSuccess, onError } = options;
    
    try {
      setIsLoading(true);
      setError(null);

      const tx = await transactionFn();
      const receipt = await tx.wait();

      onSuccess?.(receipt);
      return receipt;
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message);
      onError?.(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeTransaction,
    isLoading,
    error,
    setError
  };
} 