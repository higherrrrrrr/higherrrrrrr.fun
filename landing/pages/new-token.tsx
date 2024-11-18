import { TypeAndDelete } from "@/components/TypeAndDelete";
import { useState } from "react";

type TickerForPriceLevel = {
  ticker: string;
  greaterThan: string;
};

export default function NewToken() {
  const [priceLevels, setPriceLevels] = useState<TickerForPriceLevel[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-green-500 font-mono text-3xl mb-8">
          create a new{" "}
          <TypeAndDelete words={["coin", "moment", "generation", "ticker"]} />
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border border-green-600 p-4">
            <button className="bg-black border border-green-600 text-green-500 px-4 py-2 font-mono hover:bg-green-600 hover:text-black transition-colors">
              choose file
            </button>
            <span className="ml-4 text-gray-500 font-mono">no file chosen</span>
          </div>

          {/* Ticker Input */}
          <div>
            <Label>ticker & price level</Label>
            <div className="flex gap-x-4">
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="8==D"
                  className="flex-1 bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <input
                type="number"
                step="0.01"
                className="flex-1 bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <Label>description</Label>
            <textarea className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[100px]" />
          </div>

          {/* NSFW Toggle */}
          <div>
            <label className="flex items-center gap-x-3 font-mono text-green-500">
              <input
                type="checkbox"
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-gray-400 mb-2">{children}</label>
  );
}
