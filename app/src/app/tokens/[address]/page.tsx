"use client";

import { getToken } from "@/api";
import { Address } from "@/components/Address";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { Higherrrrrrr, PriceLevel, MarketType } from "@/lib/contracts/higherrrrrrr";
import { getRpcUrl } from "@/lib/config";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { use } from "react";
import { useAccount, useWalletClient } from "wagmi";

interface OnChainTokenData {
  price: bigint;
  totalSupply: bigint;
  priceLevels: PriceLevel[];
}

interface DisplayPriceLevel {
  name: string;
  greater_than: string;
}

interface TransactionStatus {
  loading: boolean;
  error: string | null;
}

// Use any for Props to bypass TypeScript errors
export default function TokenPage({ params }: any) {
  // Use any for params to bypass TypeScript errors
  const address = (params as any).address;
  const [token, setToken] = useState<any>(null);
  const [onChainData, setOnChainData] = useState<OnChainTokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    loading: false,
    error: null
  });

  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    async function fetchData() {
      try {
        // Validate address
        if (!ethers.isAddress(address)) {
          throw new Error('Invalid address format');
        }

        // Fetch API data first
        const apiToken = await getToken(address);
        setToken(apiToken);

        // Then try to fetch on-chain data
        const provider = new ethers.JsonRpcProvider(getRpcUrl());
        
        // Check if there's contract code at the address
        const code = await provider.getCode(address);
        if (code === '0x') {
          throw new Error('No contract found at this address');
        }

        try {
          const contract = new Higherrrrrrr(address, provider);
          const [price, totalSupply, priceLevels] = await Promise.all([
            contract.getCurrentPrice().catch(() => BigInt(0)),
            contract.totalSupply().catch(() => BigInt(0)),
            contract.getPriceLevels().catch(() => [])
          ]);

          setOnChainData({ price, totalSupply, priceLevels });
        } catch (contractError) {
          console.error('Contract call error:', contractError);
          // Still show the page with API data, but log the error
          setError('Could not fetch on-chain data. Showing cached data.');
        }
      } catch (error) {
        console.error('Failed to fetch token data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load token data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address]);

  async function handleBuy() {
    if (!walletClient || !userAddress) {
      setTxStatus({ loading: false, error: "Please connect your wallet" });
      return;
    }

    setTxStatus({ loading: true, error: null });

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new Higherrrrrrr(address, signer);

      // Get quote for 0.1 ETH
      const ethAmount = ethers.parseEther("0.1");
      const minTokens = await contract.getEthBuyQuote(ethAmount);

      // Execute buy transaction
      setTxStatus({ loading: true, error: null });
      const tx = await contract.buy(
        userAddress,
        userAddress,
        "",
        MarketType.BONDING_CURVE,
        minTokens,
        0n,
        ethAmount
      );
      
      // Refresh data
      const [price, totalSupply, priceLevels] = await Promise.all([
        contract.getCurrentPrice(),
        contract.totalSupply(),
        contract.getPriceLevels()
      ]);

      setOnChainData({ price, totalSupply, priceLevels });
      setTxStatus({ loading: false, error: null });

    } catch (err) {
      console.error('Buy failed:', err);
      setTxStatus({
        loading: false,
        error: err instanceof Error ? err.message : "Transaction failed"
      });
    }
  }

  async function handleSell() {
    if (!walletClient || !userAddress) {
      setTxStatus({ loading: false, error: "Please connect your wallet" });
      return;
    }

    setTxStatus({ loading: true, error: null });

    try {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const contract = new Higherrrrrrr(address, signer);

      // Get user's balance
      const balance = await contract.balanceOf(userAddress);
      if (balance === 0n) {
        throw new Error("No tokens to sell");
      }

      // Sell 10% of balance
      const sellAmount = balance / 10n;
      const minEth = await contract.getTokenSellQuote(sellAmount);

      // Execute sell transaction
      setTxStatus({ loading: true, error: null });
      const tx = await contract.sell(
        sellAmount,
        userAddress,
        "",
        MarketType.BONDING_CURVE,
        minEth,
        0n
      );
      
      // Refresh data
      const [price, totalSupply, priceLevels] = await Promise.all([
        contract.getCurrentPrice(),
        contract.totalSupply(),
        contract.getPriceLevels()
      ]);

      setOnChainData({ price, totalSupply, priceLevels });
      setTxStatus({ loading: false, error: null });

    } catch (err) {
      console.error('Sell failed:', err);
      setTxStatus({
        loading: false,
        error: err instanceof Error ? err.message : "Transaction failed"
      });
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error && !token) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  // Use API data if no on-chain data is available
  const marketCap = onChainData 
    ? Number(onChainData.price * onChainData.totalSupply) / 1e18
    : token.market_cap;

  const price = onChainData 
    ? Number(onChainData.price) / 1e18
    : token.price;

  const priceLevels = onChainData?.priceLevels 
    ? onChainData.priceLevels.map((level: any) => ({
        name: level.name,
        greater_than: (Number(level.price) / 1e18).toString()
      }))
    : (token?.price_levels || []);

  // Find current level based on price, with null check
  const currentLevel = priceLevels?.length > 0 
    ? priceLevels.reduce((current: any, level: any) => {
        return Number(level.greater_than) <= price ? level : current;
      }, priceLevels[0])
    : null;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      <div className="flex gap-x-6">
        <div
          className="aspect-square h-[300px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${token.image_url})`,
          }}
        />

        <div className="flex flex-col flex-grow gap-y-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">{token.name}</h1>
            <span className="flex items-baseline gap-1">
              by <Address address={token.address} />
            </span>
          </div>

          <div className="flex gap-x-6">
            <div className="flex flex-col">
              <div className="text-sm text-gray-400">price</div>
              <div className="text-2xl font-bold">${price.toFixed(4)}</div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-400">mkt cap.</div>
              <div className="text-2xl font-bold">
                $
                {new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(marketCap)}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-sm text-gray-400">description</div>
            <div className="text-sm">{token.description}</div>
          </div>
          <div className="mt-auto flex flex-col gap-4">
            <div className="flex gap-x-2">
              <Button 
                className="w-full" 
                onClick={handleBuy}
                disabled={txStatus.loading}
              >
                {txStatus.loading ? "Processing..." : "Buy Token"}
              </Button>
              <Button 
                className="w-full"
                onClick={handleSell}
                disabled={txStatus.loading}
              >
                {txStatus.loading ? "Processing..." : "Sell Token"}
              </Button>
            </div>
            {txStatus.error && (
              <div className="text-red-500 text-sm text-center">
                {txStatus.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Listing Progress</h2>
        <ProgressBar progress={token.progress} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Price Levels</h2>
        <div className="border border-green-600">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-600">
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {priceLevels.map((level: DisplayPriceLevel) => (
                <tr
                  key={level.name}
                  className="border-b border-green-600/30 last:border-b-0"
                >
                  <td className="p-3">${level.greater_than}</td>
                  <td className="p-3">{level.name}</td>
                  <td className="p-3">
                    {level.name === currentLevel?.name && (
                      <div className="text-green-500 text-sm">
                        Current Level
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Token Details</h2>
        <div className="grid grid-cols-[auto_auto] gap-4">
          <div>
            <div className="text-sm text-gray-400">Contract Address</div>
            <div className="break-all">{token.address}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Created At</div>
            <div>{new Date(token.launch_date).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
