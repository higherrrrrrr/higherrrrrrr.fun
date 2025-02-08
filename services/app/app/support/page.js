'use client';
import { useState } from 'react';

const FAQ = () => {
  const faqs = [
    {
      question: "What is Higherrrrrrr? Is it even real? 🤪",
      answer: "Yep, it's real (as real as memes and crypto get, anyway!). Higherrrrrrr is a memecoin launchpad and token framework built on Solana. Think of it as a tool for creators to launch their own meme tokens, but with a twist. We're not just about slapping a dog picture on a coin; we're into making tokens that evolve and reward the true believers."
    },
    {
      question: "\"Evolving Tokens\"? What does that even mean? 🤔",
      answer: "Most crypto tokens are kinda boring. They launch, they trade, and that's about it. Higherrrrrrr tokens can change over time. As the token gets more popular (or hits certain market cap goals), it can \"evolve\" - changing its name, symbol, and artwork automatically based on community activity."
    },
    {
      question: "What are \"Conviction NFTs\"? 🖼️",
      answer: "Think of these as digital badges of honor for the true believers. If you hold 0.042069% of a token's total supply, you can claim special NFTs that evolve along with the token. They're proof you were early and had conviction in the project!"
    },
    {
      question: "Is this just another pump-and-dump? 📉",
      answer: "Look, it is crypto, and memecoins are definitely risky. We're not going to pretend otherwise. BUT we've built in deflationary mechanics and liquidity floors to make it less of a pure gamble. Always do your own research and only invest what you can afford to lose."
    },
    {
      question: "What's with the 1% fee on every trade? 💸",
      answer: "The 1% fee is split two ways: 0.5% gets burned (making tokens rarer over time), and 0.5% goes to building a liquidity floor in SOL. Think of it as a tiny tax that gets reinvested into making the token potentially more valuable."
    },
    {
      question: "How do I get involved? 🐒",
      answer: "Check out alpha.higherrrrrrr.fun, join our Telegram and Twitter communities, and if you're feeling brave, you can even pledge your allegiance on our website (no blood oaths required)!"
    }
  ];

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-green-500/20 rounded-lg p-6 bg-black/20">
            <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
            <p className="text-green-500/80 leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Chatbot = () => {
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([
    { sender: "bot", text: "Hello! How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!query.trim()) return;
    const newConversation = [
      ...conversation,
      { sender: "user", text: query }
    ];
    setConversation(newConversation);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ conversation: newConversation })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setConversation([...newConversation, { sender: "bot", text: data.response }]);
      }
    } catch (err) {
      setError("Failed to get a response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Chat with Support</h2>
      <div className="border border-gray-700 p-4 rounded mb-4 h-80 overflow-y-auto bg-black">
        {conversation.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === "bot" ? "text-green-500" : "text-blue-500"}`}>
            <strong>{msg.sender === "bot" ? "Support:" : "You:"}</strong> {msg.text}
          </div>
        ))}
        {loading && <p className="text-gray-500">Waiting for response...</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your question..."
          className="flex-grow p-2 border border-gray-700 rounded bg-black text-green-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if(e.key === "Enter") handleSend() }}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600 transition"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-green-500">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Support</h1>
        <p className="text-xl text-green-500/80 mb-12">
          Need help? Chat with our support team or check out our FAQs below.
        </p>
        
        <Chatbot />
        <FAQ />
      </div>
    </div>
  );
}
