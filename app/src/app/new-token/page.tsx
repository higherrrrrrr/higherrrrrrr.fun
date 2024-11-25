"use client";

import { Button, IconButton } from "@/components/Button";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { HigherrrrrrrFactory } from '@/lib/contracts/higherrrrrrrFactory';

type PriceLevel = {
  name: string;
  greaterThan: string;
};

export default function NewToken() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    if (walletClient) {
      new ethers.BrowserProvider(walletClient as any)
        .getSigner()
        .then(setSigner);
    }
  }, [walletClient]);

  const [description, setDescription] = useState("");
  const [initialPriceName, setInitialPriceName] = useState("");
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([
    { name: "", greaterThan: "" },
    { name: "", greaterThan: "" },
    { name: "", greaterThan: "" },
  ]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(previewUrl);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await response.json();
      setUploadedImageUrl(url);


    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload image');
      setSelectedImage(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function createToken() {
    if (!signer || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!uploadedImageUrl) {
      setError("Please upload an image first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const factory = new HigherrrrrrrFactory(
        process.env.NEXT_PUBLIC_FACTORY_ADDRESS!,
        signer
      );

      const formattedLevels = [
        { 
          price: ethers.parseEther("0"), 
          name: initialPriceName 
        },
        ...priceLevels.map(level => ({
          price: ethers.parseEther(level.greaterThan),
          name: level.name
        }))
      ];

      // Create token with direct metadata
      const tx = await factory.createHigherrrrrrr(
        initialPriceName,
        initialPriceName.toUpperCase(),
        uploadedImageUrl,
        formattedLevels
      );

      window.location.href = `/token/${tx.tokenAddress}`;

    } catch (err: any) {
      console.error("Error creating token:", err);
      setError(err.message || "Failed to create token");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!uploadedImageUrl) {
      setError("Please upload an image first");
      return;
    }

    if (!description) {
      setError("Please enter a description");
      return;
    }

    let priceLevelsError: string | null = null;
    for (const level of priceLevels) {
      if (!level.name || !level.greaterThan) {
        priceLevelsError = "Please fill in all price levels";
        break;
      }
    }

    if (priceLevelsError) {
      setError(priceLevelsError);
      return;
    }

    await createToken();
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className=" text-3xl mb-8">
          create a new{" "}
          <span className="text-green-500">
            <TypeAndDelete words={["coin", "moment", "generation"]} />
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
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="bg-black border border-green-600 text-green-500 px-4 py-2  hover:bg-green-600 hover:text-black transition-colors cursor-pointer"
                >
                  choose file
                </label>
                <span className="text-gray-500 ">
                  {selectedImage ? "image selected" : "no file chosen"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label>name & price levels</Label>

            {/* First price level - locked to "greater than 0" */}
            {/* Additional price levels */}
            <div className="grid grid-cols-[1fr_1fr_50px] gap-x-3 gap-y-2 col-span-full items-center">
              <div className="grid grid-cols-subgrid col-span-full">
                <div className="flex flex-col flex-1">
                  <input
                    type="text"
                    value={initialPriceName}
                    onChange={(e) => {
                      setError(null);
                      setInitialPriceName(e.target.value);
                    }}
                    placeholder={`8=D`}
                    className="w-full bg-black border border-green-600 p-2  text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center flex-1 bg-black border border-green-600 p-2  text-gray-500">
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
                      value={level.name}
                      onChange={(e) => {
                        setError(null);
                        const newLevels = [...priceLevels];
                        newLevels[index].name = e.target.value;
                        setPriceLevels(newLevels);
                      }}
                      placeholder={`8${"=".repeat(index + 2)}D${
                        index > 8 ? "~~~" : ""
                      }`}
                      className="w-full bg-black border border-green-600 p-2  text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                      className="w-full bg-black border border-green-600 p-2  text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                    { name: "", greaterThan: "" },
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
              className="w-full bg-black border border-green-600 p-2  text-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[100px]"
            />
          </div>

          {/* NSFW Toggle */}
          <div>
            <label className="flex items-center gap-x-3  text-green-500">
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
            disabled={isCreating}
            className="w-full bg-green-500 text-black py-3 px-4 hover:bg-green-600 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isCreating ? "creating..." : "create"}</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block  text-gray-400 mb-2">{children}</label>;
}
