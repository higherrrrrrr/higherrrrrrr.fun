'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { TokenHeader } from './TokenHeader';
import { TokenDetails } from './TokenDetails';
import { TokenProgress } from './TokenProgress';
import { TokenChart } from './TokenChart';
import { TokenLevelsTable } from './TokenLevelsTable';
import TradeWidget from '../TradeWidget';
import { useTokenData } from '../../hooks/useTokenData';

export function TokenPage({ addressProp }) {
  const params = useParams();
  const address = addressProp || params.address;
  const { address: userAddress } = useAccount();
  
  const {
    tokenState,
    loading,
    userBalance,
    tokenDetails,
    isCreator,
    refreshTokenState
  } = useTokenData(address, userAddress);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-green-500 font-mono">Loading...</div>
      </div>
    );
  }

  if (!tokenState) {
    return <div className="text-red-500 font-mono">Token not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <TokenHeader 
        tokenState={tokenState}
        totalSupply={tokenState.totalSupply}
        isCreator={isCreator}
        address={address}
      />

      <TokenDetails 
        tokenDetails={tokenDetails}
        address={address}
        tokenState={tokenState}
      />

      <div className="border-b border-green-500/30" />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        <TokenProgress tokenState={tokenState} />

        {tokenState?.marketType === 'DEX' && tokenState?.poolAddress && (
          <TokenChart 
            poolAddress={tokenState.poolAddress}
            chain={tokenState.chain}
          />
        )}

        <TradeWidget 
          tokenState={tokenState}
          address={address}
          userBalance={userBalance}
          onTradeComplete={refreshTokenState}
        />

        <TokenLevelsTable tokenState={tokenState} />
      </div>
    </div>
  );
} 