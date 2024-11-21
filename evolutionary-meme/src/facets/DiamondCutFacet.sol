// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract DiamondCutFacet is IDiamondCut {
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
        // Check if facet addresses and selector combinations are correct
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            FacetCut calldata facetCut = _diamondCut[facetIndex];
            require(facetCut.facetAddress != address(0), "DiamondCut: address cannot be 0");

            FacetCutAction action = facetCut.action;
            if (action == FacetCutAction.Add) {
                addFunctions(facetCut.facetAddress, facetCut.functionSelectors);
            } else if (action == FacetCutAction.Replace) {
                replaceFunctions(facetCut.facetAddress, facetCut.functionSelectors);
            } else if (action == FacetCutAction.Remove) {
                removeFunctions(facetCut.facetAddress, facetCut.functionSelectors);
            } else {
                revert("DiamondCut: Incorrect FacetCutAction");
            }
        }

        emit DiamondCut(_diamondCut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);
    }

    function addFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(_selectors.length > 0, "DiamondCut: No selectors provided");
        require(_facetAddress != address(0), "DiamondCut: Add facet can't be address(0)");

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "DiamondCut: Can't add function that already exists");

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
        require(_selectors.length > 0, "DiamondCut: No selectors provided");
        require(_facetAddress != address(0), "DiamondCut: Replace facet can't be address(0)");

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != address(0), "DiamondCut: Can't replace function that doesn't exist");
            require(oldFacetAddress != _facetAddress, "DiamondCut: Can't replace function with same function");

            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
        }

        ds.facetAddresses[_facetAddress] = true;
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(_selectors.length > 0, "DiamondCut: No selectors provided");
        require(_facetAddress == address(0), "DiamondCut: Remove facet must be address(0)");

        for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
            bytes4 selector = _selectors[selectorIndex];
            LibDiamond.FacetAddressAndPosition memory oldFacetAddressAndPosition = ds.selectorToFacetAndPosition[selector];
            require(oldFacetAddressAndPosition.facetAddress != address(0), "DiamondCut: Can't remove function that doesn't exist");

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

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (_init == address(0)) {
            require(_calldata.length == 0, "DiamondCut: _init is address(0) but_calldata is not empty");
        } else {
            require(_calldata.length > 0, "DiamondCut: _calldata is empty but _init is not address(0)");
            if (_init != address(this)) {
                require(ds.facetAddresses[_init], "DiamondCut: _init is not a facet");
            }
            (bool success, bytes memory error) = _init.delegatecall(_calldata);
            if (!success) {
                if (error.length > 0) {
                    // bubble up the error
                    revert(string(error));
                } else {
                    revert("DiamondCut: _init function reverted");
                }
            }
        }
    }
}