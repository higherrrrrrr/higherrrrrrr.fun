import { useEffect, useState } from 'react';
import ComingSoon from '../pages/coming-soon';
import Cookies from 'js-cookie';
import { ConnectKitButton } from '../components/Web3Provider';
import Link from 'next/link';
import { useTypewriter } from '../hooks/useTypewriter';

const LAUNCH_DATE = new Date("2024-11-26T12:00:00-05:00");

export default function MainLayout({ children }) {
  const [shouldShowComingSoon, setShouldShowComingSoon] = useState(true);
  const logoText = useTypewriter("Higherrrrrrr", {
    minRs: 3,
    maxRs: 8,
    typingSpeed: 150,
    deletingSpeed: 100,
  });
  
  useEffect(() => {
    const launchOverride = Cookies.get('launch-override');
    const beforeLaunch = new Date().getTime() < LAUNCH_DATE.getTime();
    
    if (launchOverride === 'true') {
      setShouldShowComingSoon(false);
    } else {
      setShouldShowComingSoon(beforeLaunch);
    }
  }, []);

  if (shouldShowComingSoon) {
    return <ComingSoon />;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto">
        <Link href="/">
          <h1 className="text-xl md:text-2xl font-mono font-bold text-green-500 hover:text-green-400 transition-colors cursor-pointer">
            {logoText}
          </h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/launch">
            <button className="px-4 py-2 text-sm md:text-base bg-green-500 hover:bg-green-400 text-black font-mono rounded transition-colors transform hover:scale-105">
              Launch Token
            </button>
          </Link>
          <ConnectKitButton />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">{children}</main>
    </div>
  );
}