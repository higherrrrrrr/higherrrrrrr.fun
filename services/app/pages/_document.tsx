import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content={`
          default-src 'self';
          connect-src 'self' ws: wss: https: http: localhost:*;
          script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: blob: localhost:*;
          style-src 'self' 'unsafe-inline' https: http:;
          img-src 'self' data: https: http: blob:;
          font-src 'self' data: https: http:;
          frame-src 'self' https: http:;
          worker-src 'self' blob:;
        `.replace(/\s+/g, ' ').trim()} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 