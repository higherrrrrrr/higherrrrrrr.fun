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
    // Set target date to December 18, 2024 5:00 PM PST
    const targetDate = new Date('2024-12-18T17:00:00-08:00').getTime();

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
        <title>TRUSTWORTHY AI ARRIVING IN</title>
      </Head>
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 text-center">TRUSTWORTHY AI ARRIVING IN</h1>
        
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

        <div className="mt-8 md:mt-16 text-base md:text-xl text-green-500/80 text-center px-4">
          Next generation of trustworthy AI agents
        </div>
      </div>
    </>
  );
} 