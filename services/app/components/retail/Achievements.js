'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '../../hooks/useWallet';
import SwipeCards from './SwipeCards';
import confetti from 'canvas-confetti';
import { useSpring, animated } from '@react-spring/web';

const GlowBorder = dynamic(() => import('../GlowBorder'), { ssr: false });

const ACHIEVEMENT_ICONS = {
  EARLY_BUYER: '🌟',
  PIONEER: '🚀',
  HIGH_LIQUIDITY_TRADER: '💧',
  ACTIVE_TRADER: '🔥',
  WHALE: '🐋',
  VOLATILITY_MASTER: '📊',
  DIAMOND_HANDS: '💎',
  FREQUENT_TRADER: '⚡',
  BIG_SPENDER: '💰'
};

const ACHIEVEMENT_LABELS = {
  EARLY_BUYER: 'Early Buyer',
  PIONEER: 'Pioneer',
  HIGH_LIQUIDITY_TRADER: 'Liquidity Master',
  ACTIVE_TRADER: 'Active Trader',
  WHALE: 'Whale',
  VOLATILITY_MASTER: 'Volatility Master'
};

const ACHIEVEMENT_COLORS = {
  EARLY_BUYER: 'from-green-500/20 to-blue-500/20',
  PIONEER: 'from-purple-500/20 to-pink-500/20',
  HIGH_LIQUIDITY_TRADER: 'from-blue-500/20 to-cyan-500/20',
  ACTIVE_TRADER: 'from-orange-500/20 to-red-500/20',
  WHALE: 'from-indigo-500/20 to-purple-500/20',
  VOLATILITY_MASTER: 'from-yellow-500/20 to-orange-500/20'
};

function AchievementProgress({ progress, type }) {
  const getProgressDetails = () => {
    switch (type) {
      case 'DIAMOND_HANDS':
        return {
          current: progress.holdingDays,
          target: 30,
          label: 'days held'
        };
      case 'FREQUENT_TRADER':
        return {
          current: progress.tradeCount,
          target: 5,
          label: 'trades'
        };
      case 'ACTIVE_TRADER':
        return {
          current: progress.tradeCount,
          target: 10,
          label: 'trades (30d)'
        };
      case 'WHALE':
        return {
          current: progress.tradeVolume,
          target: 10000,
          label: 'volume (30d)'
        };
      case 'HIGH_LIQUIDITY_TRADER':
        return {
          current: progress.tradeVolume,
          target: 100000,
          label: 'volume'
        };
      case 'BIG_SPENDER':
        return {
          current: progress.tradeVolume,
          target: 10000,
          label: 'volume ($)'
        };
      default:
        return null;
    }
  };

  const details = getProgressDetails();
  if (!details) return null;

  const percentage = Math.min((details.current / details.target) * 100, 100);

  return (
    <div className="mt-2">
      <div className="text-xs text-green-500/70">
        {details.current} / {details.target} {details.label}
      </div>
      <div className="h-1 bg-green-500/20 rounded-full mt-1">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AchievementCard({ achievement, progress, isNew }) {
  useEffect(() => {
    if (isNew) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Trigger haptic feedback
      if (window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    }
  }, [isNew]);

  return (
    <div 
      className={`
        rounded p-4 flex flex-col w-full h-full
        bg-gradient-to-br ${ACHIEVEMENT_COLORS[achievement.achievement_type]}
        transition-all duration-200
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {ACHIEVEMENT_ICONS[achievement.achievement_type]}
        </div>
        <div>
          <div className="font-bold">
            {ACHIEVEMENT_LABELS[achievement.achievement_type]}
          </div>
          <div className="text-sm text-green-500/70">
            {achievement.token_symbol}
          </div>
        </div>
      </div>
      
      {progress && (
        <AchievementProgress 
          progress={progress} 
          type={achievement.achievement_type} 
        />
      )}
    </div>
  );
}

export default function Achievements() {
  const { publicKey, toBase58 } = useWallet();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevAchievements = useRef([]);

  const [showNotification, setShowNotification] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!publicKey) return;

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/achievements?wallet=${toBase58()}`);
        if (!response.ok) throw new Error('Failed to fetch achievements');
        const data = await response.json();
        setAchievements(data);

        const progressResponse = await fetch(`/api/achievements/progress?wallet=${toBase58()}`);
        const progressData = await progressResponse.json();
        setProgress(progressData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [publicKey, toBase58]);

  if (!publicKey) return null;
  if (loading) return <div className="animate-pulse">Loading achievements...</div>;
  if (error) return <div className="text-red-500">Error loading achievements: {error}</div>;

  useEffect(() => {
    if (achievements.length > prevAchievements.current?.length) {
      const newest = achievements[achievements.length - 1];
      setNewAchievement(newest);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
    prevAchievements.current = achievements;
  }, [achievements]);

  const handleSwipe = (achievement, direction) => {
    console.log(`Swiped ${direction} on achievement:`, achievement);
    // Add any swipe-specific logic here
  };

  return (
    <>
      <GlowBorder className="p-4">
        <h2 className="text-xl mb-4">Achievements</h2>
        <div className="h-[400px] mb-4">
          <SwipeCards
            items={achievements}
            onSwipe={handleSwipe}
            renderItem={(achievement) => (
              <AchievementCard 
                achievement={achievement}
                progress={progress}
                isNew={achievement === newAchievement}
              />
            )}
          />
        </div>
      </GlowBorder>

      {/* Achievement notification */}
      {showNotification && newAchievement && (
        <div className="fixed bottom-4 right-4 bg-green-500/90 text-white p-4 rounded-lg shadow-lg transform transition-transform duration-500 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="text-2xl">
              {ACHIEVEMENT_ICONS[newAchievement.achievement_type]}
            </div>
            <div>
              <div className="font-bold">New Achievement!</div>
              <div>{ACHIEVEMENT_LABELS[newAchievement.achievement_type]}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 