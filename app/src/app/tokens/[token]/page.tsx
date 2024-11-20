import { Button } from "@/components/Button";
import { listings } from "@/test-tokens";
import { ProgressBar } from "@/components/ProgressBar";

export default function Token() {
  const listing = listings[0];

  return (
    <div className="px-6  py-8 max-w-4xl mx-auto w-full">
      <div className="flex gap-x-6">
        <div
          className="aspect-square h-[300px] bg-cover bg-center"
          style={{
            backgroundImage: `url(https://picsum.photos/300/300?random=${listing.currentTicker})`,
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

          <div className="flex gap-x-6">
            <div className="flex flex-col">
              <div className="text-sm text-gray-400">price</div>
              <div className="text-2xl font-bold">${listing.price}</div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-400">mkt cap.</div>
              <div className="text-2xl font-bold">
                $
                {new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(listing.marketCap))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-sm text-gray-400">description</div>
            <div className="text-sm">{listing.description}</div>
          </div>
          <div className="mt-auto flex gap-x-2">
            <Button className="w-full">Buy Token</Button>
            <Button className="w-full">Sell Token</Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Listing Progress</h2>
        <ProgressBar progress={40} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Price Levels</h2>
        <div className="border border-green-600">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-600">
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Ticker</th>
                <th className="p-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {listing.priceLevels.map((level) => (
                <tr
                  key={level.ticker}
                  className="border-b border-green-600/30 last:border-b-0"
                >
                  <td className="p-3">${level.greaterThan}</td>
                  <td className="p-3 font-mono">${level.ticker}</td>
                  <td className="p-3">
                    {level.ticker === listing.currentTicker && (
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
            <div className="font-mono break-all">{listing.address}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Created At</div>
            <div>{new Date(listing.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
