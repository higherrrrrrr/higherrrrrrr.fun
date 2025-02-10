export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse max-w-7xl mx-auto px-4 py-8">
      {/* Tabs Skeleton */}
      <div className="flex space-x-8 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-green-500/10 rounded" />
        ))}
      </div>

      {/* Summary Skeleton */}
      <div className="bg-black border border-green-500/30 rounded-lg p-6 mb-6">
        <div className="h-8 w-48 bg-green-500/10 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-green-500/10 rounded mb-2" />
              <div className="h-8 w-24 bg-green-500/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-black border border-green-500/30 rounded-lg p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-6 w-24 bg-green-500/10 rounded" />
              <div className="h-6 w-16 bg-green-500/10 rounded" />
              <div className="h-6 w-20 bg-green-500/10 rounded" />
              <div className="h-6 w-24 bg-green-500/10 rounded" />
              <div className="h-6 w-20 bg-green-500/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 