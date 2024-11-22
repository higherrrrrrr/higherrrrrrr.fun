// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

library SVGLib {
    using Strings for uint256;
    
    function generateConvictionSVG(
        string memory name,
        uint256 tokenId,
        uint256 amount,
        uint256 timestamp
    ) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name": "Conviction #',
                            tokenId.toString(),
                            '", "description": "A proof of conviction in ',
                            name,
                            '", "image": "data:image/svg+xml;base64,',
                            Base64.encode(bytes(_generateSVG(name, tokenId, amount, timestamp))),
                            '"}'
                        )
                    )
                )
            )
        );
    }
    
    function _generateSVG(
        string memory name,
        uint256 tokenId,
        uint256 amount,
        uint256 timestamp
    ) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                '<style>text { font-family: monospace; }</style>',
                '<rect width="400" height="400" fill="#000"/>',
                '<text x="50%" y="40%" text-anchor="middle" fill="white" font-size="40">',
                name,
                '</text>',
                '<text x="50%" y="60%" text-anchor="middle" fill="white" font-size="20">',
                "Conviction #",
                tokenId.toString(),
                '</text>',
                '</svg>'
            )
        );
    }
}