import Link from 'next/link';
import { formatUsdPrice, formatMarketCap } from '../../../utils/format';

export function TokenHeader({ tokenState, ethPrice, totalSupply, isCreator, address }) {
  const priceInEth = parseFloat(tokenState.currentPrice);
  const usdPrice = priceInEth * ethPrice;
  const marketCapUsd = usdPrice * parseFloat(totalSupply);

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="text-xl md:text-2xl font-bold truncate max-w-[300px] md:max-w-[300px]">
                {tokenState.symbol}
              </div>
              {isCreator && (
                <Link 
                  href={`/token/${address}/edit`}
                  className="inline-flex items-center px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors text-sm"
                >
                  <span>Edit</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:flex md:space-x-8 gap-4">
            <div>
              <div className="text-sm text-green-500/50">Price</div>
              <div className="text-lg">
                ${formatUsdPrice(usdPrice)}
              </div>
            </div>
            <div>
              <div className="text-sm text-green-500/50">Market Cap</div>
              <div className="text-lg">
                {formatMarketCap(marketCapUsd)}
              </div>
            </div>
            <div>
              <div className="text-sm text-green-500/50">Supply</div>
              <div className="text-lg">
                {totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}
                <div className="text-sm text-green-500/70">
                  {((parseFloat(totalSupply) / 1_000_000_000) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 