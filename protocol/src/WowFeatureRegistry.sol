// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IWowFeature.sol";

contract WowFeatureRegistry {
    /// @notice The Wow token contract address
    address public immutable wowToken;
    
    /// @notice Mapping of feature identifiers to their implementations
    mapping(bytes32 => address) public features;
    
    /// @notice Feature identifiers
    bytes32 public constant DYNAMIC_NAME_FEATURE = keccak256("DYNAMIC_NAME");
    bytes32 public constant CONVICTION_FEATURE = keccak256("CONVICTION");
    
    /// @notice Event emitted when a feature is registered
    event FeatureRegistered(bytes32 indexed featureId, address indexed implementation);
    
    constructor(address _wowToken) {
        require(_wowToken != address(0), "WowFeatureRegistry: zero address");
        wowToken = _wowToken;
    }
    
    /// @notice Registers a new feature implementation
    /// @param featureId The identifier for the feature
    /// @param implementation The address of the feature implementation
    function registerFeature(bytes32 featureId, address implementation) external {
        // TODO: Add proper access control
        require(implementation != address(0), "WowFeatureRegistry: zero address");
        require(features[featureId] == address(0), "WowFeatureRegistry: feature already registered");
        
        features[featureId] = implementation;
        IWowFeature(implementation).initialize(wowToken);
        
        emit FeatureRegistered(featureId, implementation);
    }
    
    /// @notice Gets a feature implementation address
    /// @param featureId The identifier for the feature
    /// @return The feature implementation address
    function getFeature(bytes32 featureId) external view returns (address) {
        return features[featureId];
    }
}