"use client";

import { Button } from "@/components/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { ShrinkToFit } from "@/components/ShrinkToFit";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

type Listing = {
  tickers: string[];
  currentTicker: string;
  address: string;
  price: string;
  createdAt: string;
};

const listings: Listing[] = [
  {
    tickers: [
      "8=D",
      "8==D",
      "8===D",
      "8====D",
      "8=====D",
      "8======D",
      "8========D",
      "8=========D~~",
      "8==========D~~~",
      "8===========D~~~~",
      "8============D~~~~~",
      "8=============D~~~~~~",
      "8==============D~~~~~~~",
    ],
    currentTicker: "8==============D~~~~~~~",
    address: "0x0000000000000000000000000000000000000000",
    price: "1000",
    createdAt: "2021-01-01",
  },

  {
    tickers: ["VITALEK", "VITALEKK", "VITALEKKK", "VITALEKKKK"],
    currentTicker: "VITALEK",
    address: "0x0000000000000000000000000000000000000000",
    price: "1000",
    createdAt: "2021-01-01",
  },
  {
    tickers: ["PEPE", "SADPEPE", "SADDERPEPE", "SADDESTPEPE"],
    currentTicker: "PEPE",
    address: "0x1234567890123456789012345678901234567890",
    price: "0.00001",
    createdAt: "2023-05-15",
  },
  {
    tickers: ["DOGE", "SILLYDOGE", "SILLIESTDOGE"],
    currentTicker: "DOGE",
    address: "0x2345678901234567890123456789012345678901",
    price: "0.07",
    createdAt: "2023-04-20",
  },
  {
    tickers: ["SHIB", "SHIBK", "SHIBKK", "SHIBKKK"],
    currentTicker: "SHIB",
    address: "0x3456789012345678901234567890123456789012",
    price: "0.00001",
    createdAt: "2023-03-15",
  },
  {
    tickers: ["APE", "APEK", "APEKK", "APEKKK"],
    currentTicker: "APE",
    address: "0x4567890123456789012345678901234567890123",
    price: "2.50",
    createdAt: "2023-06-01",
  },
  {
    tickers: ["BONK", "BONKK", "BONKKK", "BONKKKK"],
    currentTicker: "BONK",
    address: "0x5678901234567890123456789012345678901234",
    price: "0.00002",
    createdAt: "2023-05-30",
  },
  {
    tickers: ["WOJAK", "WOJAKK", "WOJAKKK", "WOJAKKKK"],
    currentTicker: "WOJAK",
    address: "0x6789012345678901234567890123456789012345",
    price: "0.05",
    createdAt: "2023-05-28",
  },
  {
    tickers: ["MOON", "MOONK", "MOONKK", "MOONKKK"],
    currentTicker: "MOON",
    address: "0x7890123456789012345678901234567890123456",
    price: "1.20",
    createdAt: "2023-05-25",
  },
  {
    tickers: ["ROCKET", "ROCKETK", "ROCKETKK", "ROCKETKKK"],
    currentTicker: "ROCKET",
    address: "0x8901234567890123456789012345678901234567",
    price: "0.75",
    createdAt: "2023-05-20",
  },
  {
    tickers: ["DIAMOND", "DIAMONDK", "DIAMONDKK", "DIAMONDKKK"],
    currentTicker: "DIAMOND",
    address: "0x9012345678901234567890123456789012345678",
    price: "10.00",
    createdAt: "2023-05-10",
  },
  {
    tickers: ["HANDS", "HANDSK", "HANDSKK", "HANDSKKK"],
    currentTicker: "HANDS",
    address: "0xa123456789012345678901234567890123456789",
    price: "0.50",
    createdAt: "2023-05-05",
  },
  {
    tickers: ["HODL", "HODLK", "HODLKK", "HODLKKK"],
    currentTicker: "HODL",
    address: "0xb234567890123456789012345678901234567890",
    price: "5.00",
    createdAt: "2023-04-30",
  },
  {
    tickers: ["FOMO", "FOMOK", "FOMOKK", "FOMOKKK"],
    currentTicker: "FOMO",
    address: "0xc345678901234567890123456789012345678901",
    price: "2.00",
    createdAt: "2023-04-25",
  },
  {
    tickers: ["WAGMI", "WAGMIK", "WAGMIKK", "WAGMIKKK"],
    currentTicker: "WAGMI",
    address: "0xd456789012345678901234567890123456789012",
    price: "3.33",
    createdAt: "2023-04-15",
  },
  {
    tickers: ["NGMI", "NGMIK", "NGMIKK", "NGMIKKK"],
    currentTicker: "NGMI",
    address: "0xe567890123456789012345678901234567890123",
    price: "0.01",
    createdAt: "2023-04-10",
  },
  {
    tickers: ["GG", "GGK", "GGKK", "GGKKK"],
    currentTicker: "GG",
    address: "0xf678901234567890123456789012345678901234",
    price: "1.50",
    createdAt: "2023-04-05",
  },
];

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
    <div className="px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8">
      {listings.map((listing) => (
        <Listing key={listing.currentTicker} listing={listing} />
      ))}
    </div>
  );
}

function Listing({ listing }: { listing: Listing }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={listing.currentTicker}
      // TODO THIS WILL BE A UNIQUE ID EVENTUALLY
      href={`/tokens/${listing.currentTicker}`}
      className="bg-black border border-green-600 flex overflow-hidden"
    >
      <div
        className="aspect-square h-[175px] bg-cover bg-center"
        style={{
          backgroundImage: `url(https://picsum.photos/300/300?random=${listing.currentTicker})`,
        }}
      ></div>

      <div className="pt-2 flex flex-col gap-y-2 flex-grow overflow-hidden">
        <div className=" px-3 flex flex-col">
          <div className="flex justify-between items-center">
            <div className="flex font-bold overflow-visible flex-grow items-center">
              <span className="text-green-500">$</span>
              {isHovered ? (
                <TypeAndDelete words={listing.tickers} timeBetweenChars={50} />
              ) : (
                listing.currentTicker
              )}
            </div>

            <div className="text-xs flex-shrink-0" title={listing.createdAt}>
              {formatCompactDistance(new Date(), new Date(listing.createdAt))}
            </div>
          </div>
          <span>
            <span>by </span>
            <ClickToCopy text={listing.address} />
          </span>
        </div>

        <div className="px-3 flex flex-col">
          <span className="text-xs">price</span>
          <span className="font-bold">${listing.price}</span>
        </div>

        <div className="mt-auto h-4 w-full bg-green-950">
          <div
            className="h-full bg-green-400 animate-pulse"
            style={{ width: "40%" }} // this is supposed to be how close we are to a real listing
          />
        </div>
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
