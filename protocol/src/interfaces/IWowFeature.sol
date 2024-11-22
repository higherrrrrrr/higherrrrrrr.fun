pragma solidity ^0.8.23;

// IWowFeature.sol
interface IWowFeature {
    /// @notice Initializes the feature with the Wow token address
    /// @param wowToken The address of the Wow token contract
    function initialize(address wowToken) external;
    
    /// @notice Checks if the feature has been initialized
    /// @return bool True if initialized
    function isInitialized() external view returns (bool);
}