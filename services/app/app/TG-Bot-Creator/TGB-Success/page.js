'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TGBotSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-black border border-green-500/30 rounded-xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Bot Created Successfully!</h1>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl mb-2">Your Telegram bot is now up and running!</p>
          <p className="text-green-500/70">You can start using it right away in Telegram.</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-3 text-green-500/90">
            <li>Open Telegram and search for your bot by username</li>
            <li>Start a conversation with your bot by clicking the Start button</li>
            <li>Try out the commands you configured</li>
            <li>Share your bot with friends!</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/TG-Bot-Creator" className="flex-1">
            <button className="w-full py-3 px-6 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-500 transition-colors">
              Create Another Bot
            </button>
          </Link>
          <Link href="/" className="flex-1">
            <button className="w-full py-3 px-6 bg-black hover:bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 transition-colors">
              Return Home {countdown > 0 && `(${countdown})`}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}