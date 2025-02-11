/// get the balance of a token for a given address
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import config from '../../../config/config';

// Standard ERC20 ABI with common functions
const ERC20_ABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  // Transfer functions
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  // Approval functions
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export async function GET(request, { params }) {
  const { userAddress: rawUserAddress, tokenAddress: rawTokenAddress } = await params;
  
  // Lowercase both addresses
  const tokenAddress = rawTokenAddress?.toLowerCase();
  const userAddress = rawUserAddress?.toLowerCase();
  
  try {
    if (!tokenAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Missing token address or user address' },
        { status: 400 }
      );
    }

    if (!config.RPC_URL) {
      return NextResponse.json(
        { error: 'RPC URL not configured' },
        { status: 500 }
      );
    }

    // Set up provider using RPC URL from config
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    
    // Create contract instance with the token address
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    try {

      const balance = await tokenContract.balanceOf(userAddress);
      
      return NextResponse.json({
        token_address: tokenAddress,
        user_address: userAddress,
        balance: balance.toString()
      });
    } catch (contractError) {
      console.error('Contract call error:', contractError);
      return NextResponse.json(
        { 
          error: 'Contract call failed',
          details: contractError.message,
          user_address: userAddress,
          token_address: tokenAddress
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch token balance',
        details: error.message,
        user_address: userAddress,
        token_address: tokenAddress
      },
      { status: 500 }
    );
  }
}