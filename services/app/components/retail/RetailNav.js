'use client';

import React from 'react';
import Link from 'next/link';
import { GlowBorder } from '../GlowBorder';

export function RetailNav() {
  return (
    <nav className="w-full border-b border-green-500/20 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex gap-6 justify-center">
          <li>
            <Link 
              href="/retail/portfolio" 
              className="text-green-500/80 hover:text-green-400 transition-colors"
            >
              Portfolio
            </Link>
          </li>
          <li>
            <Link 
              href="/retail/trade"
              className="text-green-500/80 hover:text-green-400 transition-colors"
            >
              Trade
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
} 