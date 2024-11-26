import { useEffect, useState } from 'react';
import ComingSoon from '../pages/coming-soon';
import { ConnectKitButton } from '../components/Web3Provider';
import Link from 'next/link';
import { useTypewriter } from '../hooks/useTypewriter';
import { getContractAddress } from '../api/contract';

const LAUNCH_DATE = new Date("2024-11-26T17:00:00-08:00");

export default function MainLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [shouldShowComingSoon, setShouldShowComingSoon] = useState(true);
  const [keySequence, setKeySequence] = useState("");
  
  const logoText = useTypewriter("Higherrrrrrr", {
    minRs: 3,
    maxRs: 8,
    typingSpeed: 150,
    deletingSpeed: 100,
  });

  // Force client-side rendering
  useEffect(() => {
    setMounted(true);
    
    // Check if we're past launch date
    const now = new Date().getTime();
    const isAfterLaunch = now >= LAUNCH_DATE.getTime();
    
    if (isAfterLaunch) {
      setShouldShowComingSoon(false);
      return;
    }

    // Check for existing auth
    const storedAuthToken = localStorage.getItem('auth_token');
    if (storedAuthToken) {
      getContractAddress()
        .then(data => {
          if (data.factory_address) {
            setShouldShowComingSoon(false);
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = async (e) => {
      const newSequence = (keySequence + e.key).slice(-12);
      setKeySequence(newSequence);

      if (newSequence.length === 12) {
        try {
          localStorage.setItem('auth_token', newSequence);
          const data = await getContractAddress();
          
          if (data.factory_address) {
            setShouldShowComingSoon(false);
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.debug('Invalid sequence:', error);
          localStorage.removeItem('auth_token');
        }
        setKeySequence("");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence]);

  // Don't render anything until client-side
  if (!mounted) {
    return null;
  }

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