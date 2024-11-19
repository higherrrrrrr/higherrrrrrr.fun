// src/DynamicMeme.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./Wow.sol";

contract DynamicMeme is Wow {
    struct MemeLevel {
        uint256 priceThreshold;
        string memeName;
    }

    MemeLevel[] public memeLevels;
    string private currentMeme;
    string public memeType; // e.g. "length", "pepe", "doge", etc.

    address private cachedToken0;
    address private cachedToken1;
    bool private tokensInitialized;

    event MemeEvolved(string oldMeme, string newMeme, uint256 price);

    constructor(
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _nonfungiblePositionManager,
        address _swapRouter
    ) Wow(_protocolFeeRecipient, _protocolRewards, _weth, _nonfungiblePositionManager, _swapRouter) {
        // You can add any additional constructor logic here if needed
    }

    function initialize(
        address _tokenCreator,
        address _platformReferrer,
        address _bondingCurve,
        string memory _tokenURI,
        string memory _symbol,
        string memory _memeType,
        MemeLevel[] memory _initialLevels
    ) public payable initializer {
        require(_initialLevels.length > 0, "Need at least one meme level");

        // Set up meme levels
        for(uint256 i = 0; i < _initialLevels.length; i++) {
            memeLevels.push(_initialLevels[i]);
        }

        memeType = _memeType;
        currentMeme = _initialLevels[0].memeName;

        // Call the updated super.initialize with the adjusted parameters
        super.initialize(
            _tokenCreator,
            _platformReferrer,
            _bondingCurve,
            _tokenURI,
            currentMeme, // Initial name
            _symbol
        );
    }


    function name() public view override returns (string memory) {
        return currentMeme;
    }

    // Add this function to initialize token addresses
    function _initializeTokenAddresses() internal {
        if (!tokensInitialized && marketType == MarketType.UNISWAP_POOL) {
            IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);
            cachedToken0 = pool.token0();
            cachedToken1 = pool.token1();
            tokensInitialized = true;
        }
    }

    // Modify getCurrentPrice to use cached values
    function getCurrentPrice() public view returns (uint256) {
        if(marketType != MarketType.UNISWAP_POOL || !tokensInitialized) {
            return 0;
        }

        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);
        IUniswapV3Pool.Slot0 memory slot = pool.slot0();
        uint160 sqrtPriceX96 = slot.sqrtPriceX96;

        uint256 price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * (10**18) >> (96 * 2);

        if(cachedToken1 == WETH) {
            price = (10**36) / price;
        }

        return price;
    }

    function updateMeme() public {
        uint256 currentPrice = getCurrentPrice();
        string memory newMeme = memeLevels[0].memeName;

        for(uint256 i = 0; i < memeLevels.length; i++) {
            if(currentPrice >= memeLevels[i].priceThreshold) {
                newMeme = memeLevels[i].memeName;
            }
        }

        if (keccak256(bytes(newMeme)) != keccak256(bytes(currentMeme))) {
            string memory oldMeme = currentMeme;
            currentMeme = newMeme;
            emit MemeEvolved(oldMeme, newMeme, currentPrice);
        }
    }

    function buy(
        address recipient,
        address refundRecipient,
        address orderReferrer,
        string memory comment,
        MarketType expectedMarketType,
        uint256 minOrderSize,
        uint160 sqrtPriceLimitX96
    ) public payable override nonReentrant returns (uint256) {
        uint256 bought = super.buy(
            recipient,
            refundRecipient,
            orderReferrer,
            comment,
            expectedMarketType,
            minOrderSize,
            sqrtPriceLimitX96
        );

        if(marketType == MarketType.UNISWAP_POOL) {
            updateMeme();
        }

        return bought;
    }


    function sell(
        uint256 tokensToSell,
        address recipient,
        address orderReferrer,
        string memory comment,
        MarketType expectedMarketType,
        uint256 minPayoutSize,
        uint160 sqrtPriceLimitX96
    ) public override nonReentrant returns (uint256) {  // Changed to public to match parent
        uint256 sold = super.sell(
            tokensToSell,
            recipient,
            orderReferrer,
            comment,
            expectedMarketType,
            minPayoutSize,
            sqrtPriceLimitX96
        );

        if(marketType == MarketType.UNISWAP_POOL) {
            updateMeme();
        }

        return sold;
    }

    // Admin function
    function getMemeLevelsCount() public view returns (uint256) {
        return memeLevels.length;
    }

    // Get all meme levels in one call for frontend
    function getAllMemeLevels() public view returns (MemeLevel[] memory) {
        MemeLevel[] memory levels = new MemeLevel[](memeLevels.length);

        for(uint256 i = 0; i < memeLevels.length; i++) {
            levels[i] = memeLevels[i];
        }

        return levels;
    }

    // Get full state for frontend
    function getMemeState() public view returns (
        string memory currentMemeName,
        string memory currentMemeType,
        uint256 currentPrice,
        MemeLevel[] memory levels
    ) {
        return (
            currentMeme,
            memeType,
            getCurrentPrice(),
            getAllMemeLevels()
        );
    }

}