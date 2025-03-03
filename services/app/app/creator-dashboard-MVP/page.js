'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText } from '../../components/GlitchText';

export default function CreatorDashboard() {
  const router = useRouter();
  
  // Mock data for demonstration
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
    // Add more mock tokens as needed
  ];

  // Navigation handlers
  const handleCreateToken = () => router.push('/token/create');
  const handleLaunchToken = () => router.push('/token/launch');
  const handleTelegramBotClick = () => router.push('/TG-Bot-Creator');
  const handleLorePageClick = () => router.push('/lore-page');
  const handleResourcesClick = () => router.push('/resources');

  const TokenCard = ({ token, onClick }) => (
    <div className="border border-green-500/30 rounded-lg p-4 bg-black hover:bg-green-900/10 transition cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold">{token.name}</h3>
          <p className="text-green-400">{token.symbol} | all</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold flex items-center">
            {token.volume24h} <span className="ml-1">🔥</span>
          </p>
          <p className="text-sm text-green-400">24h Volume</p>
        </div>
      </div>
      
      <p className="mb-4">Trust Score: <span className="font-bold">{token.trustScore}</span></p>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-green-400">Trades (24h)</p>
          <p className="font-bold">{token.trades24h}</p>
        </div>
        <div>
          <p className="text-green-400">Holders</p>
          <p className="font-bold">{token.holders}</p>
        </div>
        <div>
          <p className="text-green-400">Created</p>
          <p className="font-bold">{token.created}</p>
        </div>
      </div>
    </div>
  );

  const CreateNewTokenCard = ({ onClick }) => (
    <div 
      className="border border-green-500/30 border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[200px] hover:bg-green-900/10 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full border border-green-500 flex items-center justify-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="font-medium">Add New Token</p>
    </div>
  );

  const LaunchTokenSection = ({ onClick }) => (
    <div 
      className="border border-green-500/30 rounded-lg p-6 h-64 flex flex-col items-center justify-center hover:bg-green-900/10 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-full border border-green-500 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2">Launch Your Token</h3>
      <p className="text-center text-green-400">Create and deploy your token on Solana</p>
    </div>
  );

  const ToolCard = ({ icon, title, description, onClick }) => (
    <div 
      className="flex flex-col items-center justify-center hover:bg-green-900/10 transition cursor-pointer rounded-lg p-3"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full border border-green-500 flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="font-medium text-center">{title}</p>
      {description && <p className="text-sm text-green-400/70 text-center mt-1">{description}</p>}
    </div>
  );

  const CreatorToolsSection = ({ onTelegramBotClick, onLorePageClick, onResourcesClick }) => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Creator Tools</h2>
      <div className="border border-green-500/30 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4">
          <ToolCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
            title="Telegram Bot"
            description="Create and configure your community bot"
            onClick={onTelegramBotClick}
          />
          
          <ToolCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="Lore Page"
            description="Develop your token's backstory and narrative"
            onClick={onLorePageClick}
          />
          
          <ToolCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Resources"
            description="Guides, templates, and best practices"
            onClick={onResourcesClick}
          />
        </div>
      </div>
    </div>
  );

  const ChecklistItem = ({ label, isCompleted, onToggle, learnMoreLink }) => (
    <div className="flex items-start space-x-3 py-2 border-b border-green-500/10 last:border-0">
      <div 
        className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 cursor-pointer flex items-center justify-center ${
          isCompleted ? 'bg-green-500 border-green-500' : 'border-green-500/50'
        }`}
        onClick={onToggle}
      >
        {isCompleted && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className={`${isCompleted ? 'line-through text-green-400/70' : 'text-green-400'}`}>{label}</p>
      </div>
      {learnMoreLink && (
        <a 
          href={learnMoreLink} 
          className="text-xs text-green-500 hover:text-green-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
      )}
    </div>
  );

  const CommunityChecklist = () => {
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
      const savedChecklist = localStorage.getItem('communityChecklist');
      return savedChecklist ? JSON.parse(savedChecklist) : initialChecklist;
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
      localStorage.setItem('communityChecklist', JSON.stringify(updatedChecklist));
    };

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Community Essentials Checklist</h2>
        <div className="border border-green-500/30 rounded-lg p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-green-400">Progress</span>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-green-900/20 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Checklist items */}
          <div className="space-y-1">
            {checklist.map(item => (
              <ChecklistItem
                key={item.id}
                label={item.label}
                isCompleted={item.completed}
                onToggle={() => toggleItem(item.id)}
                learnMoreLink={item.link}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SpotlightWizard = ({ isOpen, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    
    // Define wizard steps
    const steps = [
      {
        title: "Welcome to Your Creator Dashboard",
        content: "This is your command center for launching and managing your memecoin. Let's take a quick tour of the essential features."
      },
      {
        title: "My Tokens",
        content: "Here you can view your existing tokens or create a new one. Each card shows key metrics to track your token's performance."
      },
      {
        title: "Launch Your Token",
        content: "Ready to go live? Use this section to deploy your token to the blockchain and make it available for trading."
      },
      {
        title: "Creator Tools",
        content: "These tools help you build and manage your community. Set up a Telegram bot and create compelling lore for your token."
      },
      {
        title: "Community Essentials Checklist",
        content: "Follow this checklist to ensure you've covered all the basics for a successful community launch. We'll track your progress automatically."
      },
      {
        title: "You're All Set!",
        content: "You now have all the tools you need to create, launch, and grow your memecoin. Need help? Check out our resources section or contact support."
      }
    ];
    
    // Handle next step
    const handleNext = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    };
    
    // Handle previous step
    const handlePrevious = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };
    
    // Handle wizard completion
    const handleComplete = () => {
      if (dontShowAgain) {
        localStorage.setItem('wizardCompleted', 'true');
      }
      onComplete();
    };
    
    // Skip the wizard
    const handleSkip = () => {
      onClose();
    };
    
    if (!isOpen) return null;
    
    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    
    return (
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 max-w-sm">
        {/* Wizard dialog - fixed on right side, vertically centered */}
        <div 
          className="p-6 rounded-lg bg-black border border-green-400"
          style={{
            width: '350px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #4ade80',
            boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
          }}
        >
          <h3 
            className="text-xl font-bold mb-2 text-green-400"
          >
            {currentStepData.title}
          </h3>
          
          <p 
            className="mb-6 text-green-400"
          >
            {currentStepData.content}
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`rounded-full ${index === currentStep ? 'bg-green-400' : 'bg-green-400/30'}`}
                style={{
                  width: index === currentStep ? '8px' : '6px',
                  height: index === currentStep ? '8px' : '6px'
                }}
              ></div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isLastStep && (
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={dontShowAgain}
                    onChange={() => setDontShowAgain(!dontShowAgain)}
                  />
                  <div 
                    className={`w-4 h-4 rounded border border-green-400 mr-2 flex items-center justify-center ${dontShowAgain ? 'bg-green-400' : 'bg-transparent'}`}
                  >
                    {dontShowAgain && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-green-400">
                    Don't show again
                  </span>
                </label>
              )}
            </div>
            
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button 
                  className="text-green-400"
                  onClick={handlePrevious}
                >
                  Back
                </button>
              )}
              
              <button 
                className="px-4 py-2 bg-green-400/20 border border-green-400 rounded-md text-green-400"
                onClick={handleNext}
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </button>
              
              {!isLastStep && (
                <button 
                  className="text-green-400"
                  onClick={handleSkip}
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Check if user has seen the wizard before
    const hasCompletedWizard = localStorage.getItem('wizardCompleted') === 'true';
    if (!hasCompletedWizard) {
      // Small delay to ensure the dashboard is rendered first
      const timer = setTimeout(() => {
        setShowWizard(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleWizardComplete = () => {
    setShowWizard(false);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Centered Header with Tagline */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <GlitchText>Creator Dashboard</GlitchText>
          </h1>
          <p className="text-xl text-green-400/80 max-w-3xl mx-auto">
            Your all-in-one memecoin launchpad — create, deploy, and grow your token with our comprehensive tools and resources
          </p>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tokens Section */}
          <div id="tokens-section" className="col-span-1 lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">My Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTokens.map(token => (
                <TokenCard 
                  key={token.id} 
                  token={token} 
                  onClick={() => router.push(`/token/${token.id}`)}
                />
              ))}
              
              {/* Add New Token Card */}
              <CreateNewTokenCard onClick={handleCreateToken} />
            </div>
          </div>
          
          {/* Launch Token Section */}
          <div id="launch-section" className="col-span-1">
            <LaunchTokenSection onClick={handleLaunchToken} />
          </div>
          
          {/* Creator Tools Section */}
          <div id="tools-section" className="col-span-1">
            <CreatorToolsSection 
              onTelegramBotClick={handleTelegramBotClick}
              onLorePageClick={handleLorePageClick}
              onResourcesClick={handleResourcesClick}
            />
          </div>
          
          {/* Community Essentials Checklist */}
          <div id="checklist-section" className="col-span-1 lg:col-span-2">
            <CommunityChecklist />
          </div>
        </div>
      </div>
      
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
