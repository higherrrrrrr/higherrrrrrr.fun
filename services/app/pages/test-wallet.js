"use client";

import React from 'react';
import TestWalletConnection from '../components/TestWalletConnection';
import { Web3Provider } from '../components/Web3Provider';

export default function TestWalletPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6 text-green-500">Wallet Connection Test</h1>
      <TestWalletConnection />
    </div>
  );
} 