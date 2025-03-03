'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import styles from './trades.module.css';
import Link from 'next/link';

export default function TradesDashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false
  });
  const [walletFilter, setWalletFilter] = useState('');
  const { user } = useDynamicContext();
  
  const fetchTrades = useCallback(async (resetOffset = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset offset if requested (for new searches)
      const offset = resetOffset ? 0 : pagination.offset;
      
      // Build URL with pagination and filter params
      const url = new URL('/api/trades', window.location.origin);
      url.searchParams.set('limit', pagination.limit.toString());
      url.searchParams.set('offset', offset.toString());
      
      if (walletFilter) {
        url.searchParams.set('wallet_address', walletFilter);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trades');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTrades(resetOffset ? data.data : [...trades, ...data.data]);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Unknown error fetching trades');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.offset, walletFilter, trades]);

  // Initial data fetch
  useEffect(() => {
    fetchTrades(true);
  }, []);
  
  const handleLoadMore = () => {
    // Update offset and fetch more
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
    fetchTrades(false);
  };
  
  const handleWalletFilterChange = (e) => {
    setWalletFilter(e.target.value);
  };
  
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTrades(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Jupiter Trades</h1>
      
      <div className={styles.filterSection}>
        <form onSubmit={handleFilterSubmit} className={styles.filterForm}>
          <input
            type="text"
            placeholder="Filter by wallet address"
            value={walletFilter}
            onChange={handleWalletFilterChange}
            className={styles.filterInput}
          />
          <button type="submit" className={styles.filterButton}>
            Filter
          </button>
          {walletFilter && (
            <button 
              type="button" 
              onClick={() => { setWalletFilter(''); fetchTrades(true); }}
              className={styles.clearButton}
            >
              Clear
            </button>
          )}
        </form>
      </div>
      
      <div className={styles.refreshSection}>
        <button onClick={() => fetchTrades(true)} disabled={loading} className={styles.refreshButton}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {trades.length > 0 ? (
        <>
          <div className={styles.tradesTable}>
            <div className={styles.tableHeader}>
              <div>ID</div>
              <div>Wallet</div>
              <div>Tokens</div>
              <div>Amounts</div>
              <div>Time</div>
              <div>Actions</div>
            </div>
            
            {trades.map(trade => (
              <div key={trade.id} className={styles.tableRow}>
                <div>{trade.id}</div>
                <div className={styles.wallet}>
                  {trade.wallet_address.slice(0, 4)}...{trade.wallet_address.slice(-4)}
                </div>
                <div className={styles.tokens}>
                  <div className={styles.tokenAddress}>
                    {trade.token_in.slice(0, 4)}...{trade.token_in.slice(-4)}
                  </div>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.tokenAddress}>
                    {trade.token_out.slice(0, 4)}...{trade.token_out.slice(-4)}
                  </div>
                </div>
                <div className={styles.amounts}>
                  <div>{parseFloat(trade.amount_in).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                  <div className={styles.arrow}>→</div>
                  <div>{parseFloat(trade.amount_out).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                </div>
                <div className={styles.time}>
                  {new Date(trade.created_at).toLocaleString()}
                </div>
                <div className={styles.actions}>
                  <Link 
                    href={`https://solscan.io/tx/${trade.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionLink}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.hasMore && (
            <div className={styles.loadMoreContainer}>
              <button 
                onClick={handleLoadMore} 
                disabled={loading}
                className={styles.loadMoreButton}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noTrades}>
          {loading ? 'Loading trades...' : 'No trades found'}
        </div>
      )}
    </div>
  );
} 