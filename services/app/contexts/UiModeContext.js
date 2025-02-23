import React, { createContext, useContext, useState, useEffect } from 'react';

const UiModeContext = createContext(null);

export function UiModeProvider({ children }) {
  const [mode, setMode] = useState('retail'); // default to retail

  // On mount, check localStorage
  useEffect(() => {
    const storedMode = typeof window !== 'undefined' && localStorage.getItem('uiMode');
    if (storedMode === 'advanced') {
      setMode('advanced');
    }
  }, []);

  // Whenever mode changes, store it in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uiMode', mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(current => current === 'retail' ? 'advanced' : 'retail');
  };

  return (
    <UiModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </UiModeContext.Provider>
  );
}

export function useUiMode() {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error('useUiMode must be used within a UiModeProvider');
  }
  return context;
} 