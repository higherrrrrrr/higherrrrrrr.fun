import React from 'react';
import { GlowBorder } from './GlowBorder';

export function TransactionStatusModal({ status, progress = 0 }) {
  const getStatusContent = () => {
    switch (status) {
      case 'signing':
        return {
          title: 'Sign Transaction',
          message: 'Please sign the transaction in your wallet',
          emoji: '✍️'
        };
      case 'processing':
        return {
          title: 'Processing Transaction',
          message: 'Your transaction is being processed',
          emoji: '⚡'
        };
      case 'success':
        return {
          title: 'Transaction Success',
          message: 'Your transaction has been confirmed',
          emoji: '🫡'
        };
      default:
        return {
          title: 'Preparing Transaction',
          message: 'Getting things ready',
          emoji: '⚙️'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="w-full max-w-[340px]">
        <GlowBorder className="overflow-hidden rounded-2xl">
          <div className="bg-black p-6 rounded-2xl text-center">
            <div className="text-4xl mb-4">{content.emoji}</div>
            <h3 className="text-xl font-bold text-green-500 mb-2">
              {content.title}
            </h3>
            <p className="text-green-500/70 text-sm mb-6">
              {content.message}
            </p>
            
            {status !== 'success' && (
              <div className="w-full bg-green-500/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </GlowBorder>
      </div>
    </div>
  );
} 