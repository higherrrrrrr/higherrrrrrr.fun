import { useCapsuleSigner } from "@usecapsule/react-sdk";
import { ethers } from "ethers";

export function useCapsuleContract(address, abi) {
  const { signer } = useCapsuleSigner();
  
  if (!signer || !address) return null;
  
  return new ethers.Contract(address, abi, signer);
} 