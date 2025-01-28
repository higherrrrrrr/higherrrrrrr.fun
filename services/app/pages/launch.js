import styles from '../styles/LaunchToken.module.css';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from '../components/Web3Provider';

export default function LaunchToken() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const { address: userAddress } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    supply: '',
    type: 'standard'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Your existing submit logic
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles['launch-container']}>
      <h1>Launch Your Token</h1>
      
      <div className={styles['progress-bar']} 
        style={{ '--progress': `${(step / totalSteps) * 100}%` }}>
      </div>

      <form className={styles['launch-form']} onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <label>Token Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter token name"
              required
            />

            <label>Token Symbol</label>
            <input 
              type="text" 
              placeholder="Enter token symbol (e.g. BTC)"
              required
              maxLength={5}
            />
          </>
        )}

        {step === 2 && (
          <>
            <label>Initial Supply</label>
            <input 
              type="number" 
              placeholder="Enter initial supply"
              required
              min="1"
            />

            <label>Token Type</label>
            <select required>
              <option value="standard">Standard Token</option>
              <option value="liquidity">Liquidity Token</option>
              <option value="rebase">Rebase Token</option>
            </select>
          </>
        )}

        {/* Additional steps would go here */}

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button 
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="neon-button"
            >
              Previous
            </button>
          )}
          
          {step < totalSteps ? (
            <button 
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="neon-button"
            >
              Next
            </button>
          ) : (
            <button 
              type="submit"
              className="neon-button"
            >
              Launch Token
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 