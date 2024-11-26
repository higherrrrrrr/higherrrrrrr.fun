"use server";

import { cookies } from 'next/headers';
import { api } from '@/lib/api';

// Helper to get auth token from cookies on server side
async function getServerSideToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || 'albertishigher$123$';
}

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
    const token = await getServerSideToken();
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/tokens?page=${page}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
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
    const token = await getServerSideToken();
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/tokens/${address}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
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
    const token = await getServerSideToken();
    const response = await fetch(
      `${process.env.API_URL || 'http://localhost:5000'}/api/highlighted-token`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.json();
  } catch (error) {
    console.error('Failed to fetch highlighted token:', error);
    throw error;
  }
}
