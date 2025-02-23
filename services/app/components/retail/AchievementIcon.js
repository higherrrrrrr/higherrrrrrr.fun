'use client';

import React, { useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

export default function AchievementIcon({ icon, isNew }) {
  const [props, api] = useSpring(() => ({
    scale: 1,
    rotate: 0
  }));

  useEffect(() => {
    if (isNew) {
      api.start({
        from: { scale: 0, rotate: -30 },
        to: [
          { scale: 1.2, rotate: 10 },
          { scale: 1, rotate: 0 }
        ],
        config: { tension: 300, friction: 10 }
      });
    }
  }, [isNew]);

  return (
    <animated.div 
      style={props}
      className="text-2xl icon-bounce"
    >
      {icon}
    </animated.div>
  );
} 