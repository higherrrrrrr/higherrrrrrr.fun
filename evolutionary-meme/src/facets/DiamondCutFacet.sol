// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract DiamondCutFacet is IDiamondCut {
    // Errors
    error InitializationFunctionReverted();
    error NoSelectorsProvided();
    error AddressCannotBeZero();
    error FunctionAlreadyExists();
    error FunctionDoesNotExist();
    error CannotReplaceSameFunction();
    error RemoveFacetAddressMustBeZero();

    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {
        for (uint256 i; i < _diamondCut.length; i++) {
            FacetCut memory cut = _diamondCut[i];
            if (cut.action == FacetCutAction.Add) {
                addFunctions(cut.facetAddress, cut.functionSelectors);
            } else if (cut.action == FacetCutAction.Replace) {
                replaceFunctions(cut.facetAddress, cut.functionSelectors);
            } else if (cut.action == FacetCutAction.Remove) {
                removeFunctions(cut.facetAddress, cut.functionSelectors);
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        if (_init != address(0)) {
            if (_calldata.length > 0) {
                (bool success,) = _init.delegatecall(_calldata);
                if (!success) revert InitializationFunctionReverted();
            } else {
                revert InitializationFunctionReverted();
            }
        }
    }

    /// @notice Gets all function selectors supported by a specific facet
    /// @param _facet The facet address to query
    /// @return selectors Array of function selectors supported by the facet
    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory selectors) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 selectorCount;
        
        // First count how many selectors we have for this facet
        for (uint256 i; i < ds.selectors.length; i++) {
            bytes4 selector = ds.selectors[i];
            if (ds.selectorToFacetAndPosition[selector].facetAddress == _facet) {
                selectorCount++;
            }
        }
        
        // Allocate the array
        selectors = new bytes4[](selectorCount);
        uint256 index;
        
        // Fill the array
        for (uint256 i; i < ds.selectors.length; i++) {
            bytes4 selector = ds.selectors[i];
            if (ds.selectorToFacetAndPosition[selector].facetAddress == _facet) {
                selectors[index] = selector;
                index++;
            }
        }
        
        return selectors;
    }

    function addFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (_selectors.length == 0) revert NoSelectorsProvided();
        if (_facetAddress == address(0)) revert AddressCannotBeZero();

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress != address(0)) revert FunctionAlreadyExists();

            ds.selectorToFacetAndPosition[selector] = LibDiamond.FacetAddressAndPosition(
                _facetAddress,
                uint96(ds.selectors.length)
            );
            ds.selectors.push(selector);
        }

        ds.facetAddresses[_facetAddress] = true;
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (_selectors.length == 0) revert NoSelectorsProvided();
        if (_facetAddress == address(0)) revert AddressCannotBeZero();

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress == address(0)) revert FunctionDoesNotExist();
            if (oldFacetAddress == _facetAddress) revert CannotReplaceSameFunction();

            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
        }

        ds.facetAddresses[_facetAddress] = true;
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (_selectors.length == 0) revert NoSelectorsProvided();
        if (_facetAddress != address(0)) revert RemoveFacetAddressMustBeZero();

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress == address(0)) revert FunctionDoesNotExist();

            removeSelector(selector);
        }
    }

    function removeSelector(bytes4 _selector) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.selectors.length - 1;

        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = ds.selectors[lastSelectorPosition];
            ds.selectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }

        ds.selectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];
    }
}