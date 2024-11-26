"use client";

import { getToken } from "@/api";
import { Address } from "@/components/Address";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { Higherrrrrrr, PriceLevel } from "@/lib/contracts/higherrrrrrr";
import { getRpcUrl } from "@/lib/config";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

interface OnChainTokenData {
  price: bigint;
  totalSupply: bigint;
  priceLevels: PriceLevel[];
}

interface PageProps {
  params: {
    address: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

interface DisplayPriceLevel {
  name: string;
  greater_than: string;
}

export default function Token({ params }: any) {
  const [token, setToken] = useState<any>(null);
  const [onChainData, setOnChainData] = useState<OnChainTokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch API data
        const apiToken = await getToken(params.address);
        setToken(apiToken);

        // Fetch on-chain data
        const provider = new ethers.JsonRpcProvider(getRpcUrl());
        const contract = new Higherrrrrrr(params.address, provider);
        
        const [price, totalSupply, priceLevels] = await Promise.all([
          contract.getCurrentPrice(),
          contract.totalSupply(),
          contract.getPriceLevels()
        ]);

        setOnChainData({ price, totalSupply, priceLevels });
      } catch (error) {
        console.error('Failed to fetch token data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.address]);

  if (loading || !token) {
    return <div className="p-8">Loading...</div>;
  }

  // Calculate market cap using on-chain data if available
  const marketCap = onChainData 
    ? Number(onChainData.price * onChainData.totalSupply) / 1e18
    : token.market_cap;

  // Use on-chain price if available
  const price = onChainData 
    ? Number(onChainData.price) / 1e18
    : token.price;

  // Use on-chain price levels if available
  const priceLevels = onChainData?.priceLevels 
    ? onChainData.priceLevels.map((level: any) => ({
        name: level.name,
        greater_than: (Number(level.price) / 1e18).toString()
      }))
    : token.price_levels;

  // Find current level based on price
  const currentLevel = priceLevels.reduce((current: any, level: any) => {
    return Number(level.greater_than) <= price ? level : current;
  }, priceLevels[0]);

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
          <div className="mt-auto flex gap-x-2">
            <Button className="w-full">Buy Token</Button>
            <Button className="w-full">Sell Token</Button>
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
                    {level.name === currentLevel.name && (
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
