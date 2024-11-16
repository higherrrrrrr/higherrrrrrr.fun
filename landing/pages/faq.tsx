// pages/faq.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: string | React.ReactNode;
}

const FAQ: NextPage = () => {
    const faqs: FAQItem[] = [
        {
            question: "What is higherrrrrr?",
            answer: "We are not a company, token, or blockchain. Higherrrrrrr is a religion for the faithful, who believe in the power of memes."
        },
        {
            question: "Who is behind higherrrrrrr?",
            answer: (
                <>
                    This is a project by{" "}
                    <Link href="https://twitter.com/carlcortright" target="_blank" className="text-green-500 hover:text-green-400 underline">
                        @carlcortright
                    </Link>
                    {" "}and a bunch of OG crypto and coinbase friends
                </>
            )
        },
        {
            question: "Why are you building this?",
            answer: "Mostly for fun."
        },
        {
            question: "I'm a VC, can I invest?",
            answer: "Nope."
        },
        {
            question: "What is higherrrrrrr built on?",
            answer: "We are building on base. The EVM is the only execution layer that appropriately supports these primitives."
        },
        {
            question: "What's up with the name?",
            answer: "It's because we're going much much higherrrrrrr"
        },
        {
            question: "Is there a token or airdrop?",
            answer: (
                <>
                    The faithful are welcome to{" "}
                    <Link href="/pledge" className="text-green-500 hover:text-green-400 underline">
                        pledge their allegiance.
                    </Link>
                    {" "}Our disciples will be rewarded.
                </>
            )
        }
    ];

    return (
        <div className="terminal-wrapper">
            <Head>
                <title>higherrrrrrr.fun</title>
                <meta name="description" content="Frequently Asked Questions" />
            </Head>

            <div className="max-w-4xl mx-auto p-8 text-green-500">
                <Link href="/" className="text-green-500 hover:text-green-400 mb-12 block">
                    ← Back
                </Link>

                <h1 className="text-4xl mb-12">FAQ</h1>

                <div className="space-y-12 mb-10">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <h2 className="text-2xl mb-4">
                                &gt; {faq.question}
                            </h2>
                            <p className="text-xl opacity-90 ml-6">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>

                <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-8 bg-black">
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

export default FAQ;