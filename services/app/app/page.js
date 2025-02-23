// pages/index.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useHomepage } from '../hooks/useHomepage';
import { SolanaTokenCard } from '../components/SolanaTokenCard';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';
import { GlowBorder } from '../components/GlowBorder.js';
import debounce from 'lodash/debounce'; // You may need to install lodash
import { useTokenSearch } from '../hooks/useTokenSearch';
import useSWR from 'swr';
import { SolanaTokenList } from '../components/SolanaTokenCard';
import { useTokenFilter } from '../hooks/useTokenFilter';
import { TokenFilters } from '../components/TokenFilters';
import { TokenDisplay } from '../components/TokenDisplay';
import { processTokens } from '../utils/tokenProcessing';
import { useUiMode } from '../contexts/UiModeContext';
import { RetailHome } from '../components/retail/RetailHome';
import { AdvancedHome } from '../components/advanced/AdvancedHome';

// Define fetcher if not already defined
const fetcher = url => fetch(url).then(res => res.json());

export default function HomePage() {
  const { mode } = useUiMode();

  if (mode === 'advanced') {
    return <AdvancedHome />;
  }

  // Default to retail view
  return <RetailHome />;
}

export async function generateStaticParams() {
  return {
    paths: [
      { mode: 'retail' },
      { mode: 'advanced' }
    ],
    fallback: true
  };
}