import { Button } from "@/components/Button";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import dynamic from "next/dynamic";
import Link from "next/link";

type Listing = {
  ticker: string;
  address: string;
  price: string;
  createdAt: string;
};

const listings: Listing[] = [
  {
    ticker: "VITALEK",
    address: "0x0000000000000000000000000000000000000000",
    price: "1000",
    createdAt: "2021-01-01",
  },
  {
    ticker: "PEPE",
    address: "0x1234567890123456789012345678901234567890",
    price: "0.00001",
    createdAt: "2023-05-15",
  },
  {
    ticker: "DOGE",
    address: "0x2345678901234567890123456789012345678901",
    price: "0.07",
    createdAt: "2023-04-20",
  },
  {
    ticker: "SHIB",
    address: "0x3456789012345678901234567890123456789012",
    price: "0.00001",
    createdAt: "2023-03-15",
  },
  {
    ticker: "APE",
    address: "0x4567890123456789012345678901234567890123",
    price: "2.50",
    createdAt: "2023-06-01",
  },
  {
    ticker: "BONK",
    address: "0x5678901234567890123456789012345678901234",
    price: "0.00002",
    createdAt: "2023-05-30",
  },
  {
    ticker: "WOJAK",
    address: "0x6789012345678901234567890123456789012345",
    price: "0.05",
    createdAt: "2023-05-28",
  },
  {
    ticker: "MOON",
    address: "0x7890123456789012345678901234567890123456",
    price: "1.20",
    createdAt: "2023-05-25",
  },
  {
    ticker: "ROCKET",
    address: "0x8901234567890123456789012345678901234567",
    price: "0.75",
    createdAt: "2023-05-20",
  },
  {
    ticker: "DIAMOND",
    address: "0x9012345678901234567890123456789012345678",
    price: "10.00",
    createdAt: "2023-05-10",
  },
  {
    ticker: "HANDS",
    address: "0xa123456789012345678901234567890123456789",
    price: "0.50",
    createdAt: "2023-05-05",
  },
  {
    ticker: "HODL",
    address: "0xb234567890123456789012345678901234567890",
    price: "5.00",
    createdAt: "2023-04-30",
  },
  {
    ticker: "FOMO",
    address: "0xc345678901234567890123456789012345678901",
    price: "2.00",
    createdAt: "2023-04-25",
  },
  {
    ticker: "WAGMI",
    address: "0xd456789012345678901234567890123456789012",
    price: "3.33",
    createdAt: "2023-04-15",
  },
  {
    ticker: "NGMI",
    address: "0xe567890123456789012345678901234567890123",
    price: "0.01",
    createdAt: "2023-04-10",
  },
  {
    ticker: "GG",
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

const ConnectWalletButton = dynamic(
  () =>
    import("@/components/ConnectWalletButton").then(
      (mod) => mod.ConnectWalletButton
    ),
  { ssr: false }
);

export default function Tokens() {
  return (
    <div className="bg-black min-h-screen w-full text-white font-mono flex flex-col">
      <div className="flex justify-between p-6 items-center">
        <div className="text-xl font-bold">
          highe
          <span className="text-green-600">
            <TypeAndDelete words={["rrrrrrrrrrrrrrr"]} />
          </span>
        </div>

        <div className="flex gap-x-4">
          <Link href="/new-token">
            <Button>+ New Coin</Button>
          </Link>

          <ConnectWalletButton />
        </div>
      </div>

      <div className="px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8">
        {listings.map((listing) => (
          <Link
            key={listing.ticker}
            href={`/tokens/${listing.ticker}`}
            className="bg-black border border-green-600 flex"
          >
            <div
              className="aspect-square h-[175px] bg-cover bg-center"
              style={{
                backgroundImage: `url(https://picsum.photos/300/300?random=${listing.ticker})`,
              }}
            ></div>

            <div className="pt-2 flex flex-col gap-y-2 flex-grow">
              <div className=" px-3 flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="font-bold">${listing.ticker}</div>

                  <div className="text-xs" title={listing.createdAt}>
                    {formatCompactDistance(
                      new Date(),
                      new Date(listing.createdAt)
                    )}
                  </div>
                </div>
                <span>
                  <span>by </span>
                  <span className="text-green-600 text-sm">
                    {listing.address.slice(0, 6)}...
                    {listing.address.slice(-4)}
                  </span>
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
        ))}
      </div>
    </div>
  );
}
