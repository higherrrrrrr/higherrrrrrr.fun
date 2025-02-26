/**
 * Records a Jupiter swap transaction and triggers achievement tracking
 * @param {string} walletAddress - User's wallet address
 * @param {string} txid - Transaction ID
 * @param {string} inputMint - Input token mint address
 * @param {string} outputMint - Output token mint address (optional)
 * @param {number} amount - Amount swapped (optional)
 * @returns {Promise<Object>} - API response
 */
export const recordJupiterSwap = async (data, retryCount = 3) => {
  try {
    console.log('Recording Jupiter swap with data:', data);
    
    // Validate required parameters
    if (!data.txid || !data.inputMint) {
      console.error('Missing required parameters for recordJupiterSwap:', data);
      return;
    }
    
    try {
      // Call both endpoints:
      // 1. Record the transaction
      const recordResponse = await fetch('/api/jupiter/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_hash: data.txid,
          input_token: data.inputMint,
          wallet_address: data.walletAddress || ''
        }),
      });
      
      const recordResult = await recordResponse.json();
      console.log('Swap recorded:', recordResult);
      
      // 2. Record achievement progress
      const achievementResponse = await fetch('/api/jupiter/capture-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txid: data.txid,
          token_address: data.inputMint,
          wallet_address: data.walletAddress || ''
        }),
      });
      
      const achievementResult = await achievementResponse.json();
      console.log('Achievement progress recorded:', achievementResult);
      
      return { transaction: recordResult, achievement: achievementResult };
    } catch (apiError) {
      // Add retry logic for network issues
      if (retryCount > 0) {
        console.log(`API error, retrying (${retryCount} attempts left)...`);
        const delay = Math.min(2000, 1000 * (3 - retryCount));
        await new Promise(resolve => setTimeout(resolve, delay));
        return recordJupiterSwap(data, retryCount - 1);
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error recording Jupiter swap:', error);
    // Don't throw, maintain original behavior
    return { error: error.message };
  }
};

/**
 * Sets up a global listener for Jupiter transactions
 */
export function setupGlobalJupiterListener() {
  if (typeof window === 'undefined') return;
  
  // Only set up once
  if (window.__jupiterListenerAttached) {
    console.log('Jupiter listener already attached, skipping setup');
    return;
  }
  
  console.log('Setting up global Jupiter transaction listener');
  window.__jupiterListenerAttached = true;
  window.__processedTransactions = new Set();
  
  // Add memory management - periodically clean old transactions
  const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const MAX_TRANSACTIONS = 500; // Cap the size of processed transactions
  
  window.__jupiterCleanupInterval = setInterval(() => {
    if (window.__processedTransactions.size > MAX_TRANSACTIONS) {
      console.log(`Cleaning up Jupiter transaction cache (${window.__processedTransactions.size} items)`);
      window.__processedTransactions = new Set(
        [...window.__processedTransactions].slice(-100) // Keep only the most recent 100
      );
    }
  }, CLEANUP_INTERVAL);
  
  // Global function to process Jupiter transactions
  window.captureJupiterTransaction = function(txid, inputMint) {
    // Skip if already processed
    if (window.__processedTransactions.has(txid)) {
      console.log('Transaction already processed, skipping:', txid);
      return;
    }
    
    window.__processedTransactions.add(txid);
    console.log('Processing Jupiter transaction:', txid, 'for token:', inputMint);
    
    // Retrieve connected wallet address
    const walletAddress = typeof window !== 'undefined' && 
      window.solana && 
      window.solana.publicKey ? 
      window.solana.publicKey.toString() : 
      localStorage.getItem('walletAddress');
    
    console.log('Current wallet for Jupiter transaction:', walletAddress);
    
    if (walletAddress && txid) {
      // Make the API call
      recordJupiterSwap({
        txid,
        inputMint,
        walletAddress
      })
        .then(result => {
          console.log('Jupiter swap recorded via global handler:', result);
        })
        .catch(error => {
          console.error('Error in global Jupiter swap handler:', error);
        });
    } else {
      console.warn('Missing wallet address or txid for Jupiter transaction');
    }
  };
  
  // Setup DOM observation for Jupiter transactions
  setupJupiterDOMObserver();
  
  // Also add network request interceptors as a fallback
  setupNetworkInterceptors();
}

/**
 * Sets up a DOM observer to detect Jupiter transactions in the UI
 */
