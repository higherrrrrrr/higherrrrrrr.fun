'use client';

import { useUiMode } from '../contexts/UiModeContext';

export function UiModeToggle() {
  const { mode, setMode } = useUiMode();
  
  return (
    <button 
      onClick={() => setMode(mode === 'retail' ? 'advanced' : 'retail')}
      className="mode-toggle"
    >
      Switch to {mode === 'retail' ? 'Advanced' : 'Basic'} Mode
    </button>
  );
} 