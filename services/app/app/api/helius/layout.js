// No 'use client' directive here
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata() {
  return {
    title: 'Helius Data',
    description: 'Solana asset information'
  };
}

export default function HeliusLayout({ children }) {
  return children;
} 