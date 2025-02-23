'use client';

import { useState, useEffect } from "react";
import DynamicProvider from "./DynamicProvider";
import TVPanel from "./TVPanel";
import DynamicConnectButton from "./DynamicConnectButton";
import ClientOnly from "./ClientOnly";
import Script from 'next/script';
import posthog from 'posthog-js';
import { usePathname } from 'next/navigation';
import { UiModeProvider } from '../contexts/UiModeContext';
import dynamic from 'next/dynamic';

const WalletProvider = dynamic(
  () => import('../providers/WalletProvider').then(mod => mod.WalletProvider),
  { ssr: false }
);

// PostHog initialization code stays here
if (typeof window !== 'undefined') {
  posthog.init('phc_QObbSAeS9Bc3rBhOtDD0M5JUp5RDmPDQZVsmNQVXnFp', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
      posthog.reloadFeatureFlags();
    }
  });
}

export function RootClientWrapper({ children }) {
  return (
    <UiModeProvider>
      <WalletProvider>
        <DynamicProvider>
          {children}
        </DynamicProvider>
      </WalletProvider>
    </UiModeProvider>
  );
} 