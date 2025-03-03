'use client';

import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import styles from './trades.module.css';

export default function TradesDashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useDynamicContext();
  
  const fetchTrades = async () => {
    setLoading(true);
    try {
      // If user is logged in, fetch their trades
      const walletParam = user?.wallet?.address ? 
        `?wallet_address=${user.wallet.address}` : '';
      
      const response = await fetch(`/api/trades/list${walletParam}`);
      const data = await response.json();
      
      if (data.success) {
        setTrades(data.trades);
        setError(null);
      } else {
        setError(data.error || 'Failed to load trades');
      }
    } catch (err) {
      setError('Error loading trades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTrades();
    
    // Refresh trades every 30 seconds
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, [user?.wallet?.address]);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Jupiter Trades</h1>
      
      <div className={styles.refreshSection}>
        <button onClick={fetchTrades} disabled={loading} className={styles.refreshButton}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {trades.length > 0 ? (
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
              <div>
                <a 
                  href={`https://solscan.io/tx/${trade.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewButton}
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noTrades}>
          {loading ? 'Loading trades...' : 'No trades recorded yet.'}
        </div>
      )}
    </div>
  );
} 