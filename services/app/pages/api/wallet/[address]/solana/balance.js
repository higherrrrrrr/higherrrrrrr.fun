import { Connection, PublicKey } from '@solana/web3.js';

// Ensure the RPC endpoint starts with https://
const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT?.startsWith('http')
  ? process.env.NEXT_PUBLIC_RPC_ENDPOINT
  : `https://${process.env.NEXT_PUBLIC_RPC_ENDPOINT}`;

const connection = new Connection(rpcEndpoint || 'https://api.mainnet-beta.solana.com');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).json({
      address,
      balance: balance / 1e9, // Convert lamports to SOL
      lamports: balance
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(500).json({
      error: 'Failed to fetch balance',
      details: error.message
    });
  }
} 