function setupJupiterDOMObserver() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  console.log('Setting up Jupiter DOM observer');
  
  // Keep track of the last checked transaction to avoid duplicates
  let lastTxId = null;
  let lastCheckTime = 0;
  const DEBOUNCE_THRESHOLD = 250; // milliseconds
  
  // Function to extract transaction ID from explorer link
  const extractTxId = (url) => {
    try {
      if (!url) return null;
      const match = url.match(/\/tx\/([A-Za-z0-9]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting transaction ID:', error);
      return null;
    }
  };
  
  // Function to check for elements containing text
  const containsText = (elements, text) => {
    for (const el of elements) {
      if (el.textContent && el.textContent.includes(text)) {
        return el;
      }
    }
    return null;
  };
  
  // Function to check for success elements
  const checkForSuccessElement = () => {
    try {
      // Simple debouncing
      const now = Date.now();
      if (now - lastCheckTime < DEBOUNCE_THRESHOLD) {
        return { success: false, debounced: true };
      }
      lastCheckTime = now;
      
      // Check for any dialog with a View Transaction button
      const dialogs = document.querySelectorAll('div[role="dialog"]');
      for (const dialog of dialogs) {
        const buttons = dialog.querySelectorAll('button');
        const viewButton = containsText(buttons, 'View');
        
        if (viewButton) {
          // Look for an anchor tag with the transaction link
          const links = dialog.querySelectorAll('a');
          for (const link of links) {
            if (link.href && (link.href.includes('explorer.solana.com/tx/') || 
                link.href.includes('solscan.io/tx/'))) {
              const txId = extractTxId(link.href);
              if (txId && txId !== lastTxId) {
                lastTxId = txId;
                return { success: true, txId, element: dialog };
              }
            }
          }
        }
      }
      
      // Check for success messages
      const divs = document.querySelectorAll('div');
      
      // Look for "Transaction Successful" text
      const txSuccessful = containsText(divs, 'Transaction Successful');
      if (txSuccessful) {
        // Look for links to explorer
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.href && (link.href.includes('explorer.solana.com/tx/') || 
              link.href.includes('solscan.io/tx/'))) {
            const txId = extractTxId(link.href);
            if (txId && txId !== lastTxId) {
              lastTxId = txId;
              return { success: true, txId, element: txSuccessful };
            }
          }
        }
      }
      
      // Look for "Swap Successful" text
      const swapSuccessful = containsText(divs, 'Swap Successful');
      if (swapSuccessful) {
        // Look for links to explorer
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.href && (link.href.includes('explorer.solana.com/tx/') || 
              link.href.includes('solscan.io/tx/'))) {
            const txId = extractTxId(link.href);
            if (txId && txId !== lastTxId) {
              lastTxId = txId;
              return { success: true, txId, element: swapSuccessful };
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error checking for Jupiter success:', error);
    }
    
    return { success: false };
  };
  
  // Set up the observer with error handling
  try {
    const observer = new MutationObserver(() => {
      console.log('DOM changes detected, checking for Jupiter success');
      const result = checkForSuccessElement();
      
      if (result.success) {
        console.log('Found successful Jupiter transaction:', result.txId);
        
        // Get the input token from global storage with fallbacks
        const inputToken = window.__jupiterInputToken || 
                          localStorage.getItem('jupiterInputToken');
        
        if (inputToken) {
          console.log('Found token for Jupiter transaction:', inputToken);
          window.captureJupiterTransaction(result.txId, inputToken);
        } else {
          console.warn('No input token found for Jupiter transaction');
        }
      }
    });
    
    // Start observing document changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    console.log('Jupiter DOM observer started');
    
    // Also set up an interval check as a fallback, with reasonable interval
    const CHECK_INTERVAL = 3000; // 3 seconds
    window.__jupiterSuccessInterval = setInterval(() => {
      const result = checkForSuccessElement();
      if (result.success) {
        console.log('Found successful Jupiter transaction (interval check):', result.txId);
        
        const inputToken = window.__jupiterInputToken || 
                          localStorage.getItem('jupiterInputToken');
        
        if (inputToken) {
          console.log('Found token for Jupiter transaction:', inputToken);
          window.captureJupiterTransaction(result.txId, inputToken);
        }
      }
    }, CHECK_INTERVAL);
    
    // Add cleanup to prevent memory leaks
    window.addEventListener('beforeunload', () => {
      clearInterval(window.__jupiterSuccessInterval);
      clearInterval(window.__jupiterCleanupInterval);
      observer.disconnect();
    });
  } catch (err) {
    console.error('Error setting up Jupiter DOM observer:', err);
  }
}

/**
 * Sets up network request interceptors to detect Jupiter transactions 
 */
function setupNetworkInterceptors() {
  if (typeof window === 'undefined') return;
  
  // This function will be expanded in future updates to capture
  // network requests directly from Jupiter's API calls
}

/**
 * Store the current token for Jupiter integration
 * @param {string} tokenAddress - Token mint address
 */
export function storeJupiterInputToken(tokenAddress) {
  if (!tokenAddress) return;
  
  console.log('Stored token address for Jupiter tracking:', tokenAddress);
  
  if (typeof window !== 'undefined') {
    window.__jupiterInputToken = tokenAddress;
    localStorage.setItem('jupiterInputToken', tokenAddress);
  }
}
