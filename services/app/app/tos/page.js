"use client";

export default function Legal() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-mono text-green-500 mb-4">Legal Disclaimer</h1>
      <p className="text-green-500/70 font-mono mb-8">Last Updated: February 20, 2025</p>

      <div className="space-y-8">
        <section className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-4">1. No Legal or Financial Advice</h2>
          <p className="text-green-500/70 font-mono">
            The information contained on this website, social media channels, and any related materials (collectively, the "Content") 
            is provided for informational purposes only. Nothing in the Content constitutes legal, financial, investment, or other 
            professional advice. You should not treat any of the Content as a substitute for professional advice. Before making any 
            financial or legal decisions, always seek the advice of a qualified professional.
          </p>
        </section>

        <section className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-4">2. Personal Policy on Information Asymmetry</h2>
          <p className="text-green-500/70 font-mono mb-4">
            I have established personal and professional policies to prevent information asymmetry and insider trading in relation 
            to cryptoassets (the "Policy"). While I am committed to adhering to this Policy:
          </p>
          <ul className="list-disc list-inside text-green-500/70 font-mono space-y-2 ml-4">
            <li>I make no representations or warranties that all individuals or entities with whom I collaborate will adhere to the same standards.</li>
            <li>If a breach of this Policy by a third party is discovered, I will take appropriate corrective measures, including severing relationships where necessary.</li>
          </ul>
        </section>

        <section className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-4">3. No Trading on Insider Information</h2>
          <p className="text-green-500/70 font-mono mb-4">
            I have committed to not trading on insider or non-public, market-moving information related to cryptoassets. This includes but is not limited to:
          </p>
          <ul className="list-disc list-inside text-green-500/70 font-mono space-y-2 ml-4">
            <li>Knowledge of upcoming token launches prior to public announcement;</li>
            <li>Privileged details of projects in which I am involved;</li>
            <li>Any other information reasonably expected to influence market behavior if it were made public.</li>
          </ul>
          <p className="text-green-500/70 font-mono mt-4">
            All relevant information about any token or project on which I intend to trade will be made publicly available through 
            social media posts or other transparent channels before any personal trading occurs. However, I do not guarantee that 
            all such information is free from error or omission, nor that third parties will not misuse or misinterpret publicly 
            shared information.
          </p>
        </section>

        {/* Continue with sections 4-10 in the same format... */}
        
        <section className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-4">10. Updates to This Disclaimer</h2>
          <p className="text-green-500/70 font-mono">
            I reserve the right to modify or replace any part of this Disclaimer at any time. It is your responsibility to check 
            this page periodically for changes. Your continued use of the website or associated platforms after the posting of 
            any changes constitutes acceptance of those changes.
          </p>
        </section>
      </div>
    </div>
  );
}
