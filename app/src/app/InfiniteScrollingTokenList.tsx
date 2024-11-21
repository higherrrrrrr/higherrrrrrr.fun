"use client";

import { getTokensPage, TokenApiType } from "@/api";
import { TokenCard } from "./TokenCard";
import { useEffect, useMemo, useState } from "react";

export function InfiniteScrollingTokenList({
  tokens: initialTokens,
}: {
  tokens: TokenApiType[];
}) {
  const [pages, setPages] = useState<TokenApiType[][]>([initialTokens]);

  const tokens = useMemo(() => pages.flat(), [pages]);

  useEffect(() => {
    let page = 1;
    let isFetching = false;

    async function handleScroll() {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500;

      if (scrolledToBottom && !isFetching) {
        isFetching = true;

        const { tokens, pagination } = await getTokensPage(page + 1);

        setPages((pages) => {
          const newPages = [...pages];
          newPages[page] = tokens;
          return newPages;
        });
        page = pagination.current_page;
        isFetching = false;
        console.log("scrolled to bottom");
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-8 px-6">
      {tokens.map((token) => (
        <TokenCard key={token.address} token={token} />
      ))}
    </div>
  );
}
