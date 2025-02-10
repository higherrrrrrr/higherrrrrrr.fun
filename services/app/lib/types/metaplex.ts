import { PublicKey } from '@solana/web3.js';

export interface MetaplexMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: {
    address: PublicKey;
    verified: boolean;
    share: number;
  }[];
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;
  tokenStandard: number | null;
  collection: {
    verified: boolean;
    key: PublicKey;
  } | null;
  uses: {
    useMethod: number;
    remaining: number;
    total: number;
  } | null;
}

export interface MetaplexToken {
  mint: PublicKey;
  metadata: MetaplexMetadata;
  edition?: {
    isOriginal: boolean;
    supply: number;
    maxSupply: number;
  };
}

export interface MetaplexNftJson {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface MetaplexNft {
  name: string;
  symbol: string;
  json?: MetaplexNftJson;
  mint: PublicKey;
  updateAuthority: PublicKey;
  sellerFeeBasisPoints: number;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;
  tokenStandard: number | null;
} 