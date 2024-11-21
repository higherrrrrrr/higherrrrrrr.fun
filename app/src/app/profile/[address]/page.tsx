import { getNftsForAddress, NftApiType } from "@/api";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const nfts = await getNftsForAddress(address);

  return (
    <div>
      <h1 className=" text-2xl px-6 mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
        {address}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
        {nfts.map((nft) => (
          <NftCard key={nft.address} nft={nft} />
        ))}
      </div>
    </div>
  );
}

function NftCard({ nft }: { nft: NftApiType }) {
  return (
    <Link
      href={nft.url ?? "#"}
      className="border border-green-600 transition-all hover:scale-[1.02]"
      target="_blank"
    >
      <div className="aspect-square w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={nft.image_url} alt={nft.name} className="w-full" />
      </div>
      <div className="p-4 flex flex-col gap-y-2">
        <div className="text-lg font-bold">{nft.name}</div>

        <div className="flex flex-col">
          <div className="text-sm text-gray-500">Minted at</div>
          <div className="text-sm ">{nft.minted_at}</div>
        </div>
      </div>
    </Link>
  );
}
