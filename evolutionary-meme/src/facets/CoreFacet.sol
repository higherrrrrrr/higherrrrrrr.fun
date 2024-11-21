// src/facets/CoreFacet.sol
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {ERC20Facet} from "./ERC20Facet.sol";

contract CoreFacet {
    event Initialized(string name, string symbol, address tokenCreator);

    function initialize(
        address _tokenCreator,
        address _platformReferrer,
        address _bondingCurve,
        string memory _tokenURI,
        string memory _name,
        string memory _symbol,
        string memory _memeType
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        require(_tokenCreator != address(0), "Zero address");
        require(_bondingCurve != address(0), "Zero address");

        if (_platformReferrer == address(0)) {
            _platformReferrer = ds.protocolFeeRecipient;
        }

        // Set initial state
        ds.tokenCreator = _tokenCreator;
        ds.platformReferrer = _platformReferrer;
        ds.bondingCurve = _bondingCurve;
        ds.tokenURI = _tokenURI;
        ds.memeType = _memeType;
        ds.marketType = 0; // BONDING_CURVE

        // Initialize ERC20 state
        ds.name = _name;
        ds.symbol = _symbol;

        emit Initialized(_name, _symbol, _tokenCreator);
    }

    function tokenURI() external view returns (string memory) {
        return LibDiamond.diamondStorage().tokenURI;
    }

    function marketType() external view returns (uint8) {
        return LibDiamond.diamondStorage().marketType;
    }

    // Add other common getters and utility functions
}