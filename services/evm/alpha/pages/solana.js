import { useState, useEffect } from 'react';
import Head from 'next/head';

// Add getLayout property to disable default layout
Agents.getLayout = (page) => page;

export default function Agents() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target date to January 31, 2025 3:00 PM PST
    const targetDate = new Date('2025-01-31T15:00:00-08:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Solana Launch Countdown</title>
      </Head>
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center">
          SOLANA LAUNCH IN
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8 text-center w-full max-w-[600px] md:max-w-none">
          <div className="flex flex-col">
            <div className="text-3xl md:text-7xl font-bold mb-2 border border-green-500/20 rounded-lg p-2 md:p-4 min-w-[80px] md:min-w-[120px] bg-black/50">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-base text-green-500/60">DAYS</div>
          </div>

          <div className="flex flex-col">
            <div className="text-3xl md:text-7xl font-bold mb-2 border border-green-500/20 rounded-lg p-2 md:p-4 min-w-[80px] md:min-w-[120px] bg-black/50">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-base text-green-500/60">HOURS</div>
          </div>

          <div className="flex flex-col">
            <div className="text-3xl md:text-7xl font-bold mb-2 border border-green-500/20 rounded-lg p-2 md:p-4 min-w-[80px] md:min-w-[120px] bg-black/50">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-base text-green-500/60">MINUTES</div>
          </div>

          <div className="flex flex-col">
            <div className="text-3xl md:text-7xl font-bold mb-2 border border-green-500/20 rounded-lg p-2 md:p-4 min-w-[80px] md:min-w-[120px] bg-black/50">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-base text-green-500/60">SECONDS</div>
          </div>
        </div>

        <div className="mt-8 md:mt-16 text-base md:text-xl text-green-500/80 text-center px-4 max-w-3xl">
          <p className="text-2xl md:text-3xl font-bold">
            Launching on Solana Mainnet
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">🎨 Living Image Standard</h3>
              <p className="text-sm opacity-80">Dynamic NFTs that evolve with milestones. Watch your art transform and grow.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold">💰 Evolution Rewards</h3>
              <p className="text-sm opacity-80">Earn from every evolution. Direct rewards for builders and communities.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold">🎯 Early Builder Access</h3>
              <p className="text-sm opacity-80">Launch with guaranteed allocation. Build the future of evolving tokens.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold">🚀 Growth Mechanics</h3>
              <p className="text-sm opacity-80">Tokens that evolve with your community. Each milestone unlocks new potential.</p>
            </div>
          </div>

          <p className="mt-8 text-sm md:text-base opacity-80">
            The evolution of tokens begins here.
          </p>
        </div>
      </div>
    </>
  );
} 