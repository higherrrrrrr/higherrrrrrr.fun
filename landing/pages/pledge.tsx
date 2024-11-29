// pages/pledge.tsx
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { Footer } from '../components/Footer';

const DynamicPledgeContent = dynamic(() => import("../components/PledgeContent").then((mod) => mod.PledgeContent), {
  ssr: false,
});

export default function Pledge() {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Pledge Your Allegiance - higherrrrrrr.fun</title>
        <meta
          name="description"
          content="Pledge your allegiance to the cult of memes"
        />
      </Head>

      <div className="max-w-4xl mx-auto p-8 text-green-500">
        <DynamicPledgeContent />
        <Footer />
      </div>
    </div>
  );
}
