import Link from 'next/link';
import Head from 'next/head';
import { Suspense } from 'react'

// Add getLayout property to disable default layout
NotFound.getLayout = (page) => page;

function NotFoundContent() {
  return (
    <>
      <Head>
        <title>404 - PAGE NOT FOUND</title>
      </Head>
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl md:text-6xl font-bold mb-8 text-center">404</h1>
        
        <div className="text-xl md:text-2xl mb-8 text-green-500/80 text-center">
          SYSTEM MALFUNCTION: PAGE NOT FOUND
        </div>

        <div className="text-base md:text-lg text-green-500/60 mb-12 text-center max-w-[600px]">
          The requested resource has been terminated or never existed
        </div>
        
        <Link 
          href="/"
          className="text-lg md:text-xl border border-green-500/20 rounded-lg px-6 py-3 hover:bg-green-500/10 transition-colors"
        >
          RETURN TO BASE
        </Link>
      </div>
    </>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
} 