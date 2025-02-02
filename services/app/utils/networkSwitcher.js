import { ethers } from 'ethers';

const CHAIN_CONFIGS = {
  base: {
    chainId: '0x2105', // 8453 in hex
    chainName: 'Base',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  solana: {
    cluster: 'mainnet-beta',
    endpoint: 'https://api.mainnet-beta.solana.com'
  }
};

/**
 * Switches network in the connected wallet
 * @param {string} targetChain - The target chain identifier ('base' or 'solana')
 * @returns {Promise<boolean>} - Resolves true if network switching was successful
 */
export async function switchNetwork(targetChain) {
  if (targetChain === 'base') {
    if (window.ethereum) {
      try {
        // First try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_CONFIGS.base.chainId }],
        });
        console.log("Switched to Base network");
        return true;
      } catch (error) {
        // If the error code indicates the chain hasn't been added to MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CHAIN_CONFIGS.base],
            });
            return true;
          } catch (addError) {
            console.error("Error adding Base network:", addError);
            throw addError;
          }
        }
        console.error("Error switching to Base network:", error);
        throw error;
      }
    } else {
      throw new Error("No EVM provider found. Please install MetaMask or another EVM wallet.");
    }
  } else if (targetChain === 'solana') {
    // For Solana wallets, we can only prompt the user to switch manually
    alert("Please switch your wallet to the Solana network (mainnet-beta) manually.");
    return false;
  } else {
    throw new Error("Unsupported target chain. Supported values are 'base' and 'solana'.");
  }
} 