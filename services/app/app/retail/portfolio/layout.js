// No 'use client' directive here
import { headers } from 'next/headers';

export async function generateStaticParams() {
  // Move any generateStaticParams logic here
  return [];
}

export async function generateMetadata() {
  // Move any metadata generation here
  return {
    title: 'Portfolio',
    description: 'View your token portfolio'
  };
}

export default function PortfolioLayout({ children }) {
  return children;
} 