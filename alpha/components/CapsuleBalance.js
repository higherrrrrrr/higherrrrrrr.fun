import { useCapsuleBalance } from "@usecapsule/react-sdk";
import { formatEther } from "viem";

export function CapsuleBalance({ address }) {
  const { data: balance } = useCapsuleBalance({
    address: address,
  });

  if (!balance) return null;

  return (
    <div className="font-mono">
      {formatEther(balance.value)} {balance.symbol}
    </div>
  );
} 