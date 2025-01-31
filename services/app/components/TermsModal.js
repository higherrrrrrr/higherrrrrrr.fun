import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted terms
    const hasAccepted = localStorage.getItem('termsAccepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const acceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-green-500/30 rounded-lg max-w-2xl w-full p-6 md:p-8">
        <h2 className="text-2xl font-bold text-green-500 mb-6">Before You Enter...</h2>
        
        <div className="space-y-4 text-green-500/80 mb-8">
          <p className="mb-4">Hey anon, please read this quick disclaimer:</p>
          
          <ul className="list-disc pl-5 space-y-3">
            <li>
              This is a token launchpad, not an exchange or financial advisor. We don't make 
              recommendations or give investment advice.
            </li>
            <li>
              Featured projects (HighLites) are not endorsements. DYOR and understand the risks.
            </li>
            <li>
              You're responsible for your own decisions. Crypto is risky - never invest more 
              than you can afford to lose.
            </li>
            <li>
              Everything here is user-driven. Make sure you follow your local laws and regulations.
            </li>
            <li>
              By using the platform, you agree that we're not liable for any losses or issues 
              with tokens you interact with.
            </li>
          </ul>

          <p className="mt-6 text-sm">
            For the full terms, check out our{' '}
            <Link href="/tos" className="text-green-500 hover:text-green-400 underline">
              Terms of Service
            </Link>
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <a 
            href="https://google.com" 
            className="px-6 py-2 border border-green-500/50 text-green-500 rounded hover:bg-green-500/10"
          >
            Exit
          </a>
          <button
            onClick={acceptTerms}
            className="px-6 py-2 bg-green-500 text-black rounded hover:bg-green-400 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
} 