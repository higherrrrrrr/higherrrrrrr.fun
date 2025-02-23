'use client';

import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import dynamic from 'next/dynamic';

const UserStats = dynamic(() => import('../retail/UserStats'), { ssr: false });
const Achievements = dynamic(() => import('../retail/Achievements'), { ssr: false });
const Leaderboard = dynamic(() => import('../retail/Leaderboard'), { ssr: false });

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const [userRank, setUserRank] = useState(null);
  const [userStats, setUserStats] = useState(null);

  return (
    <div className="container mx-auto p-4">
      <UserStats userRank={userRank} stats={userStats} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Achievements />
        </div>
        <div>
          <Leaderboard onUserRankChange={setUserRank} />
        </div>
      </div>
    </div>
  );
} 