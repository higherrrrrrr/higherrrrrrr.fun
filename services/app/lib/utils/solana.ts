import { PublicKey } from '@solana/web3.js';
import { connection } from '../solana';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex, NftWithToken } from '@metaplex-foundation/js';
import { TokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { toast } from 'react-hot-toast';

const metaplex = new Metaplex(connection);

// Add retry logic with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Operation failed after retries:', error);
        toast.error('Failed to fetch data');
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
    }
  }
  return null;
}

export async function getTokenMetadata(tokenAddress: string) {
  return retryOperation(async () => {
    const mint = new PublicKey(tokenAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    
    return {
      name: nft.name,
      symbol: nft.symbol,
      image: nft.json?.image,
      description: nft.json?.description,
      attributes: nft.json?.attributes,
      externalUrl: nft.json?.external_url
    };
  });
}

export async function getTokenBalance(tokenAddress: string, walletAddress: string) {
  try {
    const mint = new PublicKey(tokenAddress);
    const owner = new PublicKey(walletAddress);
    
    const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokenAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === tokenAddress
    );

    return tokenAccount ? tokenAccount.account.data.parsed.info.tokenAmount : null;
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return null;
  }
}

export async function getTokenSupply(tokenAddress: string) {
  try {
    const mint = new PublicKey(tokenAddress);
    const supply = await connection.getTokenSupply(mint);
    return supply.value;
  } catch (error) {
    console.error('Failed to get token supply:', error);
    return null;
  }
}

export async function getTokenHolders(tokenAddress: string) {
  try {
    const mint = new PublicKey(tokenAddress);
    const accounts = await connection.getTokenLargestAccounts(mint);
    return accounts.value.length;
  } catch (error) {
    console.error('Failed to get token holders:', error);
    return 0;
  }
} 