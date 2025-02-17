import { useState, useRef } from 'react';

const PRESET_FILTERS = {
  'trending': {
    label: '🔥 Trending',
    filters: {
      minVolume: 50000,
      maxVolume: Infinity,
      minHolders: 100,
      maxHolders: Infinity,
      minTransactionSize: 1000,
      minPriceChange24h: 5,
      sortBy: 'volume',
      sortDir: 'desc'
    }
  },
  'new-momentum': {
    label: '🚀 New & Rising',
    filters: {
      minVolume: 5000,
      maxVolume: 100000,
      minHolders: 50,
      maxHolders: 1000,
      maxAge: 7,
      minPriceChange24h: 10,
      sortBy: 'priceChange24h',
      sortDir: 'desc'
    }
  },
  'whale-activity': {
    label: '🐋 Whale Activity',
    filters: {
      minVolume: 100000,
      maxVolume: Infinity,
      minHolders: 100,
      maxHolders: Infinity,
      minTransactionSize: 10000,
      sortBy: 'volume',
      sortDir: 'desc'
    }
  },
  'community-favorites': {
    label: '👥 Community Favorites',
    filters: {
      minVolume: 10000,
      maxVolume: Infinity,
      minHolders: 1000,
      maxHolders: Infinity,
      minHolderRetention: 48,
      sortBy: 'holders',
      sortDir: 'desc'
    }
  },
  'diamond-hands': {
    label: '💎 Diamond Hands',
    filters: {
      minVolume: 5000,
      maxVolume: Infinity,
      minHolders: 500,
      maxHolders: Infinity,
      minHolderRetention: 72,
      sortBy: 'holders',
      sortDir: 'desc'
    }
  },
  'micro-caps': {
    label: '🔍 Micro Caps',
    filters: {
      minVolume: 1000,
      maxVolume: 25000,
      minHolders: 50,
      maxHolders: 500,
      maxAge: 30,
      sortBy: 'volume',
      sortDir: 'desc'
    }
  }
};

export function TokenFilters({ filters, onUpdateFilters, onClearAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const formRef = useRef(null);

  const handlePresetClick = (presetKey) => {
    setActivePreset(presetKey);
    onUpdateFilters(PRESET_FILTERS[presetKey].filters);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Convert form data to proper types
    const newFilters = {
      minVolume: formData.get('minVolume') ? Number(formData.get('minVolume')) : 0,
      maxVolume: formData.get('maxVolume') ? Number(formData.get('maxVolume')) : Infinity,
      minHolders: formData.get('minHolders') ? Number(formData.get('minHolders')) : 0,
      maxHolders: formData.get('maxHolders') ? Number(formData.get('maxHolders')) : Infinity,
      minMarketCap: formData.get('minMarketCap') ? Number(formData.get('minMarketCap')) : 0,
      maxMarketCap: formData.get('maxMarketCap') ? Number(formData.get('maxMarketCap')) : Infinity,
      minPriceChange24h: formData.get('minPriceChange24h') ? Number(formData.get('minPriceChange24h')) : null,
      maxPriceChange24h: formData.get('maxPriceChange24h') ? Number(formData.get('maxPriceChange24h')) : null,
      sortBy: formData.get('sortBy') || 'volume',
      sortDir: formData.get('sortDir') || 'desc'
    };

    console.log('Applying filters:', newFilters); // Debug log
    setActivePreset(null);
    onUpdateFilters(newFilters);
  };

  const handleClearAll = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setActivePreset(null);
    onUpdateFilters({
      minVolume: 0,
      maxVolume: Infinity,
      minHolders: 0,
      maxHolders: Infinity,
      minMarketCap: 0,
      maxMarketCap: Infinity,
      minPriceChange24h: null,
      maxPriceChange24h: null,
      sortBy: 'volume',
      sortDir: 'desc'
    });
  };

  return (
    <div className="mb-8">
      {/* Filter Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-green-500 hover:text-green-400"
        >
          <span>Custom Filters</span>
          {isOpen ? '↑' : '↓'}
        </button>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 text-green-500/70 hover:text-green-500 transition-colors"
        >
          Clear All Filters
        </button>
      </div>

      {/* Preset Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PRESET_FILTERS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap
              ${activePreset === key 
                ? 'bg-green-500 text-black' 
                : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
              }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Filter Form */}
      {isOpen && (
        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg"
        >
          {/* Volume Range */}
          <div className="space-y-2">
            <label className="block text-sm text-green-500/70">Volume Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minVolume"
                placeholder="Min"
                defaultValue={filters.minVolume > 0 ? filters.minVolume : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
              <input
                type="number"
                name="maxVolume"
                placeholder="Max"
                defaultValue={filters.maxVolume < Infinity ? filters.maxVolume : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
            </div>
          </div>

          {/* Holders Range */}
          <div className="space-y-2">
            <label className="block text-sm text-green-500/70">Holders Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minHolders"
                placeholder="Min"
                defaultValue={filters.minHolders > 0 ? filters.minHolders : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
              <input
                type="number"
                name="maxHolders"
                placeholder="Max"
                defaultValue={filters.maxHolders < Infinity ? filters.maxHolders : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
            </div>
          </div>

          {/* Market Cap Range */}
          <div className="space-y-2">
            <label className="block text-sm text-green-500/70">Market Cap Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minMarketCap"
                placeholder="Min"
                defaultValue={filters.minMarketCap > 0 ? filters.minMarketCap : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
              <input
                type="number"
                name="maxMarketCap"
                placeholder="Max"
                defaultValue={filters.maxMarketCap < Infinity ? filters.maxMarketCap : ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
            </div>
          </div>

          {/* Price Change Range */}
          <div className="space-y-2">
            <label className="block text-sm text-green-500/70">24h Price Change (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minPriceChange24h"
                placeholder="Min"
                defaultValue={filters.minPriceChange24h || ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
              <input
                type="number"
                name="maxPriceChange24h"
                placeholder="Max"
                defaultValue={filters.maxPriceChange24h || ''}
                className="w-full px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="md:col-span-2 flex justify-end gap-2">
            <div className="flex gap-2">
              <select 
                name="sortBy"
                defaultValue={filters.sortBy}
                className="px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              >
                <option value="volume">Volume</option>
                <option value="marketCap">Market Cap</option>
                <option value="priceChange24h">24h Price Change</option>
                <option value="holders">Holders</option>
              </select>
              <select 
                name="sortDir"
                defaultValue={filters.sortDir}
                className="px-3 py-2 bg-black border border-green-500/30 rounded text-green-500"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 