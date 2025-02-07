import { formatUsdPrice, formatMarketCap } from '../../../utils/format';

const MAX_SUPPLY = 1_000_000_000; // 1B tokens

export function TokenLevelsTable({ tokenState, ethPrice }) {
  return (
    <div className="border border-green-500/30 rounded-lg overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-green-500/30">
            <th className="p-4 text-left whitespace-nowrap">Level</th>
            <th className="p-4 text-left">
              <div className="max-w-[260px] truncate">Name</div>
            </th>
            <th className="p-4 text-right whitespace-nowrap">Price</th>
            <th className="p-4 text-right whitespace-nowrap">Market Cap</th>
            <th className="p-4 text-center whitespace-nowrap">State</th>
          </tr>
        </thead>
        <tbody>
          {tokenState.priceLevels.map((level, index) => {
            const levelUsdPrice = parseFloat(level.price) * ethPrice;
            const levelMarketCap = levelUsdPrice * MAX_SUPPLY;
            const currentPriceEth = parseFloat(tokenState.currentPrice);
            
            const nextLevel = tokenState.priceLevels[index + 1];
            const nextLevelPrice = nextLevel ? parseFloat(nextLevel.price) : Infinity;
            const isCurrentLevel = currentPriceEth >= parseFloat(level.price) && currentPriceEth < nextLevelPrice;
            
            const isAchieved = currentPriceEth >= parseFloat(level.price) && !isCurrentLevel;

            return (
              <tr key={index} className={`border-b border-green-500/10 ${isCurrentLevel ? 'bg-green-500/10' : ''}`}>
                <td className="p-4 whitespace-nowrap">{index + 1}</td>
                <td className="p-4">
                  <div className="max-w-[260px] truncate" title={level.name}>
                    {level.name}
                  </div>
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  {index === 0 ? (
                    'Free'
                  ) : (
                    `$${formatUsdPrice(levelUsdPrice)}`
                  )}
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  {index === 0 ? (
                    '-'
                  ) : (
                    formatMarketCap(levelMarketCap)
                  )}
                </td>
                <td className="p-4 text-center whitespace-nowrap">
                  {isCurrentLevel ? (
                    <span className="text-green-500">Current</span>
                  ) : isAchieved ? (
                    <span className="text-green-500/50">Achieved</span>
                  ) : (
                    <span className="text-green-500/30">Locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 