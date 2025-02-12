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
      sortBy: 'volume',
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
    console.log('Applying preset:', presetKey, PRESET_FILTERS[presetKey].filters); // Debug log
    setActivePreset(presetKey);
    onUpdateFilters(PRESET_FILTERS[presetKey].filters);
    setIsOpen(false); // Close custom filters when applying preset
  };

  const handleClearAll = () => {
    setActivePreset(null);
    // Reset all form inputs to their default state
    if (formRef.current) {
      formRef.current.reset();
      // Clear any custom number inputs
      const numberInputs = formRef.current.querySelectorAll('input[type="number"]');
      numberInputs.forEach(input => {
        input.value = '';
      });
    }
    onClearAll();
    setIsOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-green-500 hover:text-green-400"
        >
          <span>Filters</span>
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
      <div className="flex flex-wrap gap-2">
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

      {/* Custom Filters Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 
                 text-green-500 rounded-lg transition-colors"
      >
        {isOpen ? 'Hide Custom Filters' : 'Show Custom Filters'} 
      </button>

      {/* Custom Filter Form */}
      {isOpen && (
        <form 
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newFilters = {
              minVolume: formData.get('minVolume') ? Number(formData.get('minVolume')) : 0,
              maxVolume: formData.get('maxVolume') ? Number(formData.get('maxVolume')) : Infinity,
              minHolders: formData.get('minHolders') ? Number(formData.get('minHolders')) : 0,
              maxHolders: formData.get('maxHolders') ? Number(formData.get('maxHolders')) : Infinity,
              minTransactionSize: formData.get('minTransactionSize') ? Number(formData.get('minTransactionSize')) : 0,
              minTrades: formData.get('minTrades') ? Number(formData.get('minTrades')) : 0,
              sortBy: formData.get('sortBy') || 'volume',
              sortDir: formData.get('sortDir') || 'desc'
            };
            onUpdateFilters(newFilters);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg"
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

          {/* Other filter inputs remain the same */}
          
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 text-green-500/70 hover:text-green-500 transition-colors"
            >
              Reset All
            </button>
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