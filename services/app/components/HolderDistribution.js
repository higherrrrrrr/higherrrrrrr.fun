'use client';
import { useState } from 'react';

export default function HolderDistribution({ holders, totalSupply }) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate distribution percentages
  const getDistributionData = () => {
    const total = holders.reduce((sum, h) => sum + Number(h.amount), 0);
    
    // Group holders by size
    const whales = holders.filter(h => (h.amount / totalSupply) > 0.01); // >1%
    const medium = holders.filter(h => (h.amount / totalSupply) <= 0.01 && (h.amount / totalSupply) > 0.001);
    const small = holders.filter(h => (h.amount / totalSupply) <= 0.001);

    return {
      whales: {
        count: whales.length,
        percentage: (whales.reduce((sum, h) => sum + Number(h.amount), 0) / total) * 100
      },
      medium: {
        count: medium.length,
        percentage: (medium.reduce((sum, h) => sum + Number(h.amount), 0) / total) * 100
      },
      small: {
        count: small.length,
        percentage: (small.reduce((sum, h) => sum + Number(h.amount), 0) / total) * 100
      }
    };
  };

  const distribution = getDistributionData();

  return (
    <div className="relative">
      {/* Distribution Bar */}
      <div 
        className="h-2 w-full bg-gray-800 rounded-full overflow-hidden cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex h-full">
          <div 
            className="bg-red-500 h-full transition-all"
            style={{ width: `${distribution.whales.percentage}%` }}
          />
          <div 
            className="bg-yellow-500 h-full transition-all"
            style={{ width: `${distribution.medium.percentage}%` }}
          />
          <div 
            className="bg-green-500 h-full transition-all"
            style={{ width: `${distribution.small.percentage}%` }}
          />
        </div>
      </div>

      {/* Details Popup */}
      {showDetails && (
        <div className="absolute z-10 mt-2 p-4 bg-black border border-green-500/30 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                Whales ({distribution.whales.count})
              </span>
              <span>{distribution.whales.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                Medium ({distribution.medium.count})
              </span>
              <span>{distribution.medium.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                Small ({distribution.small.count})
              </span>
              <span>{distribution.small.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-green-500/70">
            Total Holders: {holders.length}
          </div>
        </div>
      )}
    </div>
  );
} 