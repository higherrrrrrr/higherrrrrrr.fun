"use client";

import { ShrinkToFit } from "@/components/ShrinkToFit";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import Link from "next/link";
import { useState } from "react";

import { listings, ListingType } from "@/test-tokens";
import { SparkLine } from "@/components/SparkLine";
import { ProgressBar } from "@/components/ProgressBar";
import { Tooltip } from "@/components/Tooltip";

function formatCompactDistance(date1: Date, date2: Date) {
  const years = differenceInYears(date1, date2);
  if (years !== 0) return `${Math.abs(years)}y ago`;

  const months = differenceInMonths(date1, date2);
  if (months !== 0) return `${Math.abs(months)}mo ago`;

  const days = differenceInDays(date1, date2);
  return `${Math.abs(days)}d ago`;
}

export default function Tokens() {
  return (
    <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
      {listings.map((listing) => (
        <Listing key={listing.currentTicker} listing={listing} />
      ))}
    </div>
  );
}

function Listing({ listing }: { listing: ListingType }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={listing.currentTicker}
      // TODO THIS WILL BE A UNIQUE ID EVENTUALLY
      href={`/tokens/${listing.currentTicker}`}
      className="bg-black border border-green-600 flex  transition-transform hover:scale-[1.02]"
    >
      <div
        className="aspect-square h-[275px] bg-cover bg-center"
        style={{
          backgroundImage: `url(https://picsum.photos/300/300?random=${listing.currentTicker})`,
        }}
      ></div>

      <div className="pt-2 flex flex-col gap-y-2 flex-grow ">
        <div className=" px-3 flex flex-col">
          <Tooltip content="The ticker will change as we go higherrrrrrrrrr">
            <div className="flex justify-between items-center">
              {isHovered ? (
                <div className="flex font-bold overflow-visible flex-grow items-center">
                  <span className="text-green-500">$</span>
                  <TypeAndDelete
                    words={listing.priceLevels.map((level) => level.ticker)}
                    timeBetweenChars={50}
                  />
                </div>
              ) : (
                <div className="flex font-bold overflow-hidden flex-grow items-center">
                  <span className="text-green-500">$</span>
                  <ShrinkToFit>{listing.currentTicker}</ShrinkToFit>
                </div>
              )}

              <div className="text-xs flex-shrink-0" title={listing.createdAt}>
                {formatCompactDistance(new Date(), new Date(listing.createdAt))}
              </div>
            </div>
          </Tooltip>

          <span>
            <span>by </span>
            <ClickToCopy text={listing.address} />
          </span>
        </div>

        <div className="flex">
          <div className="px-3 flex flex-col">
            <Label>price</Label>
            <span className="font-bold">${listing.price}</span>
          </div>

          <div className="px-3 flex flex-col">
            <Label>mkt cap.</Label>
            <span className="font-bold">
              $
              {new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(Number(listing.marketCap))}
            </span>
          </div>
        </div>

        <div className="px-3 flex flex-col">
          <Label>description</Label>
          <span className="text-sm line-clamp-3">{listing.description}</span>
        </div>

        <div className="mt-auto">
          <SparkLine data={listing.tickerHistory} />
        </div>

        <Tooltip content="Once we reach 100% we will list the token on the exchange.">
          <ProgressBar progress={40} />
        </Tooltip>
      </div>
    </Link>
  );
}

function ClickToCopy({ text }: { text: string }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      className="text-green-600 text-sm cursor-pointer relative"
    >
      {text.slice(0, 6)}...{text.slice(-4)}
      {copySuccess && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-black px-2 py-1 rounded text-xs">
          Copied!
        </span>
      )}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-gray-400">{children}</span>;
}
