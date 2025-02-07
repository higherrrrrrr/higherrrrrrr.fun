'use client';
import { TokenPageWrapper } from '../../../components/token/evm/TokenPageWrapper';
import { TokenPage as EvmTokenPage } from '../../../components/token/evm/TokenPage';
import { isValidEvmAddress } from '../../../utils/address';
import { useParams } from 'next/navigation';

export default function TokenPage({ addressProp }) {
  const params = useParams();
  const address = addressProp || params.address;
  
  // Default to Solana, check if it's an EVM address
  const isEvmToken = isValidEvmAddress(address);
  
  if (isEvmToken) {
    return <EvmTokenPage addressProp={address} />;
  }
  
  return <TokenPageWrapper addressProp={address} />;
} 