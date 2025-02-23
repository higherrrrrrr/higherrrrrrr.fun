'use client';

import React from 'react';
import { useSpring, animated } from '@react-spring/web';

export default function LeaderboardRow({ entry, index, isCurrentUser, type }) {
  const [props, api] = useSpring(() => ({
    scale: 1,
    rotateX: 0,
    config: { tension: 300, friction: 20 }
  }));

  const handleMouseEnter = () => {
    api.start({
      scale: 1.02,
      rotateX: isCurrentUser ? 180 : 10
    });
  };

  const handleMouseLeave = () => {
    api.start({
      scale: 1,
      rotateX: 0
    });
  };

  return (
    <animated.div 
      style={{
        ...props,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        card-transition
        flex items-center justify-between p-3 rounded
        ${isCurrentUser ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'}
      `}
    >
      {/* Use existing leaderboard row content from: */}
      {/* services/app/components/retail/Leaderboard.js lines 133-166 */}
    </animated.div>
  );
} 