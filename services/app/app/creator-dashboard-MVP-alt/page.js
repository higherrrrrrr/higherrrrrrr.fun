'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText } from '../../components/GlitchText';

export default function CreatorDashboard() {
  const router = useRouter();
  
  // Mock data for multiple tokens
  const myTokens = [
    {
      id: 'token1',
      name: 'My First Token',
      symbol: 'MFT',
      volume24h: '$1.2M',
      trustScore: '85%',
      holders: '1,245'
    },
    {
      id: 'token2',
      name: 'Second Project',
      symbol: 'SP2',
      volume24h: '$800K',
      trustScore: '92%',
      holders: '876'
    },
    {
      id: 'token3',
      name: 'Third Token',
      symbol: 'TT3',
      volume24h: '$450K',
      trustScore: '78%',
      holders: '532'
    }
  ];

  // State for current token index
  const [currentTokenIndex, setCurrentTokenIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedIndex = localStorage.getItem('currentTokenIndex');
      return savedIndex ? parseInt(savedIndex, 10) : 0;
    }
    return 0;
  });

  // Get current token
  const currentToken = myTokens[currentTokenIndex];

  // Save current token index to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentTokenIndex', currentTokenIndex.toString());
    }
  }, [currentTokenIndex]);

  // Function to handle token selection
  const handleTokenSelect = (index) => {
    setCurrentTokenIndex(index);
  };

  // Initial checklist template
  const initialChecklist = [
    { 
      id: 'telegram-group', 
      label: 'Set up Telegram group/channel', 
      completed: false, 
      link: '/resources/telegram-setup',
      subItems: [
        { id: 'captcha', label: 'Set up Captcha', completed: false, link: '/resources#antiSpam' },
        { id: 'buy-bot', label: 'Set up BuyBot', completed: false, link: '/resources#buyBot' },
        { id: 'moderators', label: 'Appoint Moderators', completed: false, link: '/resources#antiSpam' },
        { id: 'pin-guidelines', label: 'Pin Community Guidelines', completed: false, link: '/resources/community-guidelines' }
      ]
    },
    { id: 'twitter', label: 'Create Twitter/X account', completed: false, link: '/resources/twitter-setup' },
    { id: 'dex-tools', label: 'Register on DEX Tools/Screener', completed: false, link: '/resources/dex-registration' },
    { id: 'telegram-bot', label: 'Configure Telegram Bot/Meme Generator', completed: false, link: '/TG-Bot-Creator' },
    { id: 'lore-page', label: 'Create Lore Page', completed: false, link: '/lore-page' },
    { id: 'pfp-customizer', label: 'Use our PFP Customizer to rep your project', completed: false, link: '/pfp-customizer' }
  ];
  
  // Load saved progress from localStorage for the current token
  const [checklist, setChecklist] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedChecklist = localStorage.getItem(`communityChecklist_${currentToken.id}`);
      return savedChecklist ? JSON.parse(savedChecklist) : initialChecklist;
    }
    return initialChecklist;
  });

  // Update checklist when token changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChecklist = localStorage.getItem(`communityChecklist_${currentToken.id}`);
      setChecklist(savedChecklist ? JSON.parse(savedChecklist) : initialChecklist);
    }
  }, [currentToken.id]);

  // Calculate completion percentage
  const calculateCompletionPercentage = (list) => {
    let totalItems = 0;
    let completedItems = 0;
    
    list.forEach(item => {
      totalItems++;
      if (item.completed) completedItems++;
      
      if (item.subItems && item.subItems.length > 0) {
        totalItems += item.subItems.length;
        completedItems += item.subItems.filter(subItem => subItem.completed).length;
      }
    });
    
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  };
  
  const completionPercentage = calculateCompletionPercentage(checklist);

  // Toggle item completion with proper localStorage update
  const toggleItem = (id, parentId = null) => {
    let updatedChecklist;
    
    if (parentId) {
      // Toggle sub-item
      updatedChecklist = checklist.map(item => {
        if (item.id === parentId && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.map(subItem => 
              subItem.id === id ? { ...subItem, completed: !subItem.completed } : subItem
            )
          };
        }
        return item;
      });
    } else {
      // Toggle main item
      updatedChecklist = checklist.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
    }
    
    setChecklist(updatedChecklist);
    
    // Save to localStorage with token-specific key
    if (typeof window !== 'undefined') {
      localStorage.setItem(`communityChecklist_${currentToken.id}`, JSON.stringify(updatedChecklist));
    }
  };
  
  // Navigation handlers
  const handleCreateToken = () => router.push('/token/create');
  const handleLaunchToken = () => router.push('/token/launch');
  const handleTelegramBotClick = () => router.push('/TG-Bot-Creator');
  const handleLorePageClick = () => router.push('/lore-page');
  const handleResourcesClick = () => router.push('/resources');

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const handleWizardComplete = () => {
    // Logic for wizard completion
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      <div id="dashboard-header" className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          <GlitchText>Creator Dashboard</GlitchText>
        </h1>
        <p className="text-xl text-green-500/80">
          Create and deploy tokens, grow your community
        </p>
      </div>

      {/* Token Selector */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Tokens</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {myTokens.map((token, index) => (
            <div 
              key={token.id}
              className={`p-4 border rounded-lg cursor-pointer min-w-[200px] transition-all ${
                index === currentTokenIndex 
                  ? 'border-green-500 bg-green-900/20' 
                  : 'border-green-500/30 hover:border-green-500/60'
              }`}
              onClick={() => handleTokenSelect(index)}
            >
              <div className="font-bold text-lg">{token.symbol}</div>
              <div className="text-green-500/70">{token.name}</div>
            </div>
          ))}
          <div 
            className="p-4 border border-dashed border-green-500/30 rounded-lg cursor-pointer min-w-[200px] flex items-center justify-center hover:border-green-500/60 transition-all"
            onClick={handleCreateToken}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Create New Token</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Stats */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Token Stats: {currentToken.symbol}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-green-500/70">24h Volume</div>
            <div className="text-2xl font-bold">{currentToken.volume24h}</div>
          </div>
          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-green-500/70">Trust Score</div>
            <div className="text-2xl font-bold">{currentToken.trustScore}</div>
          </div>
          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-sm text-green-500/70">Holders</div>
            <div className="text-2xl font-bold">{currentToken.holders}</div>
          </div>
        </div>
      </div>
      
      {/* Creator Tools (previously Quick Actions) */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Creator Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleTelegramBotClick}
            className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Create Telegram Bot</span>
            </div>
          </button>
          <button 
            onClick={handleLorePageClick}
            className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Create Lore Page</span>
            </div>
          </button>
          <button 
            onClick={handleResourcesClick}
            className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Resources</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Community Essentials Checklist */}
      <div id="checklist-section" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Community Essentials Checklist for {currentToken.symbol}</h2>
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
          
          {/* Checklist items with nested structure */}
          <div className="space-y-4">
            {checklist.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
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
                
                {/* Render sub-items if they exist */}
                {item.subItems && item.subItems.length > 0 && (
                  <div className="pl-10 space-y-2 mt-2">
                    {item.subItems.map(subItem => (
                      <div key={subItem.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-5 h-5 rounded border border-green-500/30 mr-3 flex items-center justify-center cursor-pointer"
                            onClick={() => toggleItem(subItem.id, item.id)}
                          >
                            {subItem.completed && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${subItem.completed ? 'text-green-500/70' : 'text-green-500'}`}>
                            {subItem.label}
                          </span>
                        </div>
                        <a 
                          href={subItem.link} 
                          className="text-green-500 hover:text-green-400 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(subItem.link);
                          }}
                        >
                          Learn more
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Launch Token Button */}
      <div className="flex justify-center mb-12">
        <button 
          onClick={handleLaunchToken}
          className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-8 rounded-lg text-lg transition-colors"
        >
          Launch Token
        </button>
      </div>
      
      {/* Wizard component would go here */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          {/* Wizard content */}
        </div>
      )}
    </div>
  );
}

// SpotlightWizard component definition would go here
// (I've omitted it for brevity since we're not changing it)
