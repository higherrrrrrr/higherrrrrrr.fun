import { useState } from "react";

export default function NewToken() {
  const [formData, setFormData] = useState({
    ticker: "",
    description: "",
    isNSFW: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-green-500 font-mono text-3xl mb-8">
          create a new coin
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border border-green-600 p-4">
            <label className="block font-mono text-gray-400 mb-2">
              image (jpeg, png, webp, gif & svg) files are supported (wow)
            </label>
            <button className="bg-black border border-green-600 text-green-500 px-4 py-2 font-mono hover:bg-green-600 hover:text-black transition-colors">
              choose file
            </button>
            <span className="ml-4 text-gray-500 font-mono">no file chosen</span>
          </div>

          {/* Ticker Input */}
          <div>
            <label className="block font-mono text-gray-400 mb-2">ticker</label>
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value })
              }
              className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block font-mono text-gray-400 mb-2">
              description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[100px]"
            />
          </div>

          {/* NSFW Toggle */}
          <div>
            <label className="flex items-center gap-x-3 font-mono text-green-500">
              <input
                type="checkbox"
                checked={formData.isNSFW}
                onChange={(e) =>
                  setFormData({ ...formData, isNSFW: e.target.checked })
                }
                className="h-5 w-5 bg-black border-2 border-green-600 text-green-500 checked:bg-green-500 checked:border-green-500 focus:ring-1 focus:ring-green-500 focus:ring-offset-0 rounded-none transition-colors cursor-pointer appearance-none"
              />
              <span>maybe NSFW</span>
            </label>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-500 text-black font-mono py-3 px-4 hover:bg-green-600 transition-colors flex items-center justify-between"
          >
            <span>create</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
