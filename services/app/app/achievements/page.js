'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Achievements from '../../components/Achievements';
import { motion } from 'framer-motion';

export default function AchievementsPage() {
  const { address, isConnecting, isDisconnected } = useWallet();
  const [typedText, setTypedText] = useState("");
  const fullText = "Test your faith...";
  
  // CLI typing effect
  useEffect(() => {
    if (typedText === fullText) return;
    
    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, Math.random() * 100 + 50);
      }
    };
    
    typeNextChar();
  }, []);
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-3 sm:mb-6">
        <div className="terminal-style text-green-500 font-mono text-2xl sm:text-3xl font-bold">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            $ {typedText}
          </motion.span>
          <motion.span 
            className="cursor ml-1 inline-block w-2.5 h-4 sm:w-3 sm:h-5 bg-green-500"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
      </div>
      
      <div className="bg-black/30 border border-green-500/20 rounded-lg shadow-lg p-3 sm:p-6">
        {isConnecting ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-green-500 font-mono">Connecting wallet...</div>
          </div>
        ) : isDisconnected || !address ? (
          <div className="border border-yellow-500/30 bg-black/20 p-4 rounded-lg text-center">
            <p className="text-yellow-400">Connect your wallet to view your achievements</p>
          </div>
        ) : (
          <Achievements walletAddress={address} />
        )}
      </div>
    </div>
  );
} 