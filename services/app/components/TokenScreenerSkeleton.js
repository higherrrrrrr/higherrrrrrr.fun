export default function TokenScreenerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full grid grid-cols-6 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="col-span-6">
            <div className="border border-green-500/10 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                {/* Token Icon/Name */}
                <div className="w-10 h-10 bg-green-500/10 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-green-500/10 rounded w-24"></div>
                  <div className="h-3 bg-green-500/10 rounded w-16 mt-2"></div>
                </div>
                {/* NFT Level */}
                <div className="w-20">
                  <div className="h-4 bg-green-500/10 rounded"></div>
                  <div className="h-2 bg-green-500/10 rounded mt-2"></div>
                </div>
                {/* Price */}
                <div className="w-24">
                  <div className="h-4 bg-green-500/10 rounded"></div>
                  <div className="h-3 bg-green-500/10 rounded mt-2"></div>
                </div>
                {/* Volume */}
                <div className="w-24">
                  <div className="h-4 bg-green-500/10 rounded"></div>
                  <div className="h-3 bg-green-500/10 rounded mt-2"></div>
                </div>
                {/* Market Cap */}
                <div className="w-24">
                  <div className="h-4 bg-green-500/10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 