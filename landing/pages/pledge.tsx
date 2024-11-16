// pages/pledge.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

const Pledge: NextPage = () => {
    return (
        <div className="terminal-wrapper">
            <Head>
                <title>higherrrrrrr.fun</title>
                <meta name="description" content="Pledge your allegiance" />
            </Head>

            <div className="max-w-4xl mx-auto p-8 text-green-500">
                <div className="flex justify-center mb-8">
                    <Link
                        href="/"
                        className="text-green-500 hover:text-green-400 text-sm opacity-80 hover:opacity-100"
                    >
                        ← back
                    </Link>
                </div>

                <div className="flex items-center justify-center h-[70vh]">
                    <div className="text-center">
                        <h1 className="text-4xl mb-4">Pledges opening soon<span className="terminal-cursor">▊</span></h1>
                        <p className="text-xl opacity-80">The faithful shall be rewarded</p>
                    </div>
                </div>

                <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-8">
                    <Link
                        href="https://twitter.com/higherrrrrrrfun"
                        target="_blank"
                        className="text-green-500 hover:text-green-400 text-sm"
                    >
                        Twitter
                    </Link>
                    <Link
                        href="/faq"
                        className="text-green-500 hover:text-green-400 text-sm"
                    >
                        FAQ
                    </Link>
                </footer>
            </div>
        </div>
    );
};

export default Pledge;