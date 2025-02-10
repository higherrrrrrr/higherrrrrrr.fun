import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { higherrrrrrrAbi } from '@/onchain/generated';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://rpc.higherrrrrrr.fun/')
});

export async function GET(request: Request, { params }: { params: { address: string } }) {
  const { address } = params;
  
  try {
    const creator = await publicClient.readContract({
      address: address.toLowerCase() as `0x${string}`,
      abi: higherrrrrrrAbi,
      functionName: 'bondingCurve'
    });

    return NextResponse.json({ creator });
  } catch (error) {
    console.error('Failed to fetch token creator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token creator' },
      { status: 500 }
    );
  }
} 