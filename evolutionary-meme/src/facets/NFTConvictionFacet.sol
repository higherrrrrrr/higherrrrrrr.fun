// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title NFTConvictionFacet
 * @notice Implements ERC721 NFTs representing conviction in holding meme tokens
 */
contract NFTConvictionFacet is IERC721, IERC721Metadata {
    using Strings for uint256;
    using Address for address;

    // Events
    event ConvictionMinted(address indexed owner, uint256 indexed tokenId, uint256 amount);
    event ConvictionBurned(address indexed owner, uint256 indexed tokenId);

    // Errors
    error InsufficientConviction();
    error TokenAlreadyExists();
    error InvalidTokenId();
    error NotTokenOwner();
    error NotApprovedOrOwner();
    error ZeroAddress();
    error UnsafeRecipient();
    error NonExistentToken();

    // Constants
    uint256 public constant CONVICTION_THRESHOLD = 1_000_000_000e18 / 1000; // 0.1% of total supply

    /**
     * @notice Returns true if the interface is supported
     * @param interfaceId The interface identifier
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId;
    }

    /**
     * @notice Returns the token name
     */
    function name() external view returns (string memory) {
        return string(abi.encodePacked(LibDiamond.diamondStorage().symbol, " Conviction"));
    }

    /**
     * @notice Returns the token symbol
     */
    function symbol() external view returns (string memory) {
        return string(abi.encodePacked(LibDiamond.diamondStorage().symbol, "-CONVICTION"));
    }

    /**
     * @notice Checks if an address has enough tokens to mint conviction NFT
     * @param account Address to check
     * @return bool Whether the address has enough tokens
     */
    function hasConviction(address account) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.balances[account] >= CONVICTION_THRESHOLD;
    }

    /**
     * @notice Mints a conviction NFT for the caller
     * @return tokenId The ID of the minted NFT
     */
    function mintConviction() external returns (uint256 tokenId) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        if (!hasConviction(msg.sender)) revert InsufficientConviction();

        // Use the next token ID
        tokenId = ds.nextConvictionId++;

        // Store conviction data
        ds.convictionData[tokenId] = LibDiamond.ConvictionData({
            amount: ds.balances[msg.sender],
            timestamp: block.timestamp,
            memeState: ds.currentMeme,
            price: getCurrentPrice()
        });

        // Mint NFT
        ds.convictionOwner[tokenId] = msg.sender;

        emit ConvictionMinted(msg.sender, tokenId, ds.balances[msg.sender]);
        emit Transfer(address(0), msg.sender, tokenId);

        return tokenId;
    }

    /**
     * @notice Burns a conviction NFT
     * @param tokenId The ID of the NFT to burn
     */
    function burnConviction(uint256 tokenId) external {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotApprovedOrOwner();

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        address owner = ds.convictionOwner[tokenId];

        // Clear approvals
        _approve(address(0), tokenId);

        // Clear ownership
        delete ds.convictionOwner[tokenId];
        delete ds.convictionData[tokenId];

        emit ConvictionBurned(owner, tokenId);
        emit Transfer(owner, address(0), tokenId);
    }

    /**
     * @notice Generates the SVG for a conviction NFT
     * @param tokenId The ID of the NFT
     */
    function _generateSVG(uint256 tokenId) internal view returns (string memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.ConvictionData memory data = ds.convictionData[tokenId];

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:#000">',
            '<style>text{font-family:monospace;fill:white;text-anchor:middle}</style>',
            '<text x="200" y="100" font-size="40">', data.memeState, '</text>',
            '<text x="200" y="160" font-size="20">Conviction Level: ',
            (data.amount / CONVICTION_THRESHOLD).toString(), 'x</text>',
            '<text x="200" y="200" font-size="16">Price: ',
            (data.price / 1e18).toString(), ' ETH</text>',
            '<text x="200" y="240" font-size="16">Timestamp: ',
            data.timestamp.toString(), '</text>',
            '</svg>'
        ));
    }

    /**
     * @notice Returns the URI for a given token ID
     * @param tokenId The ID of the NFT
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (ds.convictionOwner[tokenId] == address(0)) revert NonExistentToken();

        LibDiamond.ConvictionData memory data = ds.convictionData[tokenId];
        string memory svg = _generateSVG(tokenId);

        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"', ds.symbol, ' Conviction #', tokenId.toString(),
                '","description":"', ds.symbol, ' conviction token representing holding ',
                (data.amount / 1e18).toString(), ' tokens",',
                '"image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )))
        ));
    }

    /**
     * @notice Returns the balance of the owner
     * @param owner Address to check
     */
    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        uint256 balance = 0;
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        for (uint256 i = 0; i < ds.nextConvictionId; i++) {
            if (ds.convictionOwner[i] == owner) {
                balance++;
            }
        }
        return balance;
    }

    /**
     * @notice Returns the owner of the token ID
     * @param tokenId The ID to check
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) revert NonExistentToken();
        return owner;
    }

    /**
     * @notice Internal function to return the owner of a token
     * @param tokenId The ID to check
     */
    function _ownerOf(uint256 tokenId) internal view returns (address) {
        return LibDiamond.diamondStorage().convictionOwner[tokenId];
    }

    /**
     * @notice Safely transfers a token
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @notice Safely transfers a token with additional data
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     * @param data Additional data
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotApprovedOrOwner();
        _safeTransfer(from, to, tokenId, data);
    }

    /**
     * @notice Transfers a token
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     */
    function transferFrom(address from, address to, uint256 tokenId) external {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotApprovedOrOwner();
        _transfer(from, to, tokenId);
    }

    /**
     * @notice Approves an address to transfer a token
     * @param operator Address to approve
     * @param tokenId Token to approve
     */
    function approve(address operator, uint256 tokenId) external {
        address owner = _ownerOf(tokenId);
        if (operator == owner) revert NotApprovedOrOwner();
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) {
            revert NotApprovedOrOwner();
        }
        _approve(operator, tokenId);
    }

    /**
     * @notice Sets approval for all tokens
     * @param operator Address to approve
     * @param approved Approval status
     */
    function setApprovalForAll(address operator, bool approved) external {
        LibDiamond.diamondStorage().convictionApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @notice Gets the approved address for a token
     * @param tokenId Token to check
     */
    function getApproved(uint256 tokenId) external view returns (address) {
        if (!_exists(tokenId)) revert NonExistentToken();
        return LibDiamond.diamondStorage().tokenApprovals[tokenId];
    }

    /**
     * @notice Checks if an operator is approved for all tokens of an owner
     * @param owner Owner to check
     * @param operator Operator to check
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return LibDiamond.diamondStorage().convictionApprovals[owner][operator];
    }

    /**
     * @notice Internal function to check if a token exists
     * @param tokenId Token to check
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Internal function to check if an address is the owner or approved
     * @param spender Address to check
     * @param tokenId Token to check
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = _ownerOf(tokenId);
        return (
            spender == owner ||
            isApprovedForAll(owner, spender) ||
            getApproved(tokenId) == spender
        );
    }

    /**
     * @notice Internal function to approve an address for a token
     * @param to Address to approve
     * @param tokenId Token to approve
     */
    function _approve(address to, uint256 tokenId) internal {
        LibDiamond.diamondStorage().tokenApprovals[tokenId] = to;
        emit Approval(_ownerOf(tokenId), to, tokenId);
    }

    /**
     * @notice Internal function to transfer a token
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     */
    function _transfer(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) revert ZeroAddress();
        if (_ownerOf(tokenId) != from) revert NotTokenOwner();

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // Clear approvals
        _approve(address(0), tokenId);

        // Update ownership
        ds.convictionOwner[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    /**
     * @notice Internal function to safely transfer a token
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     * @param data Additional data
     */
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert UnsafeRecipient();
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert UnsafeRecipient();
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    /**
     * @notice Gets the current price from either bonding curve or Uniswap
     */
    function getCurrentPrice() internal view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (ds.marketType == 0) {
            // Use bonding curve price
            (bool success, bytes memory data) = address(this).staticcall(
                abi.encodeWithSignature("getCurrentPriceView()")
            );
            if (success && data.length == 32) {
                return abi.decode(data, (uint256));
            }
            return 0;
        } else {
            // Use Uniswap price
            (bool success, bytes memory data) = address(this).staticcall(
                abi.encodeWithSignature("getUniswapPrice()")
            );
            if (success && data.length == 32) {
                return abi.decode(data, (uint256));
            }
            return 0;
        }
    }
}