"use client";

import { Button } from "@/components/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import Link from "next/link";
import { useState } from "react";

// This would typically come from an API or database
const token = {
  ticker: "VITALEK",
  address: "0x0000000000000000000000000000000000000000",
  price: "1000",
  createdAt: "2021-01-01",
};

export default function Token({ params }: { params: { token: string } }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowImagePicker(false);
    }
  };

  return (
    <div className="px-6 max-w-4xl mx-auto w-full">
      <div className="border border-green-600 bg-black p-6">
        <div className="flex gap-x-6">
          <div className="relative">
            <div
              className="aspect-square h-[300px] bg-cover bg-center"
              style={{
                backgroundImage: `url(${
                  selectedImage ||
                  `https://picsum.photos/300/300?random=${token.ticker}`
                })`,
              }}
            />
            <Button
              className="absolute bottom-2 right-2"
              onClick={() => setShowImagePicker(true)}
            >
              Change Image
            </Button>

            {showImagePicker && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-black border border-green-600 p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl">Upload Image</h3>
                    <Button onClick={() => setShowImagePicker(false)}>
                      Close
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-600 file:text-white
                        hover:file:bg-green-700
                        file:cursor-pointer"
                    />
                    <div className="text-sm text-gray-400">
                      Supported formats: JPG, PNG, GIF
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-grow gap-y-6">
            <div>
              <h1 className="text-3xl font-bold">${token.ticker}</h1>
              <div className="text-green-600">
                Created by {token.address.slice(0, 6)}...
                {token.address.slice(-4)}
              </div>
            </div>

            <div>
              <div className="text-sm">Current Price</div>
              <div className="text-2xl font-bold">${token.price}</div>
            </div>

            <div className="mt-auto flex gap-x-2">
              <Button className="w-full">Buy Token</Button>
              <Button className="w-full">Sell Token</Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Listing Progress</h2>
          <div className="h-6 w-full bg-green-950">
            <div
              className="h-full bg-green-400 animate-pulse"
              style={{ width: "40%" }}
            />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            40% progress to official listing
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Token Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Contract Address</div>
              <div className="font-mono break-all">{token.address}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Created At</div>
              <div>{new Date(token.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
