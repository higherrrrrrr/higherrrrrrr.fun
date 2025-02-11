import { getProgressToNextLevel } from '../../utils/token';

export function TokenProgress({ tokenState }) {
  const getCurrentLevelIndex = (tokenState) => {
    if (!tokenState?.priceLevels || !tokenState?.currentPrice) return -1;
    const currentPrice = parseFloat(tokenState.currentPrice);
    
    return tokenState.priceLevels.reduce((highestIndex, level, index) => {
      const levelPrice = parseFloat(level.price);
      return currentPrice >= levelPrice ? index : highestIndex;
    }, -1);
  };

  return (
    <>
      <div className="text-center py-12">
        <div className="text-sm text-green-500/50 mb-4">Current Name</div>
        <div className="text-xl md:text-7xl font-bold mb-6 break-words max-w-[90vw] mx-auto">
          {tokenState.currentName || 'Loading...'}
        </div>
        <div className="text-lg md:text-xl text-green-500/70">
          Level {getCurrentLevelIndex(tokenState) + 1} of {tokenState.priceLevels?.length || 0}
        </div>
      </div>

      {tokenState.marketType === 'BONDING_CURVE' && parseFloat(tokenState.totalSupply) < tokenState.maxSupply && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bonding Curve Progress</span>
            <span>
              {((parseFloat(tokenState.totalSupply) / tokenState.maxSupply) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-green-500/20 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ 
                width: `${(parseFloat(tokenState.totalSupply) / tokenState.maxSupply * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress to Next Level</span>
          <span>{getProgressToNextLevel(tokenState).toFixed(2)}%</span>
        </div>
        <div className="w-full bg-green-500/20 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all"
            style={{ width: `${getProgressToNextLevel(tokenState)}%` }}
          />
        </div>
      </div>
    </>
  );
} 