pragma solidity ^0.8.23;

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";


contract EvolutionaryMeme {
    constructor(
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _nonfungiblePositionManager,
        address _swapRouter
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Initialize immutable addresses
        ds.weth = _weth;
        ds.nonfungiblePositionManager = _nonfungiblePositionManager;
        ds.swapRouter = _swapRouter;
        ds.protocolFeeRecipient = _protocolFeeRecipient;
        ds.protocolRewards = _protocolRewards;

        // Add the diamondCut function in the constructor
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = IDiamondCut.diamondCut.selector;

        LibDiamond.FacetAddressAndPosition memory facetAddressAndPosition = LibDiamond.FacetAddressAndPosition({
            facetAddress: msg.sender,
            functionSelectorPosition: 0
        });

        ds.selectorToFacetAndPosition[selectors[0]] = facetAddressAndPosition;
        ds.selectors.push(selectors[0]);
    }

    // Find facet for function that is called and execute the
    // function if a facet is found
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

    receive() external payable {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        address facet = ds.selectorToFacetAndPosition[0x0].facetAddress;
        require(facet != address(0), "Diamond: No receive function");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {revert(0, returndatasize())}
            default {return (0, returndatasize())}
        }
    }
}