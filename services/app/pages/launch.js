import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';  // Import full ethers
import { higherrrrrrrFactoryAbi, higherrrrrrrFactoryAddress } from '../onchain/generated';
import { getEthPrice } from '../api/price';
import { getContractAddress } from '../api/contract';
import { useConnectModal } from '../components/Web3Provider';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

// Use parseEther from ethers instead of ethers/lib/utils
const parseEther = ethers.parseEther;
const formatEther = ethers.formatEther;

const MAX_SUPPLY = 1_000_000_000; // 1B tokens
const DEFAULT_PRICE_LEVELS = [
  { price: '0.000000005', name: 'Pleb', usdPrice: '0' },
  { price: '0.00000001', name: 'Degen', usdPrice: '0' },
  { price: '0.00000005', name: 'Ape', usdPrice: '0' },
  { price: '0.0000001', name: 'Based', usdPrice: '0' },
  { price: '0.0000005', name: 'Chad', usdPrice: '0' },
  { price: '0.000001', name: 'Sigma', usdPrice: '0' },
  { price: '0.000005', name: 'Gigachad', usdPrice: '0' }
];

// Add helper function for formatting numbers
const formatNumber = (num) => {
  if (num < 0.00001) {
    return num.toExponential(6);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  });
};

const formatUsd = (num) => {
  console.log('Formatting USD value:', num, typeof num);
  if (num >= 1) {
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  // For small numbers, show up to 12 decimal places
  return `$${num.toFixed(12)}`;
};

const formatEth = (num) => {
  if (num < 0.00001) {
    return num.toFixed(9); // Show 9 decimal places for very small ETH amounts
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  });
};

// keccak256("NewToken(address,address)")
const NEW_TOKEN_EVENT_SIGNATURE = "0x46960970e01c8cbebf9e58299b0acf8137b299ef06eb6c4f5be2c0443d5e5f22";

