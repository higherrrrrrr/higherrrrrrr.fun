import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // Generate a nonce for scripts
  const nonce = Buffer.from(Math.random().toString()).toString('base64')

  return (
    <Html>
      <Head nonce={nonce}>
        {/* Disable CSP in development */}
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws:;" />
        {/* Allow eval */}
        <meta httpEquiv="X-Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws:;" />
        {/* Legacy browsers */}
        <meta httpEquiv="X-WebKit-CSP" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws:;" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  )
}