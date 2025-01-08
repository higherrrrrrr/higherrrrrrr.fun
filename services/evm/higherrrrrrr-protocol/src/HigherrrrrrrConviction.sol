// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IHigherrrrrrr} from "./interfaces/IHigherrrrrrr.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StringSanitizer} from "./libraries/StringSanitizer.sol";

contract HigherrrrrrrConviction is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    IHigherrrrrrr public higherrrrrrr;
    bool private initialized;

    // Mapping from token ID to conviction details
    struct ConvictionDetails {
        string evolution; // Name of token at time of purchase
        uint256 amount; // Amount of tokens purchased
        uint256 price; // Price at time of purchase
        uint256 timestamp; // When the conviction was minted
    }

    mapping(uint256 => ConvictionDetails) public convictionDetails;

    constructor() ERC721("Higherrrrrrr Conviction", "CONVICTION") Ownable(msg.sender) {}

    function initialize(address _higherrrrrrr) external {
        require(!initialized, "Already initialized");
        require(_higherrrrrrr != address(0), "Invalid Higherrrrrrr address");

        higherrrrrrr = IHigherrrrrrr(_higherrrrrrr);
        _transferOwnership(_higherrrrrrr);
        initialized = true;
    }

    function mintConviction(address to, string memory evolution, uint256 amount, uint256 price)
        external
        returns (uint256)
    {
        require(msg.sender == address(higherrrrrrr), "Only Higherrrrrrr");

        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);

        convictionDetails[tokenId] =
            ConvictionDetails({evolution: evolution, amount: amount, price: price, timestamp: block.timestamp});

        return tokenId;
    }

    // Add function to read Higherrrrrrr contract state
    function getHigherrrrrrrState()
        public
        view
        returns (string memory currentName, uint256 currentPrice, IHigherrrrrrr.MarketType marketType)
    {
        currentName = higherrrrrrr.name();
        currentPrice = higherrrrrrr.getCurrentPrice();
        (IHigherrrrrrr.MarketState memory state) = higherrrrrrr.state();
        marketType = state.marketType;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");

        ConvictionDetails memory details = convictionDetails[tokenId];

        // Format price in ETH (assuming price is in wei)
        string memory priceInEth =
            string(abi.encodePacked((details.price / 1e18).toString(), ".", (details.price % 1e18).toString()));

        // Sanitize strings for SVG context
        string memory sanitizedEvolution = StringSanitizer.sanitize(details.evolution, 1);
        string memory sanitizedAmount = StringSanitizer.sanitize((details.amount / 1e18).toString(), 1);
        string memory sanitizedPrice = StringSanitizer.sanitize(priceInEth, 1);
        string memory sanitizedTimestamp = StringSanitizer.sanitize(details.timestamp.toString(), 1);

        // Create SVG with sanitized values
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                "<style>",
                "text { font-family: monospace; fill: #4afa4a; text-anchor: middle; }",
                ".left { text-anchor: start; }",
                ".right { text-anchor: end; }",
                "</style>",
                '<rect width="400" height="400" fill="#000000"/>',
                '<text x="200" y="150" font-size="24">',
                sanitizedEvolution,
                "</text>",
                '<text x="200" y="200" font-size="20">',
                sanitizedAmount,
                " tokens</text>",
                '<text x="20" y="380" font-size="16" class="left">',
                sanitizedPrice,
                " ETH</text>",
                '<text x="380" y="380" font-size="16" class="right">',
                sanitizedTimestamp,
                "</text>",
                "</svg>"
            )
        );

        // Sanitize strings for JSON context
        string memory sanitizedEvolutionJson = StringSanitizer.sanitize(details.evolution, 2);
        string memory sanitizedAmountJson = StringSanitizer.sanitize((details.amount / 1e18).toString(), 2);
        string memory sanitizedPriceJson = StringSanitizer.sanitize(priceInEth, 2);
        string memory sanitizedTimestampJson = StringSanitizer.sanitize(details.timestamp.toString(), 2);
        string memory sanitizedTokenId = StringSanitizer.sanitize(tokenId.toString(), 2);

        // Create metadata with sanitized values
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        "{",
                        '"name": "Higherrrrrrr Conviction #',
                        sanitizedTokenId,
                        '",',
                        '"description": "A record of conviction in Higherrrrrrr",',
                        '"attributes": [',
                        '{"trait_type": "Evolution", "value": "',
                        sanitizedEvolutionJson,
                        '"},',
                        '{"trait_type": "Amount", "value": "',
                        sanitizedAmountJson,
                        '"},',
                        '{"trait_type": "Price", "value": "',
                        sanitizedPriceJson,
                        '"},',
                        '{"trait_type": "Timestamp", "value": "',
                        sanitizedTimestampJson,
                        '"}',
                        "],",
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"',
                        "}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
