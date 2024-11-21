// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("wow.diamond.storage");

    // Constants
    uint256 constant MAX_TOTAL_SUPPLY = 1_000_000_000e18; // 1B tokens
    uint256 constant PRIMARY_MARKET_SUPPLY = 800_000_000e18; // 800M tokens
    uint256 constant SECONDARY_MARKET_SUPPLY = 200_000_000e18; // 200M tokens

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition; // position in selectors array
    }

    struct MemeLevel {
        uint256 priceThreshold;
        string memeName;
    }

    struct ConvictionData {
        uint256 amount;
        uint256 timestamp;
        string memeState;
        uint256 price;
    }

    struct DiamondStorage {
        // Diamond specific storage
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        bytes4[] selectors;
        mapping(address => bool) facetAddresses;

        // Wow/DynamicMeme storage
        address weth;
        address nonfungiblePositionManager;
        address swapRouter;
        address protocolFeeRecipient;
        address protocolRewards;
        address bondingCurve;
        address platformReferrer;
        address poolAddress;
        address tokenCreator;

        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
        uint256 totalSupply;

        uint8 marketType; // 0 = BONDING_CURVE, 1 = UNISWAP_POOL
        string name;
        string symbol;
        string tokenURI;

        // DynamicMeme specific storage
        string currentMeme;
        string memeType;
        bool tokensInitialized;
        address cachedToken0;
        address cachedToken1;
        MemeLevel[] memeLevels;

        // Uniswap specific storage
        uint256 positionId;

        // NFT Conviction storage
        uint256 nextConvictionId;
        mapping(uint256 => address) convictionOwner;
        mapping(uint256 => ConvictionData) convictionData;
        mapping(address => mapping(address => bool)) convictionApprovals;
    }

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    event DiamondCut(address indexed facet, bytes4[] selectors, uint8 action);
}