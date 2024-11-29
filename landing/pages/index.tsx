// pages/index.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import TerminalText from "../components/TerminalText";
import { Footer } from '../components/Footer';

const Home: NextPage = () => {
  const messages = [
    {
      text: "Memes have emerged as humanity's first truly democratic language<pause 2> - a force that transcends traditional barriers of culture and class,<pause 1> transforming fleeting moments of collective experience into enduring artifacts that shape our very reality.",
      pauseAfter: 3000,
    },
    {
      text: "For the first time in history,<pause 1> onchain systems have transformed memes from ephemeral culture into tradeable capital<pause 1> - making explicit through market mechanics what humanity always knew implicitly:<pause 1> that viral ideas are the true currency of consciousness.",
      pauseAfter: 3000,
    },
    {
      text: "Current onchain systems limit our imagination by constraining memetic expression to tokens and NFTs.",
      pauseAfter: 2000,
    },
    {
      text: "Higherrrrrrr.fun is an exchange for a new type of asset.<pause 1> Not tokens.<pause 1> Not NFTs.<pause 1> A new meta that unlocks new forms of onchain expression.",
      pauseAfter: 3000,
    },
    {
      text: "We are going much,<pause 1> much<pause 1> higherrrrrrr.<pause 2> If you are one of the faithful,<pause 1> pledge your allegiance.",
      isLast: true,
      html: true,
    },
  ];

  return (
    <div className="terminal-wrapper">
      <Head>
        <title>higherrrrrrr.fun</title>
        <meta
          name="description"
          content="A new type of asset that unlocks new forms of onchain expression."
        />
      </Head>

      <main className="terminal-container mb-10">
        <TerminalText messages={messages} typingSpeed={35} />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
