import { base } from 'wagmi/chains';

const ENV = process.env.NEXT_PUBLIC_ENV || 'development';

const ENVIRONMENT_IDS = {
  development: "dev-environment-id",
  production: "0b53ea18-7f91-4cb4-ba13-4706021bcedb",
};

export const DYNAMIC_CONFIG = {
  environmentId: "0b53ea18-7f91-4cb4-ba13-4706021bcedb",
  walletConnectors: [], // We'll import these in the provider
  initialAuthenticationMode: "connect-only",
  networkValidationMode: "always",
  walletConnectPreferredChains: [`eip155:${base.id}`],
  cssOverrides: `
    .wallet-list-item__tile { 
      font-family: monospace;
      background-color: #000000;
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .wallet-list-item__tile:hover {
      background-color: rgba(34, 197, 94, 0.1);
    }
  `,
  theme: {
    mode: "dark",
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      text: "#22c55e",
      background: "#000000",
    },
  },
  mobileExperience: "in-app-browser",
  events: {
    onAuthSuccess: (data) => {
      console.log("Dynamic auth success:", data);
    },
    onAuthError: (error) => {
      console.error("Dynamic auth error:", error);
    },
    onLogout: () => {
      console.log("Dynamic logout");
    },
  },
  siweStatement: "Sign in to Higherrrrrrr",
  newToWeb3WalletChainMap: {
    [base.id]: ["metamask", "walletconnect", "rabby"],
  },
}; 