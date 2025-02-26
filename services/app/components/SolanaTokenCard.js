import { GlowBorder } from './GlowBorder';
import Link from 'next/link';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Connection } from '@solana/web3.js';
import { recordJupiterSwap } from '@/lib/jupiterIntegration';

// Define the checkForSuccessElement function globally for consistency
if (typeof window !== 'undefined') {
  window.checkForSuccessElement = async function() {
    console.log('Checking for Jupiter swap success indicators...');
    try {
      // Look for success indicators in the DOM
      const successTexts = ['Transaction confirmed', 'Swap successful', 'Swap completed'];
      
      // Check for success text in the DOM
      const allElements = document.querySelectorAll('div, span, p');
      let swapSuccessful = null;
      
      for (const element of allElements) {
        const text = element.textContent || '';
        if (successTexts.some(successText => text.includes(successText))) {
          swapSuccessful = element;
          break;
        }
      }
      
      if (swapSuccessful) {
        // If we found a success message, look for transaction links
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.href && (link.href.includes('explorer.solana.com/tx/') || 
              link.href.includes('solscan.io/tx/'))) {
            
            // Extract transaction ID from the link
            const txId = link.href.split('/tx/')[1]?.split('?')[0];
            if (txId) {
              console.log('Found successful Jupiter transaction:', txId);
              
              // Get the input token from global storage with multiple fallbacks
              const inputToken = window.__jupiterInputToken || 
                                 localStorage.getItem('jupiterInputToken') || 
                                 (window.getRecentJupiterTokens && window.getRecentJupiterTokens()[0]);
              
              console.log('🔍 Found token for transaction:', inputToken);
              
              return { 
                success: true, 
                txId, 
                element: swapSuccessful,
                inputToken: inputToken || (window.getRecentJupiterTokens && window.getRecentJupiterTokens()[0])
              };
            }
          }
        }
      }
      
      // No success detected
      return { success: false };
    } catch (error) {
      console.error('Error checking for Jupiter success:', error);
      return { success: false, error };
    }
  };
}

// Global transaction monitoring system - only initialize once
if (typeof window !== 'undefined' && !window.__jupiterListenerAttached) {
  console.log('Setting up global Jupiter transaction listener');
  window.__jupiterListenerAttached = true;
  
  // Keep track of processed transactions to avoid duplicates
  window.__processedTransactions = new Set();
  
  // Global function to process Jupiter transactions
  window.captureJupiterTransaction = async (txid, tokenMint) => {
    try {
      console.log(`⏳ Processing Jupiter transaction: ${txid} with token: ${tokenMint}`);
      
      // Skip if already processed
      if (window.__jupiterProcessedTxs && window.__jupiterProcessedTxs.has(txid)) {
        console.log(`🔄 Transaction ${txid} already processed, skipping.`);
        return;
      }
      
      // Add to processed set
      window.__jupiterProcessedTxs.add(txid);
      console.log(`✅ Added ${txid} to processed transactions set`);
      
      // Get wallet address from available providers
      let walletAddress;
      
      // Try to get from Solana wallet provider
      if (window.solana && window.solana.publicKey) {
        walletAddress = window.solana.publicKey.toString();
        console.log(`📍 Got wallet address from window.solana: ${walletAddress}`);
      } 
      // Try to get from Phantom wallet if available
      else if (window.phantom?.solana?.publicKey) {
        walletAddress = window.phantom.solana.publicKey.toString();
        console.log(`📍 Got wallet address from window.phantom: ${walletAddress}`);
      }
      // Try from localStorage as fallback
      else {
        walletAddress = localStorage.getItem('connectedWallet') || '';
        console.log(`📍 Got wallet address from localStorage: ${walletAddress || '[none]'}`);
      }
      
      // Add a fallback for testing if needed
      if (!walletAddress) {
        console.warn('No wallet address found, using placeholder for testing');
        walletAddress = 'test-wallet-' + Date.now();
        console.log(`📍 Using fallback wallet address: ${walletAddress}`);
      }
      
      console.log(`🔷 Making API call with: txid=${txid}, token=${tokenMint}, wallet=${walletAddress}`);
      
      // Call API to record achievement
      try {
        const response = await fetch('/api/jupiter/capture-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            txid: txid,
            token_address: tokenMint,
            wallet_address: walletAddress
          }),
        });
        
        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('API response:', responseText);
        
        // Handle JSON parsing separately
        if (!response.ok) {
          throw new Error(`API error: ${response.status} - ${responseText}`);
        }
        
        const data = JSON.parse(responseText);
        console.log('🎯 Successfully recorded Jupiter swap achievement:', data);
        
        // Optionally, display a success notification
        if (window.showNotification) {
          window.showNotification('Achievement unlocked: Jupiter swap completed!', 'success');
        }
        
        return data; // Return data for promise resolution
        
      } catch (error) {
        console.error('❌ Error with API call:', error);
        throw error; // Re-throw to be caught by outer try/catch
      }
    } catch (error) {
      console.error('❌ Error recording Jupiter swap achievement:', error);
      throw error; // Re-throw so the promise rejects properly
    }
  };

  setTimeout(() => {
    console.log('Setting up GLOBAL Jupiter DOM observer');
    
    // Create a mutation observer to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some(mutation => 
        mutation.addedNodes && mutation.addedNodes.length > 0
      );
      
      if (hasAddedNodes) {
        console.log('DOM changes detected, checking for Jupiter success');
        const result = window.checkForSuccessElement();
        
        if (result && result.success) {
          console.log('Jupiter transaction detected via DOM observation:', result.txId);
          
          // Get input token with multiple fallbacks
          const inputToken = result.inputToken || 
                             window.__jupiterInputToken || 
                             (window.getRecentJupiterTokens()[0]);
                             
          if (inputToken) {
            console.log('🔶 Capturing transaction with token:', inputToken);
            window.captureJupiterTransaction(result.txId, inputToken);
          } else {
            console.warn('⚠️ No input token was found for Jupiter transaction');
          }
        }
      }
    });
    
    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    console.log('Global Jupiter DOM observer started');
    
    // Additional interval check for transactions
    setInterval(() => {
      const result = window.checkForSuccessElement();
      if (result && result.success) {
        console.log('Jupiter transaction detected via polling:', result.txId);
        
        // Get the input token from our global storage or the result
        const inputToken = result.inputToken || window.__jupiterInputToken;
        if (inputToken) {
          window.captureJupiterTransaction(result.txId, inputToken);
        }
      }
    }, 1000);
  }, 2000);
}

