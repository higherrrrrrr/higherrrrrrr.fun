import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self' https://*.dynamicauth.com https://*.dynamic-static-assets.com https://*.jup.ag",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.posthog.com https://*.dynamicauth.com https://*.dynamic-static-assets.com https://embed.twitch.tv https://*.jup.ag",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.jup.ag",
      "img-src 'self' data: https: http:",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://*.dynamicauth.com https://*.dynamic-static-assets.com https://*.posthog.com https://*.helius-rpc.com wss://*.solana.com https://*.jup.ag",
      "frame-src 'self' https://verify.walletconnect.com https://*.dynamicauth.com https://*.jup.ag"
    ].join('; ')
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
} 