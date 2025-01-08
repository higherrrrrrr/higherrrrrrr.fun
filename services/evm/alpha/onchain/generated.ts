//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Higherrrrrrr
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const higherrrrrrrAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_feeRecipient', internalType: 'address', type: 'address' },
      { name: '_weth', internalType: 'address', type: 'address' },
      {
        name: '_nonfungiblePositionManager',
        internalType: 'address',
        type: 'address',
      },
      { name: '_swapRouter', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'CONVICTION_THRESHOLD',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TOTAL_SUPPLY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_ORDER_SIZE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'TOTAL_FEE_BPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WETH',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'bondingCurve',
    outputs: [
      { name: '', internalType: 'contract BondingCurve', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokensToBurn', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'refundRecipient', internalType: 'address', type: 'address' },
      { name: 'comment', internalType: 'string', type: 'string' },
      {
        name: 'expectedMarketType',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
      },
      { name: 'minOrderSize', internalType: 'uint256', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'buy',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'convictionNFT',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'currentExchangeRate',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'feeRecipient',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getCurrentPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'ethOrderSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getEthBuyQuote',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'ethOrderSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getEthSellQuote',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getPriceLevels',
    outputs: [
      {
        name: '',
        internalType: 'struct IHigherrrrrrr.PriceLevel[]',
        type: 'tuple[]',
        components: [
          { name: 'price', internalType: 'uint256', type: 'uint256' },
          { name: 'name', internalType: 'string', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenOrderSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenBuyQuote',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenOrderSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenSellQuote',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_bondingCurve', internalType: 'address', type: 'address' },
      { name: '_tokenURI', internalType: 'string', type: 'string' },
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_symbol', internalType: 'string', type: 'string' },
      {
        name: '_priceLevels',
        internalType: 'struct IHigherrrrrrr.PriceLevel[]',
        type: 'tuple[]',
        components: [
          { name: 'price', internalType: 'uint256', type: 'uint256' },
          { name: 'name', internalType: 'string', type: 'string' },
        ],
      },
      { name: '_convictionNFT', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'marketType',
    outputs: [
      {
        name: '',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nonfungiblePositionManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'numPriceLevels',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'poolAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'priceLevels',
    outputs: [
      { name: 'price', internalType: 'uint256', type: 'uint256' },
      { name: 'name', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokensToSell', internalType: 'uint256', type: 'uint256' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'comment', internalType: 'string', type: 'string' },
      {
        name: 'expectedMarketType',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
      },
      { name: 'minPayoutSize', internalType: 'uint256', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'sell',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'state',
    outputs: [
      {
        name: '',
        internalType: 'struct IHigherrrrrrr.MarketState',
        type: 'tuple',
        components: [
          {
            name: 'marketType',
            internalType: 'enum IHigherrrrrrr.MarketType',
            type: 'uint8',
          },
          { name: 'marketAddress', internalType: 'address', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'swapRouter',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0Delta', internalType: 'int256', type: 'int256' },
      { name: 'amount1Delta', internalType: 'int256', type: 'int256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'uniswapV3SwapCallback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'poolAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalEthLiquidity',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalTokenLiquidity',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'lpPositionId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'marketType',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'HigherrrrrrMarketGraduated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'buyer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalEth',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'ethFee',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'ethSold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'tokensBought',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'buyerTokenBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'comment',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'totalSupply',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'marketType',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'HigherrrrrrTokenBuy',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'feeRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'fee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'HigherrrrrrTokenFees',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'seller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalEth',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'ethFee',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'ethBought',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'tokensSold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'sellerTokenBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'comment',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'totalSupply',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'marketType',
        internalType: 'enum IHigherrrrrrr.MarketType',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'HigherrrrrrTokenSell',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'fromTokenBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'toTokenBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalSupply',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'HigherrrrrrTokenTransfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AddressZero' },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  { type: 'error', inputs: [], name: 'EthAmountTooSmall' },
  { type: 'error', inputs: [], name: 'EthTransferFailed' },
  { type: 'error', inputs: [], name: 'InitialOrderSizeTooLarge' },
  { type: 'error', inputs: [], name: 'InsufficientFunds' },
  { type: 'error', inputs: [], name: 'InsufficientLiquidity' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'InvalidMarketType' },
  { type: 'error', inputs: [], name: 'InvalidPriceLevels' },
  { type: 'error', inputs: [], name: 'MarketAlreadyGraduated' },
  { type: 'error', inputs: [], name: 'MarketNotGraduated' },
  { type: 'error', inputs: [], name: 'NoPriceLevels' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  { type: 'error', inputs: [], name: 'OnlyPool' },
  { type: 'error', inputs: [], name: 'OnlyWeth' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'SlippageBoundsExceeded' },
  { type: 'error', inputs: [], name: 'TooManyPriceLevels' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HigherrrrrrrFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1)
 * -
 */
export const higherrrrrrrFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_feeRecipient', internalType: 'address', type: 'address' },
      { name: '_weth', internalType: 'address', type: 'address' },
      {
        name: '_nonfungiblePositionManager',
        internalType: 'address',
        type: 'address',
      },
      { name: '_swapRouter', internalType: 'address', type: 'address' },
      { name: '_bondingCurve', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'bondingCurve',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'convictionImplementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'uri', internalType: 'string', type: 'string' },
      {
        name: 'levels',
        internalType: 'struct IHigherrrrrrr.PriceLevel[]',
        type: 'tuple[]',
        components: [
          { name: 'price', internalType: 'uint256', type: 'uint256' },
          { name: 'name', internalType: 'string', type: 'string' },
        ],
      },
    ],
    name: 'createHigherrrrrrr',
    outputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'conviction', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'feeRecipient',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nonfungiblePositionManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'swapRouter',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'weth',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'conviction',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'NewToken',
  },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  { type: 'error', inputs: [], name: 'ZeroAddress' },
] as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1)
 * -
 */
export const higherrrrrrrFactoryAddress = {
  8453: '0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1',
  31337: '0x158d291D8b47F056751cfF47d1eEcd19FDF9B6f8',
} as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1)
 * -
 */
export const higherrrrrrrFactoryConfig = {
  address: higherrrrrrrFactoryAddress,
  abi: higherrrrrrrFactoryAbi,
} as const
