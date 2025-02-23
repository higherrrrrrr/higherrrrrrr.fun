'use client';

import { UiModeProvider } from '../../contexts/UiModeContext';

export function Providers({ children }) {
  return (
    <UiModeProvider>
      {children}
    </UiModeProvider>
  );
} 