import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { HigherrrrrrrFactoryABI } from '../onchain/generated';

export default function LaunchPage() {
  const router = useRouter();
  const [factoryAddress, setFactoryAddress] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    maxSupply: '1000000',
    priceIncreaseFactor: '110',
    priceDecreaseFactor: '90',
    cooldownPeriod: '300',
    initialPrice: '0.0001'
  });

  useEffect(() => {
    fetch('/api/contract-address')
      .then(res => res.json())
      .then(data => setFactoryAddress(data.factory))
      .catch(console.error);
  }, []);

  const { write: createToken, data: createData } = useContractWrite({
    address: factoryAddress,
    abi: HigherrrrrrrFactoryABI,
    functionName: 'createToken'
  });

  const { isLoading } = useWaitForTransaction({
    hash: createData?.hash,
    onSuccess: (data) => {
      router.push(`/token/${data.logs[0].address}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createToken({
      args: [
        formData.name,
        formData.symbol,
        parseEther(formData.maxSupply),
        parseEther(formData.initialPrice),
        BigInt(formData.priceIncreaseFactor),
        BigInt(formData.priceDecreaseFactor),
        BigInt(formData.cooldownPeriod)
      ]
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-green-500 mb-6">Launch New Token</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg">
        <div>
          <label className="block text-gray-400 mb-2">Token Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Token Symbol</label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Max Supply</label>
          <input
            type="number"
            name="maxSupply"
            value={formData.maxSupply}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Initial Price (ETH)</label>
          <input
            type="number"
            name="initialPrice"
            value={formData.initialPrice}
            onChange={handleChange}
            step="0.0001"
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Price Increase Factor (%)</label>
          <input
            type="number"
            name="priceIncreaseFactor"
            value={formData.priceIncreaseFactor}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Price Decrease Factor (%)</label>
          <input
            type="number"
            name="priceDecreaseFactor"
            value={formData.priceDecreaseFactor}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Cooldown Period (seconds)</label>
          <input
            type="number"
            name="cooldownPeriod"
            value={formData.cooldownPeriod}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
        >
          {isLoading ? "Creating Token..." : "Launch Token"}
        </button>
      </form>
    </div>
  );
} 