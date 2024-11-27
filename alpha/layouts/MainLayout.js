import { useEffect, useState } from 'react';
import ComingSoon from '../pages/coming-soon';
import { ConnectKitButton } from '../components/Web3Provider';
import Link from 'next/link';
import { useTypewriter } from '../hooks/useTypewriter';
import { getContractAddress } from '../api/contract';

const LAUNCH_DATE = new Date("2024-11-25T17:00:00-08:00");

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

  // Force client-side rendering and check launch status
  useEffect(() => {
    setMounted(true);
    
    // Function to check launch status
    const checkLaunchStatus = () => {
      const now = new Date().getTime();
      const isAfterLaunch = now >= LAUNCH_DATE.getTime();
      
      if (isAfterLaunch) {
        setShouldShowComingSoon(false);
        localStorage.setItem('auth_token', 'LAUNCHED');
        return true;
      }
      return false;
    };

    // Function to check contract address and set cookie
    const checkContractAddress = async () => {
      try {
        const data = await getContractAddress();
        if (data.factory_address) {
          setShouldShowComingSoon(false);
          // Set cookie with 7 day expiry
          document.cookie = `factory_address=${data.factory_address};max-age=604800;path=/`;
          return true;
        }
      } catch (error) {
        console.error('Error fetching contract address:', error);
      }
      return false;
    };

    // Initial check
    const isLaunched = checkLaunchStatus();
    
    // If not launched, check for auth token and set up timer
    if (!isLaunched) {
      const storedAuthToken = localStorage.getItem('auth_token');
      if (storedAuthToken) {
        // Check if we already have the address in cookie
        const cookies = document.cookie.split(';');
        const factoryAddressCookie = cookies.find(c => c.trim().startsWith('factory_address='));
        
        if (factoryAddressCookie) {
          setShouldShowComingSoon(false);
        } else {
          checkContractAddress();
        }
      }
      
      // Set up periodic check every 30 seconds
      const timer = setInterval(checkLaunchStatus, 30000);
      return () => clearInterval(timer);
    }
  }, []);

  // Secret password functionality
  useEffect(() => {
    const handleKeyPress = async (e) => {
      // Skip password check if already launched
      if (new Date().getTime() >= LAUNCH_DATE.getTime()) {
        return;
      }

      const newSequence = (keySequence + e.key).slice(-4);
      setKeySequence(newSequence);

      if (newSequence.length === 4) {
        try {
          localStorage.setItem('auth_token', newSequence);
          const data = await getContractAddress();
          
          if (data.factory_address) {
            setShouldShowComingSoon(false);
            // Set cookie with 7 day expiry
            document.cookie = `factory_address=${data.factory_address};max-age=604800;path=/`;
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
    <div className="min-h-screen bg-black flex flex-col">
      <header className="flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto w-full">
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

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 py-8 w-full">
        {children}
      </main>

      <footer className="border-t border-green-500/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-center items-center">
          <a 
            href="https://base.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-500/50 hover:text-green-500 font-mono text-sm transition-colors flex items-center space-x-2"
          >
            <span>Built on</span>
            <img 
              src="/base-logo.svg" 
              alt="Base" 
              className="h-4 w-4 inline-block"
            />
            <span>Base</span>
          </a>
        </div>
      </footer>
    </div>
  );
}