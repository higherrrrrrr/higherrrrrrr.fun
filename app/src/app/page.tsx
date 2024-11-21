import { getHighlightedToken, getTokensPage } from "@/api";

import { InfiniteScrollingTokenList } from "./InfiniteScrollingTokenList";
import { TokenCard } from "./TokenCard";
import { TypeAndDelete } from "@/components/TypeAndDelete";
export default async function Tokens() {
  const { tokens } = await getTokensPage();
  const highlightedToken = await getHighlightedToken();

  return (
    <div className="flex flex-col">
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 py-8 mb-8">
        <h2 className=" text-2xl px-6 mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          this one is going highe
          <TypeAndDelete words={["rrrrrrrrrrrrrr"]} />
        </h2>
        <div className="px-6">
          <div key={highlightedToken.address}>
            <TokenCard token={highlightedToken} />
          </div>
        </div>
      </div>

      <h2 className=" text-xl px-6 mb-4">all tokens</h2>
      <InfiniteScrollingTokenList tokens={tokens} />
    </div>
  );
}
