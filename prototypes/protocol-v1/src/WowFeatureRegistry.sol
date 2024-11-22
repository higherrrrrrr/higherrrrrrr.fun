// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IWowFeature.sol";
import "./interfaces/IDynamicNameFeature.sol";

contract WowFeatureRegistry {
    /// @notice The Wow token contract address
    address public wowToken;

    /// @notice The address that deployed this registry
    address public immutable deployer;
    
    /// @notice Mapping of feature identifiers to their implementations
    mapping(bytes32 => address) public features;
    
    /// @notice Feature identifiers
    bytes32 public constant DYNAMIC_NAME_FEATURE = keccak256("DYNAMIC_NAME");
    bytes32 public constant CONVICTION_FEATURE = keccak256("CONVICTION");
    
    /// @notice Event emitted when a feature is registered
    event FeatureRegistered(bytes32 indexed featureId, address indexed implementation);

    // @notice Event emitted when the Wow token address is set
    event WowTokenSet(address indexed wowToken);
    
    constructor(address _wowToken) {
        deployer = msg.sender;
        if (_wowToken != address(0)) {
            wowToken = _wowToken;
            emit WowTokenSet(_wowToken);
        }
    }

    /// @notice Sets the Wow token address if not already set
    /// @param _wowToken The address of the Wow token
    function setWowToken(address _wowToken) external {
        require(msg.sender == deployer, "WowFeatureRegistry: caller is not deployer");
        require(wowToken == address(0), "WowFeatureRegistry: wow token already set");
        require(_wowToken != address(0), "WowFeatureRegistry: zero address");
        
        wowToken = _wowToken;
        emit WowTokenSet(_wowToken);
    }
    
    /// @notice Registers a new feature implementation
    /// @param featureId The identifier for the feature
    /// @param implementation The address of the feature implementation
    /// @param initData Optional initialization data for features that need extra params
    function registerFeature(
        bytes32 featureId, 
        address implementation,
        bytes memory initData
    ) external {
        // TODO: Add proper access control
        require(implementation != address(0), "WowFeatureRegistry: zero address");
        require(features[featureId] == address(0), "WowFeatureRegistry: feature already registered");
        
        features[featureId] = implementation;

        // Special handling for DynamicNameFeature
        if (featureId == DYNAMIC_NAME_FEATURE) {
            require(initData.length > 0, "WowFeatureRegistry: missing init data for dynamic name");
            (uint256[] memory thresholds, string[] memory names) = abi.decode(initData, (uint256[], string[]));
            IDynamicNameFeature(implementation).initialize(wowToken, thresholds, names);
        } else {
            // Default initialization for other features
            IWowFeature(implementation).initialize(wowToken);
        }
        
        emit FeatureRegistered(featureId, implementation);
    }
    
    /// @notice Gets a feature implementation address
    /// @param featureId The identifier for the feature
    /// @return The feature implementation address
    function getFeature(bytes32 featureId) external view returns (address) {
        return features[featureId];
    }
} 