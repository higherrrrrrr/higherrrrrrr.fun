"use client";

import { Button, IconButton } from "@/components/Button";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import { useState } from "react";

type TickerForPriceLevel = {
  ticker: string;
  greaterThan: string;
};

export default function NewToken() {
  const [description, setDescription] = useState("");
  const [initialPriceTicker, setInitialPriceTicker] = useState("");
  const [priceLevels, setPriceLevels] = useState<TickerForPriceLevel[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  }

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedImage) {
      setError("Please select an image");
      return;
    }

    if (!description) {
      setError("Please enter a description");
      return;
    }

    let priceLevelsError: string | null = null;
    for (const level of priceLevels) {
      if (!level.ticker || !level.greaterThan) {
        priceLevelsError = "Please fill in all price levels";
        break;
      }
    }

    if (priceLevelsError) {
      setError(priceLevelsError);
      return;
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-mono text-3xl mb-8">
          create a new{" "}
          <span className="text-green-500">
            <TypeAndDelete words={["coin", "moment", "generation", "ticker"]} />
          </span>
        </h1>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="border border-green-600 p-4">
            <div className="flex flex-col gap-4">
              {selectedImage && (
                <div
                  className="aspect-square w-48 bg-cover bg-center mx-auto"
                  style={{ backgroundImage: `url(${selectedImage})` }}
                />
              )}
              <div className="flex items-center gap-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="bg-black border border-green-600 text-green-500 px-4 py-2 font-mono hover:bg-green-600 hover:text-black transition-colors cursor-pointer"
                >
                  choose file
                </label>
                <span className="text-gray-500 font-mono">
                  {selectedImage ? "image selected" : "no file chosen"}
                </span>
              </div>
            </div>
          </div>

          {/* Ticker Input */}
          <div>
            <Label>ticker & price levels</Label>

            {/* First price level - locked to "greater than 0" */}
            {/* Additional price levels */}
            <div className="grid grid-cols-[1fr_1fr_50px] gap-x-3 gap-y-2 col-span-full items-center">
              <div className="grid grid-cols-subgrid col-span-full">
                <div className="flex flex-col flex-1">
                  <input
                    type="text"
                    value={initialPriceTicker}
                    onChange={(e) => {
                      setError(null);
                      setInitialPriceTicker(e.target.value);
                    }}
                    placeholder={`8=D`}
                    className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center flex-1 bg-black border border-green-600 p-2 font-mono text-gray-500">
                  &gt; $0
                </div>

                <div />
              </div>

              {priceLevels.map((level, index) => (
                <div
                  key={index}
                  className="grid grid-cols-subgrid col-span-full"
                >
                  <div className="flex flex-col flex-1">
                    <input
                      type="text"
                      value={level.ticker}
                      onChange={(e) => {
                        setError(null);
                        const newLevels = [...priceLevels];
                        newLevels[index].ticker = e.target.value;
                        setPriceLevels(newLevels);
                      }}
                      placeholder={`8${"=".repeat(index + 2)}D${
                        index > 8 ? "~~~" : ""
                      }`}
                      className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={level.greaterThan}
                      onChange={(e) => {
                        setError(null);
                        const newLevels = [...priceLevels];
                        newLevels[index].greaterThan = e.target.value;
                        setPriceLevels(newLevels);
                      }}
                      placeholder={`> $${10 ** (index + 1)}`}
                      className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <IconButton
                    type="button"
                    onClick={() => {
                      const newLevels = priceLevels.filter(
                        (_, i) => i !== index
                      );
                      setPriceLevels(newLevels);
                    }}
                  >
                    ×
                  </IconButton>
                </div>
              ))}

              <Button
                type="button"
                onClick={() => {
                  setPriceLevels([
                    ...priceLevels,
                    { ticker: "", greaterThan: "" },
                  ]);
                }}
                className="col-span-full"
              >
                + add price level
              </Button>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <Label>description</Label>
            <textarea
              value={description}
              onChange={(e) => {
                setError(null);
                setDescription(e.target.value);
              }}
              className="w-full bg-black border border-green-600 p-2 font-mono text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[100px]"
            />
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
