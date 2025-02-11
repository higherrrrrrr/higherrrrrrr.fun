/// get the balance of a token for a given address
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import config from '../../../config/config';

// Minimal ERC20 ABI - just what we need for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)'
];

export async function GET(request, { params }) {
  try {
    // Ensure params are properly awaited
    const userAddress = await params.userAddress;
    const tokenAddress = await params.tokenAddress;

    if (!tokenAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Missing token address or user address' },
        { status: 400 }
      );
    }

    // Set up provider using RPC URL from config
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    // Get balance
    const balance = await tokenContract.balanceOf(userAddress);
    
    return NextResponse.json({
      token_address: tokenAddress,
      user_address: userAddress,
      balance: balance.toString()
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
}