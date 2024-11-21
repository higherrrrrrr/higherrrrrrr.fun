// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MemeFacet is IERC721Receiver {
    event MemeEvolved(string oldMeme, string newMeme, uint256 price);
    event MemeStateUpdated(string memeType, string tokenURI);
    event NFTReceived(address operator, address from, uint256 tokenId);

    error OnlyPool();

    /// @notice Initializes meme levels and type
    function initializeMeme(
        string memory _memeType,
        LibDiamond.MemeLevel[] memory _memeLevels
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
        // Store meme levels
        for (uint i = 0; i < _memeLevels.length; i++) {
            ds.memeLevels.push(_memeLevels[i]);
        }
        
        // Set current meme to first level
        ds.currentMeme = _memeLevels[0].memeName;
        ds.memeType = _memeType;
    }

    /// @notice Updates the meme name based on current price
    function updateMeme() public {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Only update if we're in Uniswap market
        if (ds.marketType != 1) return; // 1 = UNISWAP_POOL

        uint256 currentPrice = getCurrentPrice();
        string memory newMeme = ds.memeLevels[0].memeName;

        // Find appropriate meme level based on price
        for(uint256 i = 0; i < ds.memeLevels.length; i++) {
            if(currentPrice >= ds.memeLevels[i].priceThreshold) {
                newMeme = ds.memeLevels[i].memeName;
            }
        }

        // Update if meme name has changed
        if (keccak256(bytes(newMeme)) != keccak256(bytes(ds.currentMeme))) {
            string memory oldMeme = ds.currentMeme;
            ds.currentMeme = newMeme;
            emit MemeEvolved(oldMeme, newMeme, currentPrice);
        }
    }

    /// @notice Gets current price from Uniswap pool
    function getCurrentPrice() public view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (ds.marketType != 1 || !ds.tokensInitialized) {
            return 0;
        }

        // Note: This assumes UniswapFacet's implementation will handle the actual price calculation
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodeWithSignature("getUniswapPrice()")
        );

        if (success && data.length == 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }

    /// @notice Gets number of meme levels
    function getMemeLevelsCount() external view returns (uint256) {
        return LibDiamond.diamondStorage().memeLevels.length;
    }

    /// @notice Gets all meme levels
    function getAllMemeLevels() external view returns (LibDiamond.MemeLevel[] memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.MemeLevel[] memory levels = new LibDiamond.MemeLevel[](ds.memeLevels.length);

        for(uint256 i = 0; i < ds.memeLevels.length; i++) {
            levels[i] = ds.memeLevels[i];
        }

        return levels;
    }

    /// @notice Gets complete meme state
    function getMemeState() external view returns (
        string memory currentMemeName,
        string memory currentMemeType,
        uint256 currentPrice,
        LibDiamond.MemeLevel[] memory levels
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return (
            ds.currentMeme,
            ds.memeType,
            getCurrentPrice(),
            this.getAllMemeLevels()
        );
    }

    /// @notice For LP position NFT handling
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) { // Remove view
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (msg.sender != ds.poolAddress) {
            revert OnlyPool();
        }

        emit NFTReceived(operator, from, tokenId);
        return this.onERC721Received.selector;
    }
}