'use client';

import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useWallet } from '@solana/wallet-adapter-react';

const SWIPE_THRESHOLD = 50;

export default function SwipeCards({ items, onSwipe }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [props, api] = useSpring(() => ({ x: 0, y: 0, rotation: 0 }));
  
  const bind = useDrag(({ down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const willSwipe = Math.abs(mx) > SWIPE_THRESHOLD;
    
    api.start(() => {
      if (down) {
        // While dragging
        return {
          x: mx,
          rotation: mx / 10,
          immediate: true
        };
      }
      
      if (!down && willSwipe) {
        // Swipe completed
        const newIndex = currentIndex + (mx > 0 ? -1 : 1);
        if (newIndex >= 0 && newIndex < items.length) {
          setCurrentIndex(newIndex);
          onSwipe?.(items[currentIndex], mx > 0 ? 'right' : 'left');
        }
        return {
          x: 0,
          rotation: 0,
          immediate: false
        };
      }
      
      // Return to center
      return {
        x: 0,
        rotation: 0,
        immediate: false
      };
    });
  });

  if (!items?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No items to display
      </div>
    );
  }

  const item = items[currentIndex];
  
  return (
    <div className="relative w-full h-[400px] touch-none">
      <animated.div
        {...bind()}
        style={{
          transform: props.x.to((x) => `translateX(${x}px)`),
          rotate: props.rotation.to((r) => `${r}deg`),
          touchAction: 'none'
        }}
        className="absolute inset-0 bg-gray-800 rounded-xl p-6 shadow-xl"
      >
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-bold mb-4">{item.name}</h3>
          <div className="flex-1">
            {item.description}
          </div>
          <div className="text-sm text-gray-400 mt-4">
            Swipe to navigate • {currentIndex + 1} of {items.length}
          </div>
        </div>
      </animated.div>
    </div>
  );
} 