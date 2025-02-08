// pages/support.jsx
import { useState } from 'react';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "To reset your password, click on the 'Forgot password' link on the login page and follow the instructions."
    },
    {
      question: "Where can I view my transaction history?",
      answer: "Your transaction history is available under the 'Account' section once you are logged in."
    },
    // ... more FAQs
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <ul>
        {faqs.map((faq, i) => (
          <li key={i} className="mb-6">
            <p className="font-bold">{faq.question}</p>
            <p className="mt-1 text-gray-300">{faq.answer}</p>
          </li>
        ))}
      </ul>
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
    <div className="min-h-screen bg-black text-green-500 p-8">
      <h1 className="text-4xl font-bold mb-8">Support</h1>
      <FAQ />
      <Chatbot />
    </div>
  );
}
