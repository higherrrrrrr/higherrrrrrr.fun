import { Button } from "@/components/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import Link from "next/link";

// This would typically come from an API or database
// Using the same data structure as the main page for now
const token = {
  ticker: "VITALEK",
  address: "0x0000000000000000000000000000000000000000",
  price: "1000",
  createdAt: "2021-01-01",
};
export default function Token({ params }: { params: { token: string } }) {
  return (
    <div className="px-6 max-w-4xl mx-auto w-full">
      <div className="border border-green-600 bg-black p-6">
        <div className="flex gap-x-6">
          <div
            className="aspect-square h-[300px] bg-cover bg-center"
            style={{
              backgroundImage: `url(https://picsum.photos/300/300?random=${token.ticker})`,
            }}
          />

          <div className="flex flex-col flex-grow gap-y-6">
            <div>
              <h1 className="text-3xl font-bold">${token.ticker}</h1>
              <div className="text-green-600">
                Created by {token.address.slice(0, 6)}...
                {token.address.slice(-4)}
              </div>
            </div>

            <div>
              <div className="text-sm">Current Price</div>
              <div className="text-2xl font-bold">${token.price}</div>
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
          <h2 className="text-xl font-bold mb-4">Token Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Contract Address</div>
              <div className="font-mono break-all">{token.address}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Created At</div>
              <div>{new Date(token.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
