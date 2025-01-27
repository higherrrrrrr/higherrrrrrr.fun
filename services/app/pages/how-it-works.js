import styles from '../styles/HowItWorks.module.css';

export default function HowItWorks() {
  return (
    <div className={styles['how-container']}>
      <h1>How It Works</h1>

      <div className={styles['how-step']}>
        <h3>1. Connect Your Wallet</h3>
        <p>
          Start by connecting your Web3 wallet. We support MetaMask, WalletConnect, 
          and other popular wallets on Base network.
        </p>
      </div>

      <div className={styles['how-step']}>
        <h3>2. Choose Your Token Type</h3>
        <p>
          Select from our range of token templates: Standard ERC20, Liquidity-backed, 
          or Advanced tokens with custom mechanics.
        </p>
      </div>

      <div className={styles['how-step']}>
        <h3>3. Configure Parameters</h3>
        <p>
          Set your token's initial parameters including:
        </p>
        <ul>
          <li>Total supply</li>
          <li>Token name and symbol</li>
          <li>Distribution mechanics</li>
          <li>Trading parameters</li>
        </ul>
      </div>

      <div className={styles['how-step']}>
        <h3>4. Launch & Verify</h3>
        <p>
          Deploy your token with one click. Your contract will be automatically 
          verified on Basescan and listed on our platform.
        </p>
      </div>

      <div className={styles['how-step']}>
        <h3>5. Manage Your Token</h3>
        <p>
          Access your dashboard to monitor performance, manage parameters, and 
          interact with your community through our platform.
        </p>
      </div>
    </div>
  );
} 