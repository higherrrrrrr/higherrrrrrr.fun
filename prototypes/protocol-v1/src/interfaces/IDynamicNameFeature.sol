pragma solidity ^0.8.23;

import "./IWowFeature.sol";

// IDynamicNameFeature.sol
interface IDynamicNameFeature {

    function initialize(
        address _wowToken,
        uint256[] memory _thresholds,
        string[] memory _names
    ) external;

    /// @notice Event emitted when the token name changes
    event NameChanged(string oldName, string newName, uint256 priceThreshold);
    
    /// @notice Gets the current dynamic name based on price
    /// @return string The current token name
    function getCurrentName() external view returns (string memory);
    
    /// @notice Gets all price thresholds for name changes
    /// @return uint256[] Array of price thresholds
    function getPriceThresholds() external view returns (uint256[] memory);
    
    /// @notice Gets the name associated with a specific threshold
    /// @param threshold The price threshold to query
    /// @return string The name at that threshold
    function getNameForThreshold(uint256 threshold) external view returns (string memory);
    
    /// @notice Called by Wow contract to update name based on new price
    /// @param newPrice The new price to check against thresholds
    function checkAndUpdateName(uint256 newPrice) external;
}
