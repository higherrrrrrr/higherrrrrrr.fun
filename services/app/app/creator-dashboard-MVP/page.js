'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText } from '../../components/GlitchText';

export default function CreatorDashboard() {
  const router = useRouter();
  
  // Add state for current token index
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  // Expanded mock data for demonstration
  const myTokens = [
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      volume24h: '$2.0B',
      trustScore: '100%',
      trades24h: '1,862,974',
      holders: '22,536,826',
      created: '4y ago'
    },
    {
      id: 'sol',
      name: 'Solana',
      symbol: 'SOL',
      volume24h: '$1.5B',
      trustScore: '95%',
      trades24h: '1,245,632',
      holders: '15,789,421',
      created: '3y ago'
    },
    {
      id: 'doge',
      name: 'Dogecoin',
      symbol: 'DOGE',
      volume24h: '$800M',
      trustScore: '85%',
      trades24h: '987,654',
      holders: '8,765,432',
      created: '2y ago'
    }
  ];

  // Navigation handlers
  const handleCreateToken = () => router.push('/token/create');
  const handleLaunchToken = () => router.push('/token/launch');
  const handleTelegramBotClick = () => router.push('/TG-Bot-Creator');
  const handleLorePageClick = () => router.push('/lore-page');
  const handleResourcesClick = () => router.push('/resources');

  // Initial checklist items
  const initialChecklist = [
    { id: 'telegram-group', label: 'Set up Telegram group/channel', completed: false, link: '/resources/telegram-setup' },
    { id: 'telegram-bot', label: 'Configure Telegram bot', completed: false, link: '/TG-Bot-Creator' },
    { id: 'twitter', label: 'Create Twitter/X account', completed: false, link: '/resources/twitter-setup' },
    { id: 'dex-tools', label: 'Register on DEX Tools/Screener', completed: false, link: '/resources/dex-registration' },
    { id: 'announcement', label: 'Create token announcement', completed: false, link: '/resources/announcement-template' },
    { id: 'guidelines', label: 'Establish community guidelines', completed: false, link: '/resources/community-guidelines' },
  ];

  // Load saved progress from localStorage
  const [checklist, setChecklist] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedChecklist = localStorage.getItem('communityChecklist');
      return savedChecklist ? JSON.parse(savedChecklist) : initialChecklist;
    }
    return initialChecklist;
  });

  // Calculate completion percentage
  const completedCount = checklist.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / checklist.length) * 100);

  // Toggle item completion
  const toggleItem = (id) => {
    const updatedChecklist = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    if (typeof window !== 'undefined') {
      localStorage.setItem('communityChecklist', JSON.stringify(updatedChecklist));
    }
  };

  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Check if user has seen the wizard before
    if (typeof window !== 'undefined') {
      const hasCompletedWizard = localStorage.getItem('wizardCompleted') === 'true';
      if (!hasCompletedWizard) {
        // Small delay to ensure the dashboard is rendered first
        const timer = setTimeout(() => {
          setShowWizard(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleWizardComplete = () => {
    setShowWizard(false);
  };

  // Function to handle dot navigation
  const handleDotClick = (index) => {
    setCurrentTokenIndex(index);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      <div id="dashboard-header" className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          <GlitchText>Creator Dashboard</GlitchText>
        </h1>
        <p className="text-xl text-green-500/80">
          Create and deploy Cult Coins, grow your communities
        </p>
      </div>

      {/* First row: My Tokens */}
      <div className="mb-12">
        <h2 id="tokens-section" className="text-2xl font-semibold mb-4">My Tokens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token card */}
          <div className="border border-green-500/30 rounded-lg p-6 hover:bg-green-900/10 transition">
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold">{myTokens[currentTokenIndex].name}</h3>
                <p className="text-green-500/80">{myTokens[currentTokenIndex].symbol} | all</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold flex items-center">
                  {myTokens[currentTokenIndex].volume24h}<span className="ml-1">🔥</span>
                </p>
                <p className="text-green-500/80">24h Volume</p>
              </div>
            </div>
            <p className="mb-4 text-green-500/80">Trust Score: <span className="text-green-500">{myTokens[currentTokenIndex].trustScore}</span></p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-green-500/80">Trades (24h)</p>
                <p className="font-bold">{myTokens[currentTokenIndex].trades24h}</p>
              </div>
              <div>
                <p className="text-sm text-green-500/80">Holders</p>
                <p className="font-bold">{myTokens[currentTokenIndex].holders}</p>
              </div>
              <div>
                <p className="text-sm text-green-500/80">Created</p>
                <p className="font-bold">{myTokens[currentTokenIndex].created}</p>
              </div>
            </div>
            
            {/* Pagination dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {myTokens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentTokenIndex ? 'bg-green-500' : 'bg-green-500/30'
                  }`}
                  aria-label={`View token ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Launch Your Token card (replacing Add New Token) */}
          <div 
            id="launch-section" 
            className="border border-green-500/30 rounded-lg p-6 hover:bg-green-900/10 transition cursor-pointer"
            onClick={handleLaunchToken}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full border border-green-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Launch New Token</h3>
              <p className="text-center text-green-500/80">Create and deploy a new token on Solana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: Creator Tools */}
      <div className="mb-12">
        <h2 id="tools-section" className="text-2xl font-semibold mb-4">Creator Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Telegram Bot */}
          <div 
            className="border border-green-500/30 rounded-lg p-6 hover:bg-green-900/10 transition cursor-pointer"
            onClick={handleTelegramBotClick}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-green-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Telegram Bot</h3>
              <p className="text-center text-green-500/80">Create and configure your community bot</p>
            </div>
          </div>
          
          {/* Lore Page */}
          <div 
            className="border border-green-500/30 rounded-lg p-6 hover:bg-green-900/10 transition cursor-pointer"
            onClick={handleLorePageClick}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-green-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Lore Page</h3>
              <p className="text-center text-green-500/80">Develop your token's backstory and narrative</p>
            </div>
          </div>
          
          {/* Resources */}
          <div 
            className="border border-green-500/30 rounded-lg p-6 hover:bg-green-900/10 transition cursor-pointer"
            onClick={handleResourcesClick}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-green-500 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Resources</h3>
              <p className="text-center text-green-500/80">Guides, templates, and best practices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Essentials Checklist - keeping the existing one */}
      <div id="checklist-section" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Community Essentials Checklist</h2>
        <div className="border border-green-500/30 rounded-lg p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-green-500">Progress</span>
              <span className="text-green-500">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-green-900/20 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Checklist items */}
          <div className="space-y-4">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded border border-green-500/30 mr-3 flex items-center justify-center cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={item.completed ? 'text-green-500/70' : 'text-green-500'}>
                    {item.label}
                  </span>
                </div>
                <a 
                  href={item.link} 
                  className="text-green-500 hover:text-green-400 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.link);
                  }}
                >
                  Learn more
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard component */}
      {showWizard && (
        <SpotlightWizard 
          isOpen={showWizard} 
          onClose={() => setShowWizard(false)} 
          onComplete={handleWizardComplete} 
        />
      )}
    </div>
  );
}

// SpotlightWizard component definition would go here
// (I've omitted it for brevity since we're not changing it)
