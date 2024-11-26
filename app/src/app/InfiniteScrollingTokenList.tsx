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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokens = useMemo(() => pages.flat(), [pages]);

  useEffect(() => {
    let page = 1;

    async function handleScroll() {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500;

      if (scrolledToBottom && !isLoading) {
        try {
          setIsLoading(true);
          setError(null);

          const { tokens, pagination } = await getTokensPage(page + 1);

          if (tokens.length > 0) {
            setPages((pages) => {
              const newPages = [...pages];
              newPages[page] = tokens;
              return newPages;
            });
            page = pagination.current_page;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load more tokens');
          console.error('Failed to load more tokens:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-8 px-6">
        {tokens.map((token) => (
          <TokenCard key={token.address} token={token} />
        ))}
      </div>
      {isLoading && (
        <div className="text-center py-4">Loading more tokens...</div>
      )}
      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}
    </div>
  );
}
