// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/* 
    !!!         !!!         !!!    
    !!!         !!!         !!!    
    !!!         !!!         !!!    
    !!!         !!!         !!!    
    !!!         !!!         !!!    
    !!!         !!!         !!!    

    WOW         WOW         WOW    
*/
interface IWow {
    /// @notice Thrown when an operation is attempted with a zero address
    error AddressZero();

    /// @notice Thrown when an invalid market type is specified
    error InvalidMarketType();

    /// @notice Thrown when there are insufficient funds for an operation
    error InsufficientFunds();

    /// @notice Thrown when there is insufficient liquidity for a transaction
    error InsufficientLiquidity();

    /// @notice Thrown when the slippage bounds are exceeded during a transaction
    error SlippageBoundsExceeded();

    /// @notice Thrown when the initial order size is too large
    error InitialOrderSizeTooLarge();

    /// @notice Thrown when the ETH amount is too small for a transaction
    error EthAmountTooSmall();

    /// @notice Thrown when an ETH transfer fails
    error EthTransferFailed();

    /// @notice Thrown when an operation is attempted by an entity other than the pool
    error OnlyPool();

    /// @notice Thrown when an operation is attempted by an entity other than WETH
    error OnlyWeth();

    /// @notice Thrown when a market is not yet graduated
    error MarketNotGraduated();

    /// @notice Thrown when a market is already graduated
    error MarketAlreadyGraduated();

    /// @notice Represents the type of market
    enum MarketType {
        BONDING_CURVE,
        UNISWAP_POOL
    }

    /// @notice Represents the state of the market
    struct MarketState {
        MarketType marketType;
        address marketAddress;
    }

    /// @notice Emitted when a Wow token is bought
    /// @param buyer The address of the buyer
    /// @param recipient The address of the recipient
    /// @param orderReferrer The address of the order referrer
    /// @param totalEth The total ETH involved in the transaction
    /// @param ethFee The ETH fee for the transaction
    /// @param ethSold The amount of ETH sold
    /// @param tokensBought The number of tokens bought
    /// @param buyerTokenBalance The token balance of the buyer after the transaction
    /// @param comment A comment associated with the transaction
    /// @param totalSupply The total supply of tokens after the buy
    /// @param marketType The type of market
    event WowTokenBuy(
        address indexed buyer,
        address indexed recipient,
        address indexed orderReferrer,
        uint256 totalEth,
        uint256 ethFee,
        uint256 ethSold,
        uint256 tokensBought,
        uint256 buyerTokenBalance,
        string comment,
        uint256 totalSupply,
        MarketType marketType
    );

    /// @notice Emitted when a Wow token is sold
    /// @param seller The address of the seller
    /// @param recipient The address of the recipient
    /// @param orderReferrer The address of the order referrer
    /// @param totalEth The total ETH involved in the transaction
    /// @param ethFee The ETH fee for the transaction
    /// @param ethBought The amount of ETH bought
    /// @param tokensSold The number of tokens sold
    /// @param sellerTokenBalance The token balance of the seller after the transaction
    /// @param comment A comment associated with the transaction
    /// @param totalSupply The total supply of tokens after the sell
    /// @param marketType The type of market
    event WowTokenSell(
        address indexed seller,
        address indexed recipient,
        address indexed orderReferrer,
        uint256 totalEth,
        uint256 ethFee,
        uint256 ethBought,
        uint256 tokensSold,
        uint256 sellerTokenBalance,
        string comment,
        uint256 totalSupply,
        MarketType marketType
    );

