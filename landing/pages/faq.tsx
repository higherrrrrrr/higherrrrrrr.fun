// pages/faq.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const FAQ: NextPage = () => {
  const faqs: FAQItem[] = [
    {
      question: "What is higherrrrrrr?",
      answer: (
        <>
          We are not a company, token, or blockchain. Higherrrrrrr is a religion for the faithful, a cult for those who believe in the power of memes. Our product is an exchange for a new onchain primitive. Read more about our{" "}
          <Link
            href="/protocol"
            className="text-green-500 hover:text-green-400 underline"
          >
            protocol and token design here
          </Link>
          .
        </>
      ),
    },
    {
      question: "Who is behind higherrrrrrr?",
      answer: (
        <>
          This is a project by{" "}
          <Link
            href="https://twitter.com/carlcortright"
            target="_blank"
            className="text-green-500 hover:text-green-400 underline"
          >
            @carlcortright
          </Link>{" "}
          and a bunch of OG crypto and coinbase friends
        </>
      ),
    },
    {
      question: "Why are you building this?",
      answer: "For fun.",
    },
    {
      question: "I'm a VC, can I invest?",
      answer: "Nope.",
    },
    {
      question: "What is higherrrrrrr built on?",
      answer: (
        <>
          We are building on base. The EVM is the only execution layer that appropriately supports these primitives. See our{" "}
          <Link
            href="/protocol"
            className="text-green-500 hover:text-green-400 underline"
          >
            technical architecture
          </Link>
          {" "}for more details.
        </>
      ),
    },
    {
      question: "What's up with the name?",
      answer: "It's because we're going much much higherrrrrrr",
    },
    {
      question: "Aren't you a tourist?",
      answer: "Total. Fucking. Tourist.",
    },
    {
      question: "Are you hiring?",
      answer:
        "Weirdos, degens, and hot girls can feel free to DM @carlcortright to join our marketing team. No fancy degrees. You will be rewarded for your loyalty",
    },
    {
      question: "Is there a token or airdrop?",
      answer: (
        <>
          The faithful are welcome to{" "}
          <Link
            href="/pledge"
            className="text-green-500 hover:text-green-400 underline"
          >
            pledge their allegiance.
          </Link>{" "}
          Our disciples will be rewarded.
        </>
      ),
    },
  ];

  return (
    <div className="terminal-wrapper">
      <Head>
        <title>higherrrrrrr.fun</title>
        <meta name="description" content="Frequently Asked Questions" />
      </Head>

      <div className="max-w-4xl mx-auto p-6 text-green-500">
        <Link
          href="/"
          className="text-green-500 hover:text-green-400 mb-8 block"
        >
          ← Back
        </Link>

        <h1 className="text-4xl mb-8">FAQ</h1>

        <div className="space-y-8 mb-10">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h2 className="text-2xl mb-3">&gt; {faq.question}</h2>
              <p className="text-xl opacity-90 ml-6">{faq.answer}</p>
            </div>
          ))}
        </div>

        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 max-w-3xl mx-auto px-4">
          <Link
            href="https://twitter.com/higherrrrrrrfun"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            Twitter
          </Link>
          <Link
            href="https://discord.gg/RKrFDw8jRW"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            Discord
          </Link>
          <Link
            href="/faq"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            FAQ
          </Link>
          <Link
            href="/theology"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            Theology
          </Link>
          <Link
            href="/protocol"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            Protocol
          </Link>
          <Link
            href="https://github.com/Thrive-Point-Group/higherrrrrrr-protocol"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            GitHub
          </Link>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default FAQ;