// Store tokens that are being swapped with better tracking
if (typeof window !== 'undefined') {
  // Initialize token tracking map if it doesn't exist
  window.__jupiterTokenMap = window.__jupiterTokenMap || new Map();
  
  // Function to store token being swapped
  window.storeJupiterToken = function(tokenAddress) {
    console.log('🔶 Storing token for Jupiter tracking:', tokenAddress);
    // Store with timestamp to allow clean-up of old entries
    window.__jupiterTokenMap.set(Date.now(), tokenAddress);
    // Also keep the most recent token in a dedicated variable
    window.__jupiterInputToken = tokenAddress;
    // Store in localStorage as backup
    try {
      localStorage.setItem('jupiterInputToken', tokenAddress);
    } catch (e) {
      console.error('Failed to store token in localStorage', e);
    }
  };
  
  // Function to get the most recent tokens (within last 60 seconds)
  window.getRecentJupiterTokens = function() {
    const tokens = [];
    const now = Date.now();
    // Clean up old entries and collect recent ones
    for (const [timestamp, token] of window.__jupiterTokenMap.entries()) {
      // If token was stored more than 60 seconds ago, remove it
      if (now - timestamp > 60000) {
        window.__jupiterTokenMap.delete(timestamp);
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  };
}

// Add this near the top of your window object initialization
window.__jupiterProcessedTxs = new Set();

// Add at the beginning of your component, outside of any hooks
const INTERVAL_CHECKERS = new Map();

export function SolanaTokenList({ tokens, category }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Calculate pagination
  const indexOfLastToken = currentPage * itemsPerPage;
  const indexOfFirstToken = indexOfLastToken - itemsPerPage;
  const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
  const totalPages = Math.ceil(tokens.length / itemsPerPage);

  return (
    <div>
      {/* Token grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {currentTokens.map((token) => (
          <SolanaTokenCard 
            key={token.token_address} 
            token={token} 
            category={category}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-green-500/30 disabled:opacity-50 
                     disabled:cursor-not-allowed hover:bg-green-500/10 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-green-500">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-green-500/30 disabled:opacity-50 
                     disabled:cursor-not-allowed hover:bg-green-500/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function SolanaTokenCard({ token, category }) {
  // Instead of using the wallet context directly, check if it's available
  const wallet = typeof window !== 'undefined' ? 
    window.solana : null; // Access Phantom or other injected wallets
  
  // Define formatting functions first
  const formatVolume = (vol) => {
    if (!vol) return '$0';
    const num = parseFloat(vol);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = React.useCallback((num, decimals = 2) => {
    if (!num) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 24 * 30) return `${Math.floor(diffHours/24)}d ago`;
    if (diffHours < 24 * 365) return `${Math.floor(diffHours/(24 * 30))}mo ago`;
    return `${Math.floor(diffHours/(24 * 365))}y ago`;
  };

  const getVolumeEmoji = (volume) => {
    const vol = parseFloat(volume);
    if (!vol) return '';
    if (vol >= 1e7) return '🔥'; // Over 10M
    if (vol >= 5e6) return '⚡'; // Over 5M
    if (vol >= 1e6) return '💫'; // Over 1M
    if (vol >= 5e5) return '✨'; // Over 500K
    return '';
  };

  const getCategoryEmoji = (category) => {
    switch (category?.toLowerCase()) {
      case 'meme': return '🎭';
      case 'major': return '💎';
      case 'vc': return '🏢';
      default: return '';
    }
  };

  const getLegitimacyScoreColor = (score) => {
    score = parseInt(score) || 0;  // Ensure we have a number
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formattedValues = React.useMemo(() => ({
    volume: formatVolume(token.volume_24h),
    trades: formatNumber(token.trades_24h, 0),
    holders: formatNumber(token.total_accounts, 0),
    created: formatDate(token.created_at),
    volumeEmoji: getVolumeEmoji(token.volume_24h),
    categoryEmoji: getCategoryEmoji(category)
  }), [token.volume_24h, token.trades_24h, token.total_accounts, token.created_at, category, formatNumber]);

  const [showJupiter, setShowJupiter] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store the token address for tracking
      if (token?.token_address) {
        window.__selectedInputToken = token.token_address;
        console.log('Stored token address for Jupiter tracking:', token.token_address);
      }
    }
  }, [token]);

  const handleClick = useCallback(() => {
    if (typeof window !== 'undefined' && window.Jupiter) {
      try {
        // Store the token address in our global tracking system
        if (window.storeJupiterToken) {
          window.storeJupiterToken(token.token_address);
          console.log('💾 Saved token address for Jupiter tracking:', token.token_address);
        }
        
        // Store token in the component state as well
        setSelectedToken(token);
        
        // Open Jupiter as usual...
        window.Jupiter.init({
          endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
          displayMode: "modal",
          defaultExplorer: "Solana Explorer",
          strictTokenList: false,
          formProps: {
            // Set default input as SOL
            initialInputMint: "So11111111111111111111111111111111111111112", // SOL
            fixedInputMint: false, // Allow changing input token

            // Set clicked token as output
            initialOutputMint: token.token_address,
            fixedOutputMint: false, // Allow changing output token

            // Default to ExactIn mode
            swapMode: "ExactIn"
          },
          onSuccess: function(data) {
            console.log('Jupiter swap successful!', data);
            
            const txid = data.txid || (data.swapResult && data.swapResult.txid);
            if (txid) {
              console.log('Recording transaction:', txid, 'for token:', token.token_address);
              
              // Get wallet address
              const walletAddress = (typeof window !== 'undefined' && 
                window.solana && 
                window.solana.publicKey) ? 
                window.solana.publicKey.toString() : 
                localStorage.getItem('connectedWallet') || '';
              
              // Call the global capture function
              if (window.captureJupiterTransaction) {
                window.captureJupiterTransaction(txid, token.token_address);
              }
            }
          }
        });
      } catch (error) {
        console.error('Failed to open Jupiter Terminal:', error);
      }
    }
  }, [token]);

  // Initialize the global Jupiter transaction tracking system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize the set to track processed transactions
      window.__jupiterProcessedTxs = window.__jupiterProcessedTxs || new Set();
      
      // Define the captureJupiterTransaction function on the window object
      window.captureJupiterTransaction = async (txid, tokenMint) => {
        try {
          console.log(`⏳ Processing Jupiter transaction: ${txid} with token: ${tokenMint}`);
          
          // Skip if already processed
          if (window.__jupiterProcessedTxs && window.__jupiterProcessedTxs.has(txid)) {
            console.log(`🔄 Transaction ${txid} already processed, skipping.`);
            return;
          }
          
          // Add to processed set
          window.__jupiterProcessedTxs.add(txid);
          console.log(`✅ Added ${txid} to processed transactions set`);
          
          // Get wallet address from available providers
          let walletAddress;
          
          // Try to get from Solana wallet provider
          if (window.solana && window.solana.publicKey) {
            walletAddress = window.solana.publicKey.toString();
          } 
          // Try to get from Phantom wallet if available
          else if (window.phantom?.solana?.publicKey) {
            walletAddress = window.phantom.solana.publicKey.toString();
          }
          // Try from localStorage as fallback
          else {
            walletAddress = localStorage.getItem('connectedWallet') || '';
          }
          
          // Add a fallback for testing if needed
          if (!walletAddress) {
            console.warn('No wallet address found, using placeholder for testing');
            walletAddress = 'test-wallet-' + Date.now();
          }
          
          // Call API to record achievement
          const response = await fetch('/api/jupiter/capture-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txid: txid,
              token_address: tokenMint,
              wallet_address: walletAddress
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('🎯 Successfully recorded Jupiter swap achievement:', data);
          
          // Optionally, display a success notification
          if (window.showNotification) {
            window.showNotification('Achievement unlocked: Jupiter swap completed!', 'success');
          }
        } catch (error) {
          console.error('❌ Error recording Jupiter swap achievement:', error);
        }
      };
      
      console.log('✨ Global Jupiter transaction capture function initialized');
    }
  }, []);

  // Then modify your useEffect to check this Map
  useEffect(() => {
    // Skip if this token already has an interval checker
    if (token && token.token_address && INTERVAL_CHECKERS.has(token.token_address)) {
      console.log(`⏭️ Skipping interval setup for ${token.token_address} - already exists`);
      return;
    }

    console.log('Setting up Jupiter success interval checker');
    
    // Initialize transaction processing set if it doesn't exist
    if (!window.__jupiterProcessedTxs) {
      window.__jupiterProcessedTxs = new Set();
    }
    
    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        // Use the global function here
        const result = window.checkForSuccessElement && window.checkForSuccessElement();
        
        if (result && result.success) {
          console.log(`Found successful Jupiter transaction: ${result.txId}`);
          
          // Check if we've already processed this transaction
          if (window.__jupiterProcessedTxs.has(result.txId)) {
            console.log(`🔄 Transaction ${result.txId} already processed, skipping.`);
            return;
          }
          
          // Mark this transaction as being processed to prevent duplicates
          window.__jupiterProcessedTxs.add(result.txId);
          
          console.log(`🚀 Processing transaction ${result.txId} with token ${token.token_address}`);
          
          // Only call captureJupiterTransaction if it exists
          if (window.captureJupiterTransaction) {
            window.captureJupiterTransaction(result.txId, token.token_address)
              .then(() => {
                console.log(`✅ Successfully processed Jupiter transaction: ${result.txId}`);
              })
              .catch(error => {
                console.error(`❌ Error processing Jupiter transaction: ${result.txId}`, error);
                // Remove from processed set if there was an error so we can retry
                window.__jupiterProcessedTxs.delete(result.txId);
              });
          } else {
            console.error('❌ captureJupiterTransaction function not available');
            // Allow retry if the function wasn't available
            window.__jupiterProcessedTxs.delete(result.txId);
          }
        }
      }, 1000);
      
      // Store the interval ID in our map to prevent duplicates
      if (token && token.token_address) {
        INTERVAL_CHECKERS.set(token.token_address, intervalId);
      }
      
      return () => {
        clearInterval(intervalId);
        // Remove from our map when unmounting
        if (token && token.token_address) {
          INTERVAL_CHECKERS.delete(token.token_address);
        }
      };
    }, 2000);
    
    return () => {
      clearTimeout(timeoutId);
      // Clean up the interval if it exists when unmounting
      if (token && token.token_address && INTERVAL_CHECKERS.has(token.token_address)) {
        clearInterval(INTERVAL_CHECKERS.get(token.token_address));
        INTERVAL_CHECKERS.delete(token.token_address);
      }
    };
  }, [token]);

  return (
    <div className="relative h-full">
      <GlowBorder className="h-full">
        <div 
          onClick={handleClick}
          className="block p-4 h-full cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-green-500 flex items-center truncate">
                <span className="truncate">{token.name || 'Unknown Token'}</span>
                <span className="ml-2 flex-shrink-0">{formattedValues.categoryEmoji}</span>
              </h3>
              <div className="text-sm text-green-500/70 flex items-center gap-2">
                <span className="truncate">{token.symbol}</span>
                {category && (
                  <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 flex-shrink-0">
                    {category}
                  </span>
                )}
              </div>
              {token.legitimacyScore && (
                <div className="mt-1 group relative inline-block">
                  <span className="text-green-500/50 text-sm font-mono">
                    Trust Score: <span className={`${getLegitimacyScoreColor(token.legitimacyScore)} cursor-help`}>
                      {token.legitimacyScore}%
                    </span>
                  </span>
                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-72 bg-black/95 border border-green-500/30 rounded-lg text-sm text-green-500/90 z-10 shadow-xl backdrop-blur-sm">
                    {token.hasDuplicates && token.duplicateCount > 0 && (
                      <div className="text-yellow-500 text-xs mb-2">
                        ⚠️ {token.duplicateCount} similar {token.duplicateCount === 1 ? 'token was' : 'tokens were'} found
                      </div>
                    )}
                    {token.legitimacyDetails && (
                      <div className="text-xs text-green-500/70">
                        {token.legitimacyDetails}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-green-500/20 text-xs text-yellow-500/70">
                      ⚠️ This score is an estimate and may be inaccurate.
                      <br />
                      Always do your own research (DYOR).
                      <br />
                      Not financial advice (NFA).
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black border-r border-b border-green-500/30"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-mono font-bold text-green-400">
                {formattedValues.volume}
                <span className="ml-2">{formattedValues.volumeEmoji}</span>
              </div>
              <div className="text-xs text-green-500/50">
                24h Volume
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-500/50">Trades (24h)</div>
              <div className="font-mono text-green-400">
                {formattedValues.trades}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Holders</div>
              <div className="font-mono text-green-400">
                {formattedValues.holders}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Created</div>
              <div className="font-mono text-green-400">
                {formattedValues.created}
              </div>
            </div>
          </div>
        </div>
      </GlowBorder>
    </div>
  );
}

function openJupiterTerminal(tokenAddress) {
  console.log('Opening Jupiter Terminal for token:', tokenAddress);
  
  // Store the token address in all possible locations for redundancy
  window.__selectedInputToken = tokenAddress;
  localStorage.setItem('lastTokenAddress', tokenAddress);
  localStorage.setItem('walletAddress', window.solana?.publicKey?.toString() || '');
  
  // Safely inject our transaction listener with a delay
  setTimeout(() => {
    try {
      injectJupiterTransactionListener();
    } catch (e) {
      console.error('Error injecting transaction listener:', e);
    }
  }, 500);
  
  // Setup Jupiter Terminal with proper callback
  if (window.Jupiter) {
    window.Jupiter.init({
      endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
      displayMode: "modal",
      defaultExplorer: "Solana Explorer",
      strictTokenList: false,
      formProps: {
        initialInputMint: tokenAddress,
        fixedInputMint: true,
        initialOutputMint: "So11111111111111111111111111111111111111112", // SOL
        fixedOutputMint: false,
        swapMode: "ExactIn",
        slippageBps: 100, // 1% slippage tolerance
      },
      // Ensure our onSuccess callback captures the token address
      onSuccess: function(data) {
        console.log('Jupiter swap successful!', data);
        
        const txid = data.txid || (data.swapResult && data.swapResult.txid);
        if (txid) {
          console.log('Recording transaction:', txid, 'for token:', tokenAddress);
          
          // Get wallet address
          const walletAddress = (typeof window !== 'undefined' && 
            window.solana && 
            window.solana.publicKey) ? 
            window.solana.publicKey.toString() : 
            localStorage.getItem('connectedWallet') || '';
          
          // Call the global capture function
          window.captureJupiterTransaction(txid, tokenAddress);
          
          // Also directly record as a backup
          try {
            recordJupiterSwap({
              walletAddress: walletAddress,
              txid: txid,
              inputMint: tokenAddress
            });
          } catch (error) {
            console.error('Error recording Jupiter swap:', error);
          }
        }
      }
    });
  } else {
    console.error('Jupiter is not available');
  }
}

if (typeof window !== 'undefined') {
  window.__storedTokenAddresses = window.__storedTokenAddresses || [];
  
  // Function to track token addresses
  const trackTokenAddress = (address) => {
    if (address && !window.__storedTokenAddresses.includes(address)) {
      window.__storedTokenAddresses.push(address);
      console.log('Stored token address for Jupiter tracking:', address);
    }
  };
  
  // Add your token addresses here
  trackTokenAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  trackTokenAddress('So11111111111111111111111111111111111111112'); // SOL wrapped
  // Add other tokens as needed
} 