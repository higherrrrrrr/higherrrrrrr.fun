'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResourcesPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Glitch Header */}
      <div className="mb-8 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold text-green-500 font-mono relative z-10 glitch-text" data-text="Creator Resources">
          Creator Resources
        </h1>
        <div className="absolute inset-0 bg-black/20 z-0"></div>
      </div>

      <div className="space-y-6">
        {/* Buy Bot Resources */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
          <div 
            className="bg-green-500/10 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('buyBot')}
          >
            <h2 className="text-xl font-semibold text-green-500">Buy Bot Resources</h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 transition-transform duration-300 ${openSection === 'buyBot' ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {openSection === 'buyBot' && (
            <div className="p-6 border-t border-green-500/30">
              <div className="space-y-4">
                <p className="text-green-500/80">
                  Buy bots are essential for creating initial trading activity and maintaining liquidity for your token.
                </p>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Setting Up a Buy Bot:</h3>
                  <ol className="list-decimal list-inside text-green-500/80 space-y-2">
                    <li>Choose a reliable bot provider or create your own using Jupiter API</li>
                    <li>Configure parameters like buy frequency, amount per transaction, and price limits</li>
                    <li>Ensure you have sufficient funds in the bot wallet for transactions</li>
                    <li>Test thoroughly on testnet before deploying to mainnet</li>
                  </ol>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Best Practices:</h3>
                  <ul className="list-disc list-inside text-green-500/80 space-y-2">
                    <li>Use random time intervals between buys to appear more natural</li>
                    <li>Vary transaction sizes to mimic organic trading patterns</li>
                    <li>Set reasonable price ceilings to avoid overpaying during pumps</li>
                    <li>Monitor bot performance and adjust parameters as needed</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-green-500/90 italic">
                    Note: While buy bots can help maintain token liquidity, they should be used responsibly and transparently. Disclose bot usage to your community when appropriate.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anti-Spam Resources */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
          <div 
            className="bg-green-500/10 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('antiSpam')}
          >
            <h2 className="text-xl font-semibold text-green-500">Anti-Spam Resources</h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 transition-transform duration-300 ${openSection === 'antiSpam' ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {openSection === 'antiSpam' && (
            <div className="p-6 border-t border-green-500/30">
              <div className="space-y-4">
                <p className="text-green-500/80">
                  Protecting your community from spam and scams is crucial for maintaining trust and engagement.
                </p>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Telegram Anti-Spam Setup:</h3>
                  <ol className="list-decimal list-inside text-green-500/80 space-y-2">
                    <li>Add trusted anti-spam bots like @ComBot or @GroupHelpBot to your group</li>
                    <li>Configure captcha verification for new members</li>
                    <li>Set up message filtering for known scam phrases and links</li>
                    <li>Enable restrictions for new accounts (limited messages in first 24 hours)</li>
                  </ol>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Discord Anti-Spam Measures:</h3>
                  <ul className="list-disc list-inside text-green-500/80 space-y-2">
                    <li>Use verification levels and member screening</li>
                    <li>Set up MEE6 or Dyno bots for automated moderation</li>
                    <li>Create role-based permissions to limit new member actions</li>
                    <li>Configure auto-mod to detect spam patterns and raid attempts</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-green-500/90 italic">
                    Tip: Assign dedicated moderators with clear guidelines on handling spam and scam attempts. Regular review of anti-spam measures helps stay ahead of evolving tactics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DEX Listing Resources */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
          <div 
            className="bg-green-500/10 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('dexListing')}
          >
            <h2 className="text-xl font-semibold text-green-500">DEX Listing Resources</h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 transition-transform duration-300 ${openSection === 'dexListing' ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {openSection === 'dexListing' && (
            <div className="p-6 border-t border-green-500/30">
              <div className="space-y-4">
                <p className="text-green-500/80">
                  Getting properly listed on DEX platforms increases your token's visibility and credibility.
                </p>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">DEXTools Listing:</h3>
                  <ol className="list-decimal list-inside text-green-500/80 space-y-2">
                    <li>Your token will be automatically indexed after trading begins</li>
                    <li>For Solana tokens, ensure you're trading on supported DEXs (Raydium, Orca, etc.)</li>
                    <li>If not appearing, submit a request through their support channel</li>
                  </ol>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Social Info Update:</h3>
                  <ol className="list-decimal list-inside text-green-500/80 space-y-2">
                    <li>Visit <a href="https://www.dextools.io/app/en/social-update" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-400">dextools.io/app/en/social-update</a></li>
                    <li>Connect wallet (must be deployer wallet or have significant holdings)</li>
                    <li>Submit social links, website, description, and logo</li>
                    <li>Wait for approval (typically 1-3 days)</li>
                  </ol>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-green-500 font-medium mb-2">Jupiter Listing:</h3>
                  <ul className="list-disc list-inside text-green-500/80 space-y-2">
                    <li>Ensure your token has a Raydium or Orca liquidity pool</li>
                    <li>Jupiter will automatically index tokens with sufficient liquidity</li>
                    <li>For manual listing, submit details through their Discord community</li>
                    <li>Provide token address, name, symbol, and logo URL</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-green-500/90 italic">
                    Important: Maintaining sufficient liquidity is crucial for staying listed on most DEX aggregators. Monitor your liquidity pools regularly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard Button */}
      <div className="mt-8 text-center">
        <Link href="/creator-dashboard-MVP" className="inline-block px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 font-medium rounded-lg transition-colors duration-300 border border-green-500/30">
          Back to Creator Dashboard
        </Link>
      </div>

      {/* Add CSS for glitch effect */}
      <style jsx>{`
        .glitch-text {
          position: relative;
          animation: glitch 1s linear infinite;
        }
        
        .glitch-text:before,
        .glitch-text:after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          left: 0;
        }
        
        .glitch-text:before {
          left: 2px;
          text-shadow: -2px 0 #49fb35;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim 2s infinite linear alternate-reverse;
        }
        
        .glitch-text:after {
          left: -2px;
          text-shadow: -2px 0 #b300fc;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim2 2s infinite linear alternate-reverse;
        }
        
        @keyframes glitch-anim {
          0% {
            clip: rect(42px, 9999px, 44px, 0);
          }
          20% {
            clip: rect(12px, 9999px, 59px, 0);
          }
          40% {
            clip: rect(96px, 9999px, 61px, 0);
          }
          60% {
            clip: rect(23px, 9999px, 78px, 0);
          }
          80% {
            clip: rect(54px, 9999px, 35px, 0);
          }
          100% {
            clip: rect(58px, 9999px, 71px, 0);
          }
        }
        
        @keyframes glitch-anim2 {
          0% {
            clip: rect(65px, 9999px, 119px, 0);
          }
          20% {
            clip: rect(24px, 9999px, 68px, 0);
          }
          40% {
            clip: rect(35px, 9999px, 66px, 0);
          }
          60% {
            clip: rect(12px, 9999px, 22px, 0);
          }
          80% {
            clip: rect(74px, 9999px, 117px, 0);
          }
          100% {
            clip: rect(40px, 9999px, 29px, 0);
          }
        }
      `}</style>
    </div>
  );
}
