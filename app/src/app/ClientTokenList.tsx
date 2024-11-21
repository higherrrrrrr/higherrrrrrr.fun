"use client";

import { getTokensPage, TokenApiType } from "@/api";
import { TokenCard } from "./TokenCard";
import { useEffect, useMemo, useState } from "react";

export function ClientTokenList({
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

        setPages((pages) => [...pages, tokens]);
        page = pagination.current_page;
        isFetching = false;
        console.log("scrolled to bottom");
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
      {tokens.map((token) => (
        <TokenCard key={token.address} token={token} />
      ))}
    </div>
  );
}