export default function Launch() {
  const { address } = useWallet();
  const { getSignerContract } = useContract(higherrrrrrrFactoryAddress, higherrrrrrrFactoryAbi);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const [factoryAddress, setFactoryAddress] = useState('');
  const [ethPrice, setEthPrice] = useState(0);
  const [priceUnit, setPriceUnit] = useState('ETH');
  const [formData, setFormData] = useState({
    symbol: '',
    priceLevels: DEFAULT_PRICE_LEVELS
  });

  useEffect(() => {
    Promise.all([
      getContractAddress(),
      getEthPrice()
    ]).then(([addressData, priceData]) => {
      console.log('ETH Price:', priceData.price_usd);
      setFactoryAddress(addressData.factory_address);
      setEthPrice(priceData.price_usd);
      
      // Update initial USD prices
      setFormData(prev => ({
        ...prev,
        priceLevels: prev.priceLevels.map(level => {
          const usdPrice = parseFloat(level.price) * priceData.price_usd;
          console.log('Calculated USD price:', level.price, '*', priceData.price_usd, '=', usdPrice);
          return {
            ...level,
            usdPrice: usdPrice.toString()
          };
        })
      }));
    }).catch(console.error);
  }, []);

  const validatePrices = (levels) => {
    for (let i = 1; i < levels.length; i++) {
      const prevPrice = parseFloat(levels[i - 1].price);
      const currentPrice = parseFloat(levels[i].price);
      if (currentPrice <= prevPrice) {
        return `Price level ${i + 1} must be higher than level ${i}`;
      }
    }
    return '';
  };

  const handleLaunch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getSignerContract();
      if (!contract) throw new Error('Contract not initialized');

      const tx = await contract.launch({
        value: parseEther('0.01') // Adjust based on your requirements
      });

      await tx.wait();
      router.push('/dashboard');
    } catch (err) {
      console.error('Launch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for wallet connection first
    if (!address) {
      openConnectModal();
      return;
    }
    
    // Validate prices before submitting
    const validationError = validatePrices(formData.priceLevels);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Use just the first level's name as the token name
    const name = formData.priceLevels[0].name;
    const uri = `https://higherrrrrrr.fun/metadata/${formData.symbol.toLowerCase()}`;
    
    const levels = formData.priceLevels.map(level => ({
      price: parseEther(level.price),
      name: level.name
    }));

    handleLaunch();
  };

  const handlePriceLevelChange = (index, field, value) => {
    setError('');
    
    setFormData(prev => {
      const newLevels = [...prev.priceLevels];
      if (field === 'price') {
        const usdPrice = (parseFloat(value) * ethPrice);
        console.log('Price change:', value, '*', ethPrice, '=', usdPrice);
        newLevels[index] = {
          ...newLevels[index],
          price: value,
          usdPrice: usdPrice.toString()
        };
      } else if (field === 'usdPrice') {
        const ethValue = (parseFloat(value) / ethPrice);
        console.log('USD change:', value, '/', ethPrice, '=', ethValue);
        newLevels[index] = {
          ...newLevels[index],
          usdPrice: value,
          price: ethValue.toString()
        };
      } else {
        newLevels[index] = {
          ...newLevels[index],
          [field]: value
        };
      }
      
      const validationError = validatePrices(newLevels);
      setError(validationError);
      
      return { ...prev, priceLevels: newLevels };
    });
  };

  const addPriceLevel = () => {
    setFormData(prev => {
      const lastLevel = prev.priceLevels[prev.priceLevels.length - 1];
      const newPrice = (parseFloat(lastLevel.price) * 10).toFixed(6);
      const newUsdPrice = (parseFloat(newPrice) * ethPrice).toFixed(2);
      
      return {
        ...prev,
        priceLevels: [
          ...prev.priceLevels,
          {
            price: newPrice,
            name: 'New Level',
            usdPrice: newUsdPrice
          }
        ]
      };
    });
  };

  const removePriceLevel = (index) => {
    if (formData.priceLevels.length <= 2) {
      setError('Must have at least 2 price levels');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      priceLevels: prev.priceLevels.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-0">
      <h1 className="text-2xl md:text-3xl font-mono font-bold text-green-500 mb-4 md:mb-6">
        Launch New Token
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 border border-green-500/50 p-4 md:p-6 rounded-lg">
        {error && (
          <div className="text-red-500 font-mono border border-red-500/50 p-2 rounded text-sm md:text-base">
            {error}
          </div>
        )}
        
        <div>
          <label className="block font-mono text-green-500 mb-2 text-sm md:text-base">Token Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
            className="w-full bg-black border border-green-500/30 text-green-500 font-mono p-2 rounded focus:border-green-500 focus:outline-none text-sm md:text-base"
            placeholder="MEME"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-mono text-green-500">Price Levels</h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPriceUnit('ETH')}
                className={`px-2 md:px-3 py-1 font-mono rounded text-sm md:text-base ${
                  priceUnit === 'ETH' 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                ETH
              </button>
              <button
                type="button"
                onClick={() => setPriceUnit('USD')}
                className={`px-2 md:px-3 py-1 font-mono rounded text-sm md:text-base ${
                  priceUnit === 'USD' 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          {formData.priceLevels.map((level, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 md:space-x-4">
              <div className="flex-1">
                <label className="block font-mono text-green-500 mb-2 text-sm md:text-base">
                  Price ({priceUnit})
                </label>
                <input
                  type="number"
                  value={priceUnit === 'ETH' ? level.price : level.usdPrice}
                  onChange={(e) => handlePriceLevelChange(
                    index, 
                    priceUnit === 'ETH' ? 'price' : 'usdPrice',
                    e.target.value
                  )}
                  step={priceUnit === 'ETH' ? "0.0001" : "0.01"}
                  className="w-full bg-black border border-green-500/30 text-green-500 font-mono p-2 rounded focus:border-green-500 focus:outline-none text-sm md:text-base"
                  required
                />
                <div className="text-green-500/50 text-xs md:text-sm mt-1 font-mono">
                  {priceUnit === 'ETH' 
                    ? formatUsd(parseFloat(level.usdPrice))
                    : `${formatEth(parseFloat(level.price))} ETH`}
                </div>
                <div className="text-green-500/50 text-xs md:text-sm mt-1 font-mono">
                  Market Cap: {formatUsd(parseFloat(level.usdPrice) * MAX_SUPPLY)}
                </div>
              </div>
              <div className="flex-1">
                <label className="block font-mono text-green-500 mb-2 text-sm md:text-base">Level Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={level.name}
                    onChange={(e) => handlePriceLevelChange(index, 'name', e.target.value)}
                    className="flex-1 bg-black border border-green-500/30 text-green-500 font-mono p-2 rounded focus:border-green-500 focus:outline-none text-sm md:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removePriceLevel(index)}
                    className="px-2 md:px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-mono rounded transition-colors text-sm md:text-base"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPriceLevel}
            className="w-full mt-4 px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono rounded transition-colors text-sm md:text-base"
          >
            + Add Price Level
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !!error}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-mono font-bold rounded transition-colors text-sm md:text-base"
        >
          {!address ? "Connect Wallet to Launch" :
           isLoading ? "Creating Token..." : 
           "Launch Token"}
        </button>
      </form>
    </div>
  );
} 