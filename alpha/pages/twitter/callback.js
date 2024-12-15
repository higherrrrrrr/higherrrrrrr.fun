import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useSignMessage } from 'wagmi';
import Cookies from 'js-cookie';
import { getApiUrl } from '@/api';

export default function TwitterCallback() {
  const router = useRouter();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completeTwitterAuth = async () => {
      if (!router.isReady || !address) return;

      // Log all query parameters to see what we're getting
      console.log('Query parameters:', router.query);

      // Get parameters from Twitter callback
      const { oauth_token, oauth_verifier } = router.query;
      const token_address = router.query.state;
      
      if (!oauth_token || !oauth_verifier || !token_address) {
        setError('Missing required OAuth parameters');
        setLoading(false);
        return;
      }

      try {
        // Sign message to authenticate
        const message = `we're going higherrrrrrr`;
        const signature = await signMessageAsync({ message });

        // Complete the Twitter connection
        const response = await fetch(`${getApiUrl()}/twitter/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${address}:${signature}`
          },
          body: JSON.stringify({
            verifier: oauth_verifier,  // Changed back to match backend expectation
            token_address,
            oauth_token
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to complete Twitter connection');
        }

        // Redirect back to token edit page
        router.push(`/token/${token_address}/edit`);
      } catch (error) {
        console.error('Failed to complete Twitter connection:', error);
        setError(error.message || 'Failed to complete Twitter connection');
        setLoading(false);
      }
    };

    completeTwitterAuth();
  }, [router.isReady, address, router.query, signMessageAsync]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-xl">Completing Twitter Connection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="text-xl text-red-500">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return null;
} 