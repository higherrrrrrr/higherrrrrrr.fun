import Link from "next/link";

interface AddressProps {
  address: string;
  truncate?: boolean;
}

export function Address({ address, truncate = true }: AddressProps) {
  if (!address) {
    return null;
  }

  if (truncate) {
    const start = address?.slice(0, 6) || '';
    const end = address?.slice(-4) || '';
    return <span>{`${start}...${end}`}</span>;
  }

  return <span>{address}</span>;
}
