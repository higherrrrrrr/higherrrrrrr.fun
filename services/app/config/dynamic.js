import { base } from 'wagmi/chains';


export const DYNAMIC_CONFIG = {
  environmentId: "9ca9ebfd-20de-4e6f-8705-8aa8c3b556db",
  theme: {
    mode: "dark",
  },
  walletConnectors: [], // Wallet connectors will be provided by the provider
  termsOfServiceUrl: "https://higherrrrrrr.fun/tos",
  initialAuthenticationMode: "connect-only",
  networkValidationMode: "always",
  walletConnectPreferredChains: [`eip155:${base.id}`],
  cssOverrides: `
.dynamic-modal {
    background-color: #000; /* Your app's background color */
    color: #22c55e;        /* Your app's text color */
    font-family: "Pixelify Mono", monospace; /* Your app's font */
    border: 2px solid rgba(34, 197, 94, 0.2); /* Example border */
    border-radius: 12px; /* Example border radius */
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.15); /* Example shadow */
  }

  .dynamic-modal-content {
    padding: 2rem; /* Adjust padding as needed */
  }

  .dynamic-modal-header {
    color: #22c55e; /* Header text color */
    font-size: 1.5rem; /* Header font size */
    font-weight: bold;
  }

  .dynamic-modal-body {
    color: #22c55e; /* Body text color */
  }

  .dynamic-button {
    background-color: #00FF00; /* Button background color */
    color: #000;              /* Button text color */
    font-weight: bold;        /* Button font weight */
    border-radius: 4px;       /* Button border radius */
    padding: 0.75rem 1.5rem;  /* Button padding */
    transition: all 0.2s ease-in-out; /* Smooth transition on hover */
  }

  .dynamic-button:hover {
    background-color: #4ade80; /* Button hover background color */
    color: #000;              /* Button hover text color */
  }
  `,
  theme: {
    mode: "dark",
    colors: {
      primary: '#000000',
      secondary: '#22c55e',
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
