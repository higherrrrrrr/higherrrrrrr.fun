export default function TokenScreenerSkeleton() {
  return (
    <div className="bg-black border border-green-500/30 rounded-lg p-6 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between py-4 border-t border-green-500/10">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-green-500/20 rounded"></div>
              <div>
                <div className="h-5 w-24 bg-green-500/20 rounded mb-2"></div>
                <div className="h-4 w-32 bg-green-500/10 rounded"></div>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="h-6 w-20 bg-green-500/20 rounded"></div>
              <div className="h-6 w-24 bg-green-500/20 rounded"></div>
              <div className="h-6 w-28 bg-green-500/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 