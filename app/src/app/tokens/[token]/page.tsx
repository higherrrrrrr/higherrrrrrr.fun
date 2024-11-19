import { Button } from "@/components/Button";
import { listings } from "@/test-tokens";

export default function Token({}: { params: { token: string } }) {
  const listing = listings[0];

  return (
    <div className="px-6 pb-8 max-w-4xl mx-auto w-full">
      <div className="border border-green-600 bg-black p-6">
        <div className="flex gap-x-6">
          <div
            className="aspect-square h-[300px] bg-cover bg-center"
            style={{
              backgroundImage: `url(https://picsum.photos/300/300?random=${listing.ticker})`,
            }}
          />

          <div className="flex flex-col flex-grow gap-y-6">
            <div>
              <h1 className="text-3xl font-bold">${listing.currentTicker}</h1>
              <div className="text-green-600">
                Created by {listing.address.slice(0, 6)}...
                {listing.address.slice(-4)}
              </div>
            </div>

            <div>
              <div className="text-sm">Current Price</div>
              <div className="text-2xl font-bold">${listing.price}</div>
            </div>

            <div className="mt-auto flex gap-x-2">
              <Button className="w-full">Buy Token</Button>
              <Button className="w-full">Sell Token</Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Listing Progress</h2>
          <div className="h-6 w-full bg-green-950">
            <div
              className="h-full bg-green-400 animate-pulse"
              style={{ width: "40%" }}
            />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            40% progress to official listing
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Price Levels</h2>
          <div className="grid gap-y-4">
            {listing.tickers.map((ticker, i) => (
              <div key={ticker} className="flex items-center gap-x-4">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div className="font-mono text-lg">${ticker}</div>
                {ticker === listing.currentTicker && (
                  <div className="text-green-500 text-sm">Current Level</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Token Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Contract Address</div>
              <div className="font-mono break-all">{listing.address}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Created At</div>
              <div>{new Date(listing.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
