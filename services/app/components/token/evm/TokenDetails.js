export function TokenDetails({ tokenDetails, address, tokenState }) {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-4">
      <div className="flex flex-col gap-4">
        {(tokenDetails?.website || tokenDetails?.twitter || tokenDetails?.telegram || tokenDetails?.warpcast_url) && (
          <div>
            <div className="text-sm text-green-500/50 mb-2">Socials</div>
            <div className="flex gap-3">
              {tokenDetails?.website && (
                <a
                  href={tokenDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500/70 hover:text-green-500 transition-colors"
                  title="Website"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
              
              {tokenDetails?.twitter && (
                <a
                  href={tokenDetails.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500/70 hover:text-green-500 transition-colors"
                  title="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              
              {tokenDetails?.telegram && (
                <a
                  href={tokenDetails.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500/70 hover:text-green-500 transition-colors"
                  title="Telegram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              )}
              
              {tokenDetails?.warpcast_url && (
                <a
                  href={tokenDetails.warpcast_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500/70 hover:text-green-500 transition-colors"
                  title="Warpcast"
                >
                  <img 
                    src="/warpcast.png" 
                    alt="Warpcast"
                    className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              )}
            </div>
          </div>
        )}

        {tokenDetails?.description && (
          <div>
            <div className="text-sm text-green-500/50 mb-2">Description</div>
            <p className="text-green-500/80 leading-relaxed mb-3">
              {tokenDetails.description}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(address);
            }}
            className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
          >
            <span>Copy Address</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {tokenState?.marketType === 1 && (
            <a
              href={`https://dexscreener.com/base/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
            >
              <span>DexScreener</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          <a
            href={`https://basescan.org/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
          >
            <span>Basescan</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 