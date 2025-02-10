'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export default function ProfilePage() {
  const { primaryWallet } = useDynamicContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!primaryWallet?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-green-500 mb-4">Connect Wallet</h1>
        <p className="text-green-500/70">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  return <UserProfile address={primaryWallet.address} />;
} 