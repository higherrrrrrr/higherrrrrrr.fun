import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";

import {
  CapsuleModal,
  AuthLayout,
  OAuthMethod,
  ExternalWallet,
} from "@usecapsule/react-sdk";
import "@usecapsule/react-sdk/styles.css";
import { capsuleClient } from "@/client/capsule";

const PLEDGE_MESSAGE = `I am one of the faithful, a disciple of the cult of memes

We are going much, much higherrrrrr.

A new meta for memes. If you believe, pledge your allegiance.`;

export function PledgeContent() {
  const recoveredAddress = useRef<string>();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const {
    data: signMessageData,
    error: signError,
    signMessage,
  } = useSignMessage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (signMessageData) {
      const handleSignature = async () => {
        const recovered = await recoverMessageAddress({
          message: PLEDGE_MESSAGE,
          signature: signMessageData,
        });
        recoveredAddress.current = recovered;

        const tweet1 = `I am one of the faithful, a disciple of the cult of memes

We are going much, much higherrrrrr

Signature: ${signMessageData}

Pledge: https://higherrrrrrr.fun`;

        // Encode and open tweet
        const encodedTweet1 = encodeURIComponent(tweet1);
        window.location.href = `https://twitter.com/intent/tweet?text=${encodedTweet1}`;
      };

      handleSignature();
    }
  }, [signMessageData]);

  const handleDisconnect = async () => {
    await capsuleClient.logout();
    disconnect();
  };

  const handleModalClose = async () => {
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] space-y-8">
      {isConnected ? (
        <>
          <div className="flex flex-col items-center space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl md:text-3xl terminal-text">
                Your wallet is connected
                <span className="terminal-cursor">▊</span>
              </h1>
              <p className="text-lg opacity-80">
                Click below to sign the pledge and share it
              </p>
              <div className="mt-4">↓</div>
            </div>

            <button
              onClick={() => signMessage({ message: PLEDGE_MESSAGE })}
              className="border-2 border-green-500 px-8 py-4 text-lg hover:bg-green-500/10 transition-colors"
            >
              Sign & Share Pledge
            </button>

            <div className="flex flex-col items-center space-y-2 mt-8">
              {address && (
                <p className="text-sm opacity-60">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
              <button
                onClick={handleDisconnect}
                className="text-sm opacity-60 hover:opacity-100"
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-2xl md:text-3xl mb-4 terminal-text">
              Sign and tweet to pledge
              <span className="terminal-cursor">▊</span>
            </h1>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsOpen(true)}
              className="border-2 border-green-500 px-8 py-4 text-lg hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              Connect Wallet to Pledge
            </button>
            <CapsuleModal
              capsule={capsuleClient}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              appName="Higherrrrrrr"
              oAuthMethods={[]}
              disablePhoneLogin={true}
              disableEmailLogin={true}
              authLayout={[AuthLayout.EXTERNAL_FULL]}
              theme={{
                mode: "dark",
                darkBackgroundColor: "#09090b",
                darkForegroundColor: "#22c55e",
                darkAccentColor: "#00ff00",
              }}
              externalWallets={[
                ExternalWallet.METAMASK,
                ExternalWallet.COINBASE,
                // ExternalWallet.WALLETCONNECT,
              ]}
            />

            <p className="text-sm opacity-60">
              Don't have a wallet?{" "}
              <a
                href="https://www.coinbase.com/wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 underline"
              >
                Download Coinbase Wallet
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
