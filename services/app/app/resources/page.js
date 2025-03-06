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
                  Buy bots are essential for creating excitement and momentum in your community. 
                  They automatically announce when someone purchases your token, creating social 
                  proof and FOMO. Active buying notifications encourage more purchases, increase 
                  group engagement, and build confidence in your project's momentum. Here are some 
                  popular options you can add to your group:
                </p>
                
                {/* BuyBot */}
                <div className="bg-green-900/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-500">BuyBot</h3>
                    <a 
                      href="https://t.me/buybotxyz" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-green-700/50 hover:bg-green-700/70 text-green-100 px-4 py-2 rounded-md text-sm transition"
                    >
                      Open in Telegram
                    </a>
                  </div>
                  <p className="text-green-500/80 mb-4">
                    One of the most popular buy bots for Solana tokens. Free to use with premium features available.
                  </p>
                  <div className="mb-4">
                    <h4 className="text-green-500 font-medium mb-2">Features:</h4>
                    <ul className="list-disc list-inside text-green-500/80 space-y-1">
                      <li>Real-time buy notifications</li>
                      <li>Customizable messages</li>
                      <li>Whale alerts</li>
                      <li>Transaction links</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-500 font-medium mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside text-green-500/80 space-y-1">
                      <li>Add @buybotxyz to your Telegram group</li>
                      <li>Type /setup in your group</li>
                      <li>Follow the prompts to enter your token address</li>
                      <li>Configure notification settings</li>
                    </ol>
                  </div>
                </div>
                
                {/* WhaleBotPro */}
                <div className="bg-green-900/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-500">WhaleBotPro</h3>
                    <a 
                      href="https://t.me/whalebotpro" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-green-700/50 hover:bg-green-700/70 text-green-100 px-4 py-2 rounded-md text-sm transition"
                    >
                      Open in Telegram
                    </a>
                  </div>
                  <p className="text-green-500/80 mb-4">
                    Advanced buy tracking with detailed analytics and whale alerts.
                  </p>
                  <div className="mb-4">
                    <h4 className="text-green-500 font-medium mb-2">Features:</h4>
                    <ul className="list-disc list-inside text-green-500/80 space-y-1">
                      <li>Buy and sell notifications</li>
                      <li>Price impact calculations</li>
                      <li>Wallet tracking</li>
                      <li>Daily volume reports</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-500 font-medium mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside text-green-500/80 space-y-1">
                      <li>Add @whalebotpro to your group</li>
                      <li>Use /register command</li>
                      <li>Enter your token contract address</li>
                      <li>Set minimum transaction amounts</li>
                    </ol>
                  </div>
                </div>
                
                {/* SolTracker */}
                <div className="bg-green-900/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-500">SolTracker</h3>
                    <a 
                      href="https://t.me/soltracker_bot" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-green-700/50 hover:bg-green-700/70 text-green-100 px-4 py-2 rounded-md text-sm transition"
                    >
                      Open in Telegram
                    </a>
                  </div>
                  <p className="text-green-500/80 mb-4">
                    Solana-specific tracking bot with customizable alerts and detailed transaction info.
                  </p>
                  <div className="mb-4">
                    <h4 className="text-green-500 font-medium mb-2">Features:</h4>
                    <ul className="list-disc list-inside text-green-500/80 space-y-1">
                      <li>Solana-optimized tracking</li>
                      <li>Multiple token support</li>
                      <li>Customizable thresholds</li>
                      <li>Graphical reports</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-500 font-medium mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside text-green-500/80 space-y-1">
                      <li>Add @soltracker_bot to your group</li>
                      <li>Use /track command</li>
                      <li>Enter your Solana token address</li>
                      <li>Configure notification preferences</li>
                    </ol>
                  </div>
                </div>
                
                <div className="bg-green-900/30 rounded-lg p-4 mt-6">
                  <h4 className="text-green-500 font-medium mb-2">Pro Tips:</h4>
                  <ul className="list-disc list-inside text-green-500/80 space-y-2">
                    <li>Make sure to give the buy bot admin privileges in your group</li>
                    <li>Set appropriate minimum buy amounts to avoid spam</li>
                    <li>Consider using only one buy bot to prevent duplicate notifications</li>
                    <li>Test the bot in a private group before adding to your main community</li>
                  </ul>
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
            <h2 className="text-xl font-semibold text-green-500">DEX Screener Resources</h2>
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
              <div className="space-y-6">
                {/* DEXScreener Info */}
                <div>
                  <h3 className="text-xl font-semibold text-green-500 mb-4">DEXScreener Info</h3>
                  
                  <div className="bg-green-900/20 rounded-lg p-4 mb-4">
                    <h4 className="text-green-500 font-medium mb-2">Free Features (Basic Claiming)</h4>
                    <ul className="list-disc list-inside text-green-500/80 space-y-2">
                      <li>Claim your token page by verifying with your developer wallet</li>
                      <li>Add basic information like website and social links</li>
                      <li>Verify you're the legitimate developer</li>
                      <li>Access to basic analytics and trading data</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-green-500 font-medium mb-2">Paid "Enhanced Token Info" ($299)</h4>
                    <ul className="list-disc list-inside text-green-500/80 space-y-2">
                      <li>Custom token logo</li>
                      <li>Detailed token description</li>
                      <li>Team information and credentials</li>
                      <li>Customized appearance of your token page</li>
                      <li>Enhanced visibility in search results</li>
                      <li>Accurate market cap calculation</li>
                      <li>Additional analytics features and data</li>
                    </ul>
                    <div className="mt-3">
                      <a 
                        href="https://marketplace.dexscreener.com/product/token-info" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        https://marketplace.dexscreener.com/product/token-info
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 border border-green-500/30 rounded-lg">
                    <p className="text-green-500/80">
                      <span className="font-semibold text-green-500">Pro Tip:</span> Even with just the free tier, claiming your token on DEXScreener is essential for legitimacy. Traders often check if a token has been claimed by its developers as a basic verification step.
                    </p>
                  </div>
                </div>
                
                {/* Additional DEX listing content would go here */}
              </div>
            </div>
          )}
        </div>

        {/* Higher^7 Hub */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
          <div 
            className="bg-green-500/10 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('higherHub')}
          >
            <h2 className="text-xl font-semibold text-green-500">Higher⁷ Hub</h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 transition-transform duration-300 ${openSection === 'higherHub' ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {openSection === 'higherHub' && (
            <div className="p-6 border-t border-green-500/30">
              <div className="space-y-6">
                <p className="text-green-500/80">
                  Your go-to Telegram space for everything going Higherrrrrrr in 2025 and beyond.
                </p>
                <p className="text-green-500/80">
                  Join the Hub to help shape the future of Social Trading and be among the first to learn about dev updates, community announcements, and dope new launches.
                </p>
                
                <div className="flex justify-center my-6">
                  <a 
                    href="https://t.me/higherrrrrrrhub" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-green-700/50 hover:bg-green-700/70 text-green-100 px-6 py-3 rounded-md text-lg transition"
                  >
                    Join Higher⁷ Hub
                  </a>
                </div>
                
                {/* Higher^7 Community Directory */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-green-500 mb-4">Higher⁷ Community Directory</h3>
                  <div className="bg-green-900/20 rounded-lg p-4">
                    <p className="text-green-500/80">
                      The Higher⁷ community directory is a list of Higher⁷ community members and their friends who are vouched for as honest people who provide quality work. Join the Hub and contact an admin to get access.
                    </p>
                  </div>
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
