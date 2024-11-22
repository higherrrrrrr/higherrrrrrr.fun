// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./Wow.sol";
import "./WowFeatureRegistry.sol";
import "./DynamicNameFeature.sol";
import "./ConvictionFeature.sol";
import "./BondingCurve.sol";
import "./interfaces/IWow.sol";
import "./interfaces/IWowFeature.sol";
import "./interfaces/IDynamicNameFeature.sol";
import "./interfaces/IConvictionFeature.sol";

/**
 * @title WowEnhancedFactory
 * @dev Factory contract for deploying Wow tokens with enhanced features
 */
contract WowEnhancedFactory {
    /// @notice Required protocol addresses
    address public immutable protocolFeeRecipient;
    address public immutable protocolRewards;
    address public immutable weth;
    address public immutable nonfungiblePositionManager;
    address public immutable swapRouter;

    event WowTokenDeployed(
        address indexed wowToken,
        address indexed creator,
        address indexed featureRegistry,
        address dynamicNameFeature,
        address convictionFeature,
        string baseTokenName,
        string symbol,
        uint256[] priceThresholds,
        string[] dynamicNames
    );

    struct NameConfig {
        uint256[] priceThresholds;
        string[] names;
    }

    constructor(
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _nonfungiblePositionManager,
        address _swapRouter
    ) {
        require(_protocolFeeRecipient != address(0), "Zero address: protocolFeeRecipient");
        require(_protocolRewards != address(0), "Zero address: protocolRewards");
        require(_weth != address(0), "Zero address: weth");
        require(_nonfungiblePositionManager != address(0), "Zero address: nonfungiblePositionManager");
        require(_swapRouter != address(0), "Zero address: swapRouter");

        protocolFeeRecipient = _protocolFeeRecipient;
        protocolRewards = _protocolRewards;
        weth = _weth;
        nonfungiblePositionManager = _nonfungiblePositionManager;
        swapRouter = _swapRouter;
    }

    /**
     * @notice Deploys a new Wow token with enhanced features
     * @param tokenCreator The address that will receive creator fees
     * @param platformReferrer The address that will receive platform referrer fees
     * @param tokenURI The URI for token metadata
     * @param baseTokenName The base name for the token
     * @param symbol The token symbol
     * @param nameConfig The configuration for dynamic naming
     */
    function deployWow(
        address tokenCreator,
        address platformReferrer,
        string memory tokenURI,
        string memory baseTokenName,
        string memory symbol,
        NameConfig calldata nameConfig
    ) external payable returns (address) {
        // Input validation
        _validateInputs(tokenCreator, baseTokenName, symbol, nameConfig);

        // Deploy core contracts
        (Wow wow, BondingCurve bondingCurve) = _deployCore(
            tokenCreator,
            platformReferrer,
            tokenURI,
            baseTokenName,
            symbol
        );

        // Deploy and setup features
        (address dynamicName, address conviction) = _setupFeatures(
            address(wow),
            nameConfig
        );

        emit WowTokenDeployed(
            address(wow),
            tokenCreator,
            address(wow.featureRegistry()),
            dynamicName,
            conviction,
            baseTokenName,
            symbol,
            nameConfig.priceThresholds,
            nameConfig.names
        );

        return address(wow);
    }

    function _validateInputs(
        address tokenCreator,
        string memory baseTokenName,
        string memory symbol,
        NameConfig calldata nameConfig
    ) internal pure {
        require(tokenCreator != address(0), "Zero address: tokenCreator");
        require(bytes(baseTokenName).length > 0, "Empty base name");
        require(bytes(symbol).length > 0, "Empty symbol");
        require(nameConfig.priceThresholds.length == nameConfig.names.length, "Config length mismatch");
        require(nameConfig.priceThresholds.length > 0, "Empty name config");

        for (uint256 i = 1; i < nameConfig.priceThresholds.length; i++) {
            require(
                nameConfig.priceThresholds[i] > nameConfig.priceThresholds[i-1],
                "Price thresholds not sorted"
            );
        }
    }

    function _deployCore(
        address tokenCreator,
        address platformReferrer,
        string memory tokenURI,
        string memory baseTokenName,
        string memory symbol
    ) internal returns (Wow wow, BondingCurve bondingCurve) {
        bondingCurve = new BondingCurve();

        // Deploy main Wow token first (without registry)
        wow = new Wow(
            protocolFeeRecipient,
            protocolRewards,
            weth,
            nonfungiblePositionManager,
            swapRouter,
            address(0) // Temporary zero address for registry
        );

        // Initialize Wow token
        wow.initialize{value: msg.value}(
            tokenCreator,
            platformReferrer,
            address(bondingCurve),
            tokenURI,
            baseTokenName,
            symbol
        );
    }

    function _setupFeatures(
        address wowToken,
        NameConfig calldata nameConfig
    ) internal returns (address dynamicName, address conviction) {
        // Deploy registry with correct Wow address
        WowFeatureRegistry registry = new WowFeatureRegistry(wowToken);

        // Deploy features
        dynamicName = address(new DynamicNameFeature());
        conviction = address(new ConvictionFeature());

        // Register features with initialization data
        registry.registerFeature(
            keccak256("DYNAMIC_NAME"),
            dynamicName,
            abi.encode(nameConfig.priceThresholds, nameConfig.names)
        );

        registry.registerFeature(
            keccak256("CONVICTION"),
            conviction,
            "" // No extra init data needed
        );

        return (dynamicName, conviction);
    }

    /**
     * @notice Gets all the addresses associated with a Wow token deployment
     * @param wowToken The address of the Wow token
     * @return registryAddress The feature registry address
     * @return dynamicNameAddress The dynamic name feature address
     * @return convictionAddress The conviction feature address
     */
    function getDeploymentAddresses(address wowToken) external view returns (
        address registryAddress,
        address dynamicNameAddress,
        address convictionAddress
    ) {
        registryAddress = address(Wow(payable(wowToken)).featureRegistry());
        
        if (registryAddress != address(0)) {
            WowFeatureRegistry registry = WowFeatureRegistry(registryAddress);
            dynamicNameAddress = registry.getFeature(keccak256("DYNAMIC_NAME"));
            convictionAddress = registry.getFeature(keccak256("CONVICTION"));
        }
    } 

        /// @notice Allows the contract to receive ETH
        receive() external payable {}
    }