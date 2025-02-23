// No 'use client' directive here
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata() {
  return {
    title: 'Price Data',
    description: 'Real-time token price information'
  };
}

export default function PriceLayout({ children }) {
  return children;
} 