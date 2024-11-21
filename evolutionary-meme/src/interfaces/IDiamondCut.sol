pragma solidity ^0.8.23;

interface IDiamondCut {
    enum FacetCutAction {
        Add,     // 0
        Replace, // 1
        Remove   // 2
    }

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external;

    /// @notice Gets all function selectors supported by a specific facet
    /// @param _facet The facet address to query
    /// @return selectors Array of function selectors supported by the facet
    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory selectors);

    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
}