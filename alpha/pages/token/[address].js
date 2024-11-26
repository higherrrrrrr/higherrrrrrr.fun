import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokenState } from '../../onchain';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { parseEther } from 'viem';
import { HigherrrrrrrABI } from '../../onchain/generated';

export default function TokenPage() {
  const router = useRouter();
  const { address } = router.query;
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const { write: buyToken, data: buyData } = useContractWrite({
    address: address,
    abi: HigherrrrrrrABI,
    functionName: 'buy'
  });

  const { isLoading: isBuyLoading } = useWaitForTransaction({
    hash: buyData?.hash,
    onSuccess: () => refreshTokenState()
  });

  async function refreshTokenState() {
    if (typeof address === 'string') {
      const state = await getTokenState(address);
      setTokenState(state);
    }
  }

  useEffect(() => {
    if (address) {
      setLoading(true);
      refreshTokenState()
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [address]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-green-500">Loading...</div>
      </div>
    );
  }

  if (!tokenState) {
    return <div className="text-red-500">Token not found</div>;
  }

  const handleBuy = () => {
    buyToken({
      value: parseEther(tokenState.currentPrice)
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg p-6">
      <h1 className="text-3xl font-bold text-green-500 mb-6">
        {tokenState.name} ({tokenState.symbol})
      </h1>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Current Price</span>
          <span className="text-green-500 font-mono">
            {tokenState.currentPrice} ETH
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Supply</span>
          <span className="text-white font-mono">
            {tokenState.totalSupply} / {tokenState.maxSupply}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status</span>
          <span className={tokenState.paused ? "text-red-500" : "text-green-500"}>
            {tokenState.paused ? "Paused" : "Active"}
          </span>
        </div>

        {tokenState.lastActionTimestamp > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Last Action</span>
            <span className="text-white">
              {formatDistanceToNow(tokenState.lastActionTimestamp * 1000)} ago
            </span>
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={tokenState.paused || isBuyLoading}
          className="w-full mt-6 px-4 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
        >
          {isBuyLoading ? "Buying..." : `Buy for ${tokenState.currentPrice} ETH`}
        </button>
      </div>
    </div>
  );
} 