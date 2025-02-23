'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { GlowBorder } from '../GlowBorder';
import { RetailTrade } from './RetailTrade';
import { getSplBalances, getNftsByOwner } from '../../utils/helius';
import { PortfolioChart } from './PortfolioChart';
import { debounce } from 'lodash';
import { PortfolioSwipe } from './PortfolioSwipe';

export function ClientPortfolioContent() {
  const { publicKey, toBase58, connect } = useWallet();
  const [splBalances, setSplBalances] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [activeTab, setActiveTab] = useState('tokens');
  const [selectedToken, setSelectedToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  const fetchPortfolioData = useCallback(
    debounce(async (walletAddress) => {
      try {
        setLoading(true);
        const [tokens, nftData] = await Promise.all([
          getSplBalances(walletAddress),
          getNftsByOwner(walletAddress)
        ]);
        setSplBalances(tokens);
        setNfts(nftData);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch portfolio data');
      } finally {
        setLoading(false);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (!publicKey) return;
    fetchPortfolioData(publicKey.toBase58());
  }, [publicKey, fetchPortfolioData]);

  useEffect(() => {
    if (!publicKey || !splBalances.length) return;

    const total = splBalances.reduce((acc, token) => {
      return acc + (token.usdValue || 0);
    }, 0);
    
    setTotalValue(total);

    fetch('/api/snapshot-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: publicKey.toBase58(),
        totalValue: total
      })
    }).catch(console.error);
  }, [publicKey, splBalances]);

  useEffect(() => {
    if (!publicKey) return;

    fetch(`/api/balance-history?wallet=${publicKey.toBase58()}`)
      .then(res => res.json())
      .then(data => {
        setHistoryData(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error('Failed to fetch history:', error);
        setHistoryData([]);
      });
  }, [publicKey]);

  if (!publicKey || loading) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono p-8">
        <div className="max-w-2xl mx-auto text-center">
          <GlowBorder className="p-8">
            <h2 className="text-2xl mb-4">
              {loading ? 'Loading Portfolio...' : 'Connect Your Wallet'}
            </h2>
            {!loading && (
              <button 
                onClick={() => connect()}
                className="bg-green-500 text-black px-4 py-2 rounded hover:bg-green-400"
              >
                Connect Wallet
              </button>
            )}
          </GlowBorder>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <div className="text-2xl text-green-400">
            ${totalValue.toFixed(2)}
          </div>
        </div>

        <GlowBorder className="p-4 mb-8">
          <h2 className="text-xl mb-4">7-Day History</h2>
          <PortfolioChart historyData={historyData} />
        </GlowBorder>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => {
              setActiveTab('tokens');
              setSelectedToken(null);
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'tokens' 
                ? 'bg-green-500/20 text-green-400' 
                : 'text-green-500/70 hover:text-green-400'
            }`}
          >
            Tokens
          </button>
          <button 
            onClick={() => {
              setActiveTab('nfts');
              setSelectedToken(null);
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'nfts' 
                ? 'bg-green-500/20 text-green-400' 
                : 'text-green-500/70 hover:text-green-400'
            }`}
          >
            NFTs
          </button>
        </div>

        {activeTab === 'tokens' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {splBalances.map((token) => (
              <GlowBorder key={token.mint} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center overflow-hidden">
                    {token.logoUrl ? (
                      <img 
                        src={token.logoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                        }}
                      />
                    ) : (
                      <span className="text-xs">{token.symbol?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold truncate" title={token.name || token.symbol}>
                      {token.name || token.symbol}
                    </div>
                    <div className="text-sm text-green-500/70 truncate">
                      ${token.amount} ({token.displayAmount} {token.symbol})
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedToken(token)}
                    className="px-3 py-1 bg-green-500/20 rounded hover:bg-green-500/30 text-green-400 whitespace-nowrap"
                  >
                    Trade
                  </button>
                </div>
              </GlowBorder>
            ))}
          </div>
        )}

        {selectedToken && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <RetailTrade 
                token={selectedToken} 
                onClose={() => setSelectedToken(null)}
              />
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nfts.map(nft => (
              <GlowBorder key={nft.mint} className="p-4">
                <img
                  src={nft.image || '/placeholder.png'}
                  alt={nft.name}
                  className="w-full aspect-square object-cover rounded mb-2"
                />
                <div className="font-bold truncate">{nft.name}</div>
              </GlowBorder>
            ))}
          </div>
        )}
      </div>
      <PortfolioSwipe />
    </div>
  );
} 