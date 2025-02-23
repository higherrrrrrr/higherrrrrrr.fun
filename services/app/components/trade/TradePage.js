'use client';

import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import dynamic from 'next/dynamic';

const UserStats = dynamic(() => import('../retail/UserStats'), { ssr: false });
const Leaderboard = dynamic(() => import('../retail/Leaderboard'), { ssr: false });

export default function TradePage() {
  const { publicKey } = useWallet();
  const [userRank, setUserRank] = useState(null);
  const [userStats, setUserStats] = useState(null);

  return (
    <div className="container mx-auto p-4">
      {/* Trading interface would go here */}
      <div className="mt-8">
        <UserStats userRank={userRank} stats={userStats} />
        <Leaderboard onUserRankChange={setUserRank} />
      </div>
    </div>
  );
} 