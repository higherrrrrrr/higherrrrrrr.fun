"use server";

import { cookies } from 'next/headers';
import { api } from '@/lib/api';
import { notFound } from "next/navigation";

// Helper to get auth token from cookies on server side
function getServerSideToken(): string {
  const cookieStore = cookies();
  return cookieStore.get('auth_token')?.value || 'albertishigher$123$';
}

export type NftApiType = {
  address: string;
  name: string;
  minted_at: string;
  image_url: string;
  url: string;
};

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
  try {
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/tokens?page=${page}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${getServerSideToken()}`
        }
      }
    );
    return response.json();
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    throw error;
  }
}

export async function getToken(address: string) {
  try {
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/tokens/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${getServerSideToken()}`
        }
      }
    );
    return response.json();
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
}

export async function getHighlightedToken() {
  try {
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/highlighted-token`,
      {
        headers: {
          'Authorization': `Bearer ${getServerSideToken()}`
        }
      }
    );
    return response.json();
  } catch (error) {
    console.error('Failed to fetch highlighted token:', error);
    throw error;
  }
}

export async function getNftsForAddress(address: string) {
  try {
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/nfts/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${getServerSideToken()}`
        }
      }
    );
    if (response.status === 404) {
      notFound();
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      notFound();
    }
    throw error;
  }
}
