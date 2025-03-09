'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementNotification({ walletAddress }) {
  const [newAchievement, setNewAchievement] = useState(null);
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Set up a polling mechanism or websocket to check for new achievements
    const checkNewAchievements = async () => {
      try {
        const res = await fetch(`/api/users/${walletAddress}/achievements/new`);
        const data = await res.json();
        
        if (data.newAchievement) {
          setNewAchievement(data.newAchievement);
          setShow(true);
          
          // Mark as seen after showing
          await fetch(`/api/users/${walletAddress}/achievements/${data.newAchievement.id}/seen`, {
            method: 'POST'
          });
          
          // Hide after 5 seconds
          setTimeout(() => setShow(false), 5000);
        }
      } catch (error) {
        console.error('Error checking for new achievements', error);
      }
    };
    
    // Check immediately and then every 30 seconds
    checkNewAchievements();
    const interval = setInterval(checkNewAchievements, 30000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);
  
  return (
    <AnimatePresence>
      {show && newAchievement && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-5 right-5 z-50 bg-black border border-green-500 rounded-lg p-4 shadow-lg max-w-xs"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">{newAchievement.icon}</div>
            <div>
              <h3 className="font-bold text-green-400">Achievement Unlocked!</h3>
              <p className="font-semibold text-white">{newAchievement.name}</p>
              <p className="text-sm text-gray-400">{newAchievement.description}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShow(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 