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
    ) external payable returns (address wowToken) {
        // Input validation
        require(tokenCreator != address(0), "Zero address: tokenCreator");
        require(bytes(baseTokenName).length > 0, "Empty base name");
        require(bytes(symbol).length > 0, "Empty symbol");
        require(nameConfig.priceThresholds.length == nameConfig.names.length, "Config length mismatch");
        require(nameConfig.priceThresholds.length > 0, "Empty name config");

        // Validate name config is properly sorted
        for (uint256 i = 1; i < nameConfig.priceThresholds.length; i++) {
            require(
                nameConfig.priceThresholds[i] > nameConfig.priceThresholds[i-1],
                "Price thresholds not sorted"
            );
        }

        // Deploy contracts in order
        BondingCurve bondingCurve = new BondingCurve();

        // Create registry with temporary address, will recreate with correct address
        WowFeatureRegistry tempRegistry = new WowFeatureRegistry(address(0));

        // Deploy main Wow token
        Wow wow = new Wow(
            protocolFeeRecipient,
            protocolRewards,
            weth,
            nonfungiblePositionManager,
            swapRouter,
            address(tempRegistry)
        );

        // Deploy real registry with correct Wow address
        WowFeatureRegistry registry = new WowFeatureRegistry(address(wow));

        // Deploy features
        DynamicNameFeature dynamicName = new DynamicNameFeature();
        ConvictionFeature conviction = new ConvictionFeature();

        // Initialize features
        dynamicName.initialize(
            address(wow),
            nameConfig.priceThresholds,
            nameConfig.names
        );

        conviction.initialize(address(wow));

        // Register features in registry
        registry.registerFeature(keccak256("DYNAMIC_NAME"), address(dynamicName));
        registry.registerFeature(keccak256("CONVICTION"), address(conviction));

        // Initialize Wow token
        wow.initialize{value: msg.value}(
            tokenCreator,
            platformReferrer,
            address(bondingCurve),
            tokenURI,
            baseTokenName,
            symbol
        );

        emit WowTokenDeployed(
            address(wow),
            tokenCreator,
            address(registry),
            address(dynamicName),
            address(conviction),
            baseTokenName,
            symbol,
            nameConfig.priceThresholds,
            nameConfig.names
        );

        return address(wow);
    }

    /**
     * @notice Verifies that a Wow token deployment was successful
     * @param wowToken The address of the Wow token to verify
     * @return success Whether the deployment was successful
     * @return details Human-readable details about the verification
     */
    function verifyDeployment(address wowToken) external view returns (bool success, string memory details) {
        try Wow(wowToken).featureRegistry() returns (address registryAddress) {
            if (registryAddress == address(0)) {
                return (false, "Invalid registry address");
            }

            WowFeatureRegistry registry = WowFeatureRegistry(registryAddress);
            
            address dynamicName = registry.getFeature(keccak256("DYNAMIC_NAME"));
            if (dynamicName == address(0)) {
                return (false, "Dynamic name feature not found");
            }
            
            address conviction = registry.getFeature(keccak256("CONVICTION"));
            if (conviction == address(0)) {
                return (false, "Conviction feature not found");
            }

            try IDynamicNameFeature(dynamicName).isInitialized() returns (bool initialized) {
                if (!initialized) {
                    return (false, "Dynamic name feature not initialized");
                }
            } catch {
                return (false, "Failed to check dynamic name initialization");
            }

            try IConvictionFeature(conviction).isInitialized() returns (bool initialized) {
                if (!initialized) {
                    return (false, "Conviction feature not initialized");
                }
            } catch {
                return (false, "Failed to check conviction initialization");
            }

            return (true, "Deployment verified successfully");
        } catch {
            return (false, "Failed to verify Wow token");
        }
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
        registryAddress = address(Wow(wowToken).featureRegistry());
        
        if (registryAddress != address(0)) {
            WowFeatureRegistry registry = WowFeatureRegistry(registryAddress);
            dynamicNameAddress = registry.getFeature(keccak256("DYNAMIC_NAME"));
            convictionAddress = registry.getFeature(keccak256("CONVICTION"));
        }
    }

    /// @notice Allows the contract to receive ETH
    receive() external payable {}
}