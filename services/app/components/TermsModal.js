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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 mt-16">
      <div className="bg-black border border-green-500/30 rounded-lg max-w-2xl w-full p-6 md:p-8 max-h-[calc(100vh-8rem)] flex flex-col mx-auto">
        <h2 className="text-2xl text-green-500 mb-6 text-center">Before You Enter...</h2>
        
        <div className="space-y-4 text-green-500/80 mb-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent">
          <p className="mb-4 text-center">Hey anon, please read this quick disclaimer:</p>
          
          <ul className="list-disc pl-5 space-y-3 max-w-xl mx-auto">
            <li>
              This platform is a token launchpad, not an exchange or a financial advisor. We do not provide investment, financial, or legal advice, and nothing on this platform should be construed as such.
            </li>
            <li>
              Featured projects (HighLites) do not constitute endorsements. You should conduct your own research (DYOR) and understand the risks involved before making any investment decisions.
            </li>
            <li>
              You are solely responsible for your own decisions. Crypto investments are volatile and risky—never invest more than you can afford to lose.
            </li>
            <li>
              By using this platform, you represent and warrant that your activities comply with all applicable local, state, and federal laws and regulations, including those of the United States and Delaware.
            </li>
            <li>
              By using this platform, you agree that we will not be liable for any losses, claims, or disputes related to the tokens you create, purchase, sell, or interact with through our site.
            </li>
            <li>
              Governing Law & Jurisdiction: These Terms of Service shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict-of-law principles. Any dispute arising under or relating to these Terms shall be subject to the exclusive jurisdiction of the state and federal courts of Delaware.
            </li>
            <li>
              No Class Actions & Arbitration: You agree that any claims or disputes will be resolved individually and not as part of a class action, consolidated, or representative proceeding. Disputes may be subject to binding arbitration under the Delaware Rapid Arbitration Act (DRAA).
            </li>
            <li>
              Electronic Agreement: By clicking "I Understand" or using this platform, you acknowledge and agree that you are entering into a legally binding agreement, enforceable under the Delaware Uniform Electronic Transactions Act (UETA).
            </li>
          </ul>

          <p className="mt-6 text-sm text-center">
            For the full terms, check out our{' '}
            <Link href="/tos" className="text-green-500 hover:text-green-400 underline">
              Terms of Service
            </Link>
          </p>
        </div>

        <div className="flex justify-center gap-4 mt-auto pt-4 border-t border-green-500/20">
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