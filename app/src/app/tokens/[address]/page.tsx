import { getToken } from "@/api";
import { Address } from "@/components/Address";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";

export default async function Token({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const token = await getToken((await params).address);

  return (
    <div className="px-6  py-8 max-w-4xl mx-auto w-full">
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
              by <Address text={token.address} />
            </span>
          </div>

          <div className="flex gap-x-6">
            <div className="flex flex-col">
              <div className="text-sm text-gray-400">price</div>
              <div className="text-2xl font-bold">${token.price}</div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-400">mkt cap.</div>
              <div className="text-2xl font-bold">
                $
                {new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(Number(token.market_cap))}
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
              {token.price_levels.map((level) => (
                <tr
                  key={level.name}
                  className="border-b border-green-600/30 last:border-b-0"
                >
                  <td className="p-3">${level.greater_than}</td>
                  <td className="p-3 ">{level.name}</td>
                  <td className="p-3">
                    {level.name === token.name && (
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
            <div className=" break-all">{token.address}</div>
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
