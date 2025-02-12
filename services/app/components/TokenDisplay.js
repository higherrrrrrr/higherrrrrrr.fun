import { useState, useEffect } from 'react';
import { SolanaTokenCard } from './SolanaTokenCard';

export function TokenDisplay({ tokens, category, isLoading, filterKey }) {
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 12;

  // Reset page only when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]); // filterKey changes only when filters change, not during pagination

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={`loading-${i}`} className="h-48 rounded-lg bg-green-500/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tokens?.length) {
    return (
      <div className="text-center py-8 text-green-500/50">
        No tokens found
      </div>
    );
  }

  // Calculate pagination
  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
  const totalPages = Math.ceil(tokens.length / tokensPerPage);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {currentTokens.map((token) => (
          <SolanaTokenCard
            key={token.token_address}
            token={token}
            category={token.category || category}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-green-500/10 text-green-500/50'
                : 'bg-green-500/20 hover:bg-green-500/30'
            }`}
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-green-500/70">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-green-500/10 text-green-500/50'
                : 'bg-green-500/20 hover:bg-green-500/30'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 