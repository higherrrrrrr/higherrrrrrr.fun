"use client";

import { TokenApiType } from "@/api";
import { Address } from "@/components/Address";
import { ProgressBar } from "@/components/ProgressBar";
import { ShrinkToFit } from "@/components/ShrinkToFit";
import { SparkLine } from "@/components/SparkLine";
import { Tooltip } from "@/components/Tooltip";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import { Higherrrrrrr } from "@/lib/contracts/higherrrrrrr";
import { getRpcUrl } from "@/lib/config";
import { ethers } from "ethers";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
} from "date-fns";
import Link from "next/link";
import { useState, useEffect } from "react";

function formatCompactDistance(date1: Date, date2: Date) {
  const years = differenceInYears(date1, date2);
  if (years !== 0) return `${Math.abs(years)}y ago`;

  const months = differenceInMonths(date1, date2);
  if (months !== 0) return `${Math.abs(months)}mo ago`;

  const days = differenceInDays(date1, date2);
  return `${Math.abs(days)}d ago`;
}

interface OnChainTokenData {
  price: bigint;
  totalSupply: bigint;
}

export function TokenCard({ token }: { token: TokenApiType }) {
  const [isHovered, setIsHovered] = useState(false);
  const [onChainData, setOnChainData] = useState<OnChainTokenData | null>(null);

  useEffect(() => {
    async function fetchOnChainData() {
      try {
        const provider = new ethers.JsonRpcProvider(getRpcUrl());
        const contract = new Higherrrrrrr(token.address, provider);
        
        const [price, totalSupply] = await Promise.all([
          contract.getCurrentPrice(),
          contract.totalSupply()
        ]);

        setOnChainData({ price, totalSupply });
      } catch (error) {
        console.error('Failed to fetch on-chain data:', error);
      }
    }

    fetchOnChainData();
  }, [token.address]);

  // Calculate market cap using on-chain data if available
  const marketCap = onChainData 
    ? Number(onChainData.price * onChainData.totalSupply) / 1e18 // Adjust for decimals
    : token.market_cap;

  // Use on-chain price if available
  const price = onChainData 
    ? Number(onChainData.price) / 1e18 // Adjust for decimals
    : token.price;

  return (
    <Link
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={token.address}
      href={`/tokens/${token.address}`}
      className="bg-black border border-green-600 flex flex-col sm:flex-row transition-transform hover:scale-[1.02]"
    >
      <div
        className="aspect-square h-[275px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${token.image_url})`,
        }}
      ></div>

      <div className="pt-2 flex flex-col gap-y-2 flex-grow">
        <div className="px-3 flex flex-col">
          <Tooltip content="The name will change as we go higherrrrrrrrrr">
            <div className="flex justify-between items-center">
              {isHovered ? (
                <div className="flex font-bold overflow-visible flex-grow items-center">
                  <TypeAndDelete
                    words={token.price_levels.map((level) => level.name)}
                    timeBetweenChars={50}
                  />
                </div>
              ) : (
                <div className="flex font-bold overflow-hidden flex-grow items-center">
                  <ShrinkToFit>{token.name}</ShrinkToFit>
                </div>
              )}

              <div className="text-sm font-bold flex-shrink-0 text-green-500">
                ${token.symbol}
              </div>
            </div>
          </Tooltip>

          <div>
            <span>
              <span>by </span>
              <Address address={token.address} />
            </span>
          </div>
        </div>

        <div className="flex">
          <div className="px-3 flex flex-col">
            <Label>price</Label>
            <span className="font-bold">${price.toFixed(4)}</span>
          </div>

          <div className="px-3 flex flex-col">
            <Label>mkt cap.</Label>
            <span className="font-bold">
              $
              {new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(marketCap)}
            </span>
          </div>
        </div>

        <div className="px-3 flex flex-col">
          <Label>description</Label>
          <span className="text-sm line-clamp-3">{token.description}</span>
        </div>

        <div className="flex flex-col px-3">
          <Label>when</Label>
          <span className="text-sm line-clamp-3">
            {formatCompactDistance(new Date(), new Date(token.launch_date))}
          </span>
        </div>

        <div className="mt-auto">
          <SparkLine data={token.ticker_data} />
        </div>

        <Tooltip content="Once we reach 100% we will list the token on the exchange.">
          <ProgressBar progress={token.progress} />
        </Tooltip>
      </div>
    </Link>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-gray-400">{children}</span>;
}
