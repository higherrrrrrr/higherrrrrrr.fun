"use server";

export type PriceLevel = {
  name: string;
  greater_than: string;
};

export type TokenApiType = {
  address: string;
  symbol: string;
  name: string;
  description: string;
  price_levels: PriceLevel[];
  price: number;
  volume_24h: number;
  market_cap: number;
  launch_date: string;
  ticker_data: number[];
  image_url: string;
  progress: number;
};

type Pagination = {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
};

export async function getTokensPage(page: number = 1) {
  const params = new URLSearchParams();
  params.set("page", page.toString());

  const response = await fetch(`http://localhost:8080/api/tokens?${params}`, {
    headers: {
      Authorization: "Bearer albertishigher$123$",
    },
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(text);
  }

  return (await response.json()) as {
    tokens: TokenApiType[];
    pagination: Pagination;
  };
}

export async function getToken(address: string) {
  const response = await fetch(`http://localhost:8080/api/tokens/${address}`, {
    headers: {
      Authorization: "Bearer albertishigher$123$",
    },
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(text);
  }

  return (await response.json()) as TokenApiType;
}

export async function getHighlightedToken() {
  const response = await fetch(`http://localhost:8080/api/highlighted-token`, {
    headers: {
      Authorization: "Bearer albertishigher$123$",
    },
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(text);
  }

  return (await response.json()) as TokenApiType;
}
