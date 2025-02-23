'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const UserStats = dynamic(() => import('./UserStats'), { ssr: false });
const Achievements = dynamic(() => import('./Achievements'), { ssr: false });
const Leaderboard = dynamic(() => import('./Leaderboard'), { ssr: false });

export default function RetailPage() {
  const [userRank, setUserRank] = useState(null);

  return (
    <div className="container mx-auto p-4">
      <UserStats userRank={userRank} />
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