    /// @notice Emitted when Wow tokens are transferred
    /// @param from The address of the sender
    /// @param to The address of the recipient
    /// @param amount The amount of tokens transferred
    /// @param fromTokenBalance The token balance of the sender after the transfer
    /// @param toTokenBalance The token balance of the recipient after the transfer
    /// @param totalSupply The total supply of tokens after the transfer
    event WowTokenTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fromTokenBalance,
        uint256 toTokenBalance,
        uint256 totalSupply
    );

    /// @notice Emitted when fees are distributed
    /// @param tokenCreator The address of the token creator
    /// @param platformReferrer The address of the platform referrer
    /// @param orderReferrer The address of the order referrer
    /// @param protocolFeeRecipient The address of the protocol fee recipient
    /// @param tokenCreatorFee The fee for the token creator
    /// @param platformReferrerFee The fee for the platform referrer
    /// @param orderReferrerFee The fee for the order referrer
    /// @param protocolFee The protocol fee
    event WowTokenFees(
        address indexed tokenCreator,
        address indexed platformReferrer,
        address indexed orderReferrer,
        address protocolFeeRecipient,
        uint256 tokenCreatorFee,
        uint256 platformReferrerFee,
        uint256 orderReferrerFee,
        uint256 protocolFee
    );

    /// @notice Emitted when a market graduates
    /// @param tokenAddress The address of the token
    /// @param poolAddress The address of the pool
    /// @param totalEthLiquidity The total ETH liquidity in the pool
    /// @param totalTokenLiquidity The total token liquidity in the pool
    /// @param lpPositionId The ID of the liquidity position
    /// @param marketType The type of market
    event WowMarketGraduated(
        address indexed tokenAddress,
        address indexed poolAddress,
        uint256 totalEthLiquidity,
        uint256 totalTokenLiquidity,
        uint256 lpPositionId,
        MarketType marketType
    );

    /// @notice Buys tokens from the bonding curve or Uniswap V3 pool depending on the market state.
    /// @param recipient The address to receive the purchased tokens
    /// @param refundRecipient The address to receive any excess ETH
    /// @param orderReferrer The address of the order referrer
    /// @param comment A comment associated with the buy order
    /// @param expectedMarketType The expected market type (0 = BONDING_CURVE, 1 = UNISWAP_POOL)
    /// @param minOrderSize The minimum size of the order to prevent slippage, ignored if market is uniswap pool.
    /// @param sqrtPriceLimitX96 The price limit for Uniswap V3 pool swaps, ignored if market is bonding curve.
    function buy(
        address recipient,
        address refundRecipient,
        address orderReferrer,
        string memory comment,
        MarketType expectedMarketType,
        uint256 minOrderSize,
        uint160 sqrtPriceLimitX96
    ) external payable returns (uint256);

    /// @notice Sells tokens to the bonding curve or Uniswap V3 pool depending on the market state
    /// @param tokensToSell The number of tokens to sell
    /// @param recipient The address to receive the ETH payout
    /// @param orderReferrer The address of the order referrer
    /// @param comment A comment associated with the sell order
    /// @param expectedMarketType The expected market type (0 = BONDING_CURVE, 1 = UNISWAP_POOL)
    /// @param minPayoutSize The minimum payout size to prevent slippage, ignored if market is uniswap pool.
    /// @param sqrtPriceLimitX96 The price limit for Uniswap V3 pool swaps, ignored if market is bonding curve.
    function sell(
        uint256 tokensToSell,
        address recipient,
        address orderReferrer,
        string memory comment,
        MarketType expectedMarketType,
        uint256 minPayoutSize,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256);

    /// @notice Allows a holder to burn their tokens after the market has graduated
    /// @dev Emits a WowTokenTransfer event with the updated token balances and total supply
    /// @param tokensToBurn The number of tokens to burn
    function burn(uint256 tokensToBurn) external;

    /// @notice Provides a quote for buying tokens with a given amount of ETH
    /// @param amount The amount of ETH
    /// @return The number of tokens that can be bought
    function getEthBuyQuote(uint256 amount) external view returns (uint256);

    /// @notice Provides a quote for selling a given number of tokens
    /// @param amount The number of tokens
    /// @return The amount of ETH that can be received
    function getTokenSellQuote(uint256 amount) external view returns (uint256);

    /// @notice Returns the current state of the market
    /// @return The market state
    function state() external view returns (MarketState memory);

    /// @notice Returns the URI of the token
    /// @return The token URI
    function tokenURI() external view returns (string memory);

    /// @notice Returns the address of the token creator
    /// @return The token creator's address
    function tokenCreator() external view returns (address);

    /// @notice Returns the address of the platform referrer
    /// @return The platform referrer's address
    function platformReferrer() external view returns (address);

    // Add this to the interface (with the other function declarations)
    /// @notice Returns the name of the token
    /// @return The token name
    function name() external view returns (string memory);
}