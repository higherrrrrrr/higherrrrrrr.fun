// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IDynamicNameFeature.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DynamicNameFeature
 * @dev Contract that manages dynamic name changes based on price thresholds for Wow tokens
 * The name changes are triggered by price movements in the token's market
 */
contract DynamicNameFeature is IDynamicNameFeature {
    using Strings for uint256;

    /// @notice The Wow token contract address
    address public wowToken;
    
    /// @notice Whether the contract has been initialized
    bool private _initialized;
    
    /// @notice The current name of the token
    string public currentName;
    
    /// @notice Array of price thresholds for name changes (sorted ascending)
    uint256[] public thresholds;
    
    /// @notice Mapping of thresholds to names
    mapping(uint256 => string) public names;
    
    /// @notice Current active threshold index
    uint256 public currentThresholdIndex;

    /// @dev Ensures the caller is the Wow token contract
    modifier onlyWow() {
        require(msg.sender == wowToken, "DynamicNameFeature: caller is not Wow");
        _;
    }

    /// @dev Ensures the contract is initialized
    modifier whenInitialized() {
        require(_initialized, "DynamicNameFeature: not initialized");
        _;
    }

    /// @notice Initializes the feature with the Wow token address and name configurations
    /// @param _wowToken The address of the Wow token contract
    /// @param _thresholds Array of price thresholds (must be sorted ascending)
    /// @param _names Array of names corresponding to thresholds
    function initialize(
        address _wowToken,
        uint256[] memory _thresholds,
        string[] memory _names
    ) external {
        require(!_initialized, "DynamicNameFeature: already initialized");
        require(_wowToken != address(0), "DynamicNameFeature: zero address");
        require(_thresholds.length == _names.length, "DynamicNameFeature: arrays length mismatch");
        require(_thresholds.length > 0, "DynamicNameFeature: empty thresholds");
        
        // Validate thresholds are sorted
        for (uint256 i = 1; i < _thresholds.length; i++) {
            require(
                _thresholds[i] > _thresholds[i-1], 
                "DynamicNameFeature: thresholds not sorted"
            );
        }

        wowToken = _wowToken;
        _initialized = true;
        
        // Store thresholds and names
        for (uint256 i = 0; i < _thresholds.length; i++) {
            thresholds.push(_thresholds[i]);
            names[_thresholds[i]] = _names[i];
        }
        
        // Set initial name as the first name in the array
        currentName = _names[0];
        currentThresholdIndex = 0;
    }

    /// @notice Returns whether the contract has been initialized
    function isInitialized() external view returns (bool) {
        return _initialized;
    }
    
    /// @notice Returns the current token name
    function getCurrentName() external view whenInitialized returns (string memory) {
        return currentName;
    }
    
    /// @notice Returns all price thresholds
    function getPriceThresholds() external view whenInitialized returns (uint256[] memory) {
        return thresholds;
    }
    
    /// @notice Returns the name for a specific threshold
    /// @param threshold The price threshold to query
    function getNameForThreshold(uint256 threshold) 
        external 
        view 
        whenInitialized 
        returns (string memory) 
    {
        require(names[threshold].bytes(names[threshold]).length > 0, "DynamicNameFeature: threshold not found");
        return names[threshold];
    }
    
    /// @notice Updates the name based on the current price
    /// @param newPrice The current price to check against thresholds
    function checkAndUpdateName(uint256 newPrice) 
        external 
        onlyWow 
        whenInitialized 
    {
        uint256 newIndex = _findThresholdIndex(newPrice);
        
        // Only update if the threshold changed
        if (newIndex != currentThresholdIndex) {
            string memory oldName = currentName;
            currentName = names[thresholds[newIndex]];
            currentThresholdIndex = newIndex;
            
            emit NameChanged(oldName, currentName, newPrice);
        }
    }

    /// @notice Finds the appropriate threshold index for a given price
    /// @param price The price to find the threshold for
    /// @return The index of the highest threshold that is <= price
    function _findThresholdIndex(uint256 price) internal view returns (uint256) {
        // If price is below first threshold, return 0
        if (price < thresholds[0]) {
            return 0;
        }
        
        // If price is above last threshold, return last index
        if (price >= thresholds[thresholds.length - 1]) {
            return thresholds.length - 1;
        }
        
        // Binary search for the appropriate threshold
        uint256 left = 0;
        uint256 right = thresholds.length - 1;
        
        while (left <= right) {
            uint256 mid = (left + right) / 2;
            
            // Found exact match
            if (thresholds[mid] == price) {
                return mid;
            }
            
            // If this threshold is too high, search lower half
            if (thresholds[mid] > price) {
                if (mid == 0 || thresholds[mid - 1] <= price) {
                    return mid - 1;
                }
                right = mid - 1;
            }
            // If this threshold is too low, search upper half
            else {
                if (mid == thresholds.length - 1 || thresholds[mid + 1] > price) {
                    return mid;
                }
                left = mid + 1;
            }
        }
        
        revert("DynamicNameFeature: threshold not found");
    }
}