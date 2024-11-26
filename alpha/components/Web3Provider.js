import { WagmiConfig, createConfig } from 'wagmi';
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from 'connectkit';
import { mainnet, sepolia } from 'wagmi/chains';

const config = createConfig(
  getDefaultConfig({
    // Your walletConnect v2 project id
    walletConnectProjectId: "a893723ca57a205513119f91ba5c09c8",
    
    // Required
    appName: "Higherrrrrrr",
    
    // Optional
    appDescription: "Evolving meme tokens platform",
    appUrl: "https://higherrrrrrr.fun",
    appIcon: "https://higherrrrrrr.fun/icon.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
    
    // Configure supported chains
    chains: [mainnet, sepolia]
  }),
);

export function Web3Provider({ children }) {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider theme="retro">
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

// Export the button component for easy access
export { ConnectKitButton }; 