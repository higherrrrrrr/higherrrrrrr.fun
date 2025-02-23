import * as yup from 'yup';

const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const balanceHistorySchema = yup.object({
  wallet: yup.string()
    .required()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
});

export const snapshotBalanceSchema = yup.object({
  wallet: yup.string()
    .required()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address'),
  totalValue: yup.number()
    .required()
    .min(0, 'Total value must be non-negative')
});

export const heliusAssetsSchema = yup.object({
  owner: yup.string()
    .required()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
});

export const achievementSchema = yup.object({
  wallet: yup.string()
    .required()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address'),
  tokenMint: yup.string()
    .required()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid token mint address'),
  txSignature: yup.string()
    .required()
    .min(32, 'Invalid transaction signature'),
  volume: yup.number()
    .min(0, 'Volume must be non-negative')
    .default(0)
});

export const quoteSchema = yup.object({
  sellToken: yup.string().required(),
  buyToken: yup.string().required(),
  sellAmount: yup.string().required()
});

export const achievementProgressSchema = yup.object({
  wallet: yup.string()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
    .required('Wallet address is required')
});

export const achievementCheckSchema = yup.object({
  wallet: yup.string()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
    .required('Wallet address is required'),
  tokenMint: yup.string()
    .matches(SOLANA_ADDRESS_REGEX, 'Invalid token mint address')
    .required('Token mint is required'),
  txSignature: yup.string()
    .required('Transaction signature is required'),
  volume: yup.number()
    .transform((value) => Number(value))
    .min(0, 'Volume must be positive')
    .max(1000000, 'Volume exceeds maximum allowed')
    .precision(9) // Handle up to 9 decimal places
    .nullable()
});

export const leaderboardSchema = yup.object({
  timeframe: yup.string().oneOf(['7d', '30d', 'all']),
  type: yup.string().oneOf(['volume', 'trades', 'achievements'])
}); 