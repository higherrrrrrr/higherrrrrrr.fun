import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicProvider = ({ children }) => {
  return (
    <DynamicContextProvider
      settings={{
        ...DYNAMIC_CONFIG,
        theme: 'dark', 
        walletConnectors: [
          EthereumWalletConnectors,
          SolanaWalletConnectors,
        ],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
};

export default DynamicProvider;
