pragma solidity ^0.8.23;

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";

contract EvolutionaryMeme {
    // Storage for diamond
    LibDiamond.DiamondStorage internal s;

    constructor(
        address _feeRecipient,
        address _weth,
        address _positionManager,
        address _swapRouter,
        address _factory
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Initialize diamond storage
        ds.protocolFeeRecipient = _feeRecipient;
        ds.weth = _weth;
        ds.nonfungiblePositionManager = _positionManager;
        ds.swapRouter = _swapRouter;

        // Add diamondCut function
        bytes4 selector = IDiamondCut.diamondCut.selector;
        ds.selectorToFacetAndPosition[selector].functionSelectorPosition = uint96(ds.selectors.length);
        ds.selectors.push(selector);
    }

    // Add the diamondCut function to the implementation
    function diamondCut(
        IDiamondCut.FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        for (uint256 i; i < _diamondCut.length; i++) {
            IDiamondCut.FacetCut memory cut = _diamondCut[i];
            if (cut.action == IDiamondCut.FacetCutAction.Add) {
                _addFunctions(cut.facetAddress, cut.functionSelectors);
            } else if (cut.action == IDiamondCut.FacetCutAction.Replace) {
                _replaceFunctions(cut.facetAddress, cut.functionSelectors);
            } else if (cut.action == IDiamondCut.FacetCutAction.Remove) {
                _removeFunctions(cut.facetAddress, cut.functionSelectors);
            }
        }
        emit IDiamondCut.DiamondCut(_diamondCut, _init, _calldata);
        if (_init != address(0)) {
            if (_calldata.length > 0) {
                (bool success,) = _init.delegatecall(_calldata);
                if (!success) revert("InitializationFunctionReverted");
            } else {
                revert("InitializationFunctionReverted");
            }
        }
    }

    // Internal functions to support diamondCut
    function _addFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        for (uint256 i; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
            ds.selectorToFacetAndPosition[selector].functionSelectorPosition = uint96(ds.selectors.length);
            ds.selectors.push(selector);
        }
        ds.facetAddresses[_facetAddress] = true;
    }

    function _replaceFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        for (uint256 i; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
        }
        ds.facetAddresses[_facetAddress] = true;
    }

    function _removeFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        for (uint256 i; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            delete ds.selectorToFacetAndPosition[selector];
            // Remove from selectors array
            uint256 selectorPosition = ds.selectorToFacetAndPosition[selector].functionSelectorPosition;
            uint256 lastSelectorPosition = ds.selectors.length - 1;
            if (selectorPosition != lastSelectorPosition) {
                bytes4 lastSelector = ds.selectors[lastSelectorPosition];
                ds.selectors[selectorPosition] = lastSelector;
                ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
            }
            ds.selectors.pop();
        }
    }

    // Fallback function
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {revert(0, returndatasize())}
            default {return (0, returndatasize())}
        }
    }

    receive() external payable {}
}