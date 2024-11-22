pragma solidity ^0.8.23;

import "./IWowFeature.sol";

interface IConvictionFeature is IWowFeature {
    /// @notice Event emitted when a new conviction NFT is minted
    event ConvictionMinted(address indexed holder, uint256 indexed tokenId, uint256 amount, string name);
    
    /// @notice Mints a new conviction NFT if the amount meets the threshold
    /// @param to Address to mint the NFT to
    /// @param amount Amount of Wow tokens in the transaction
    /// @param totalSupply Current total supply of Wow tokens
    /// @param currentName The current name of the token at time of minting
    /// @return tokenId The ID of the minted NFT, 0 if no NFT was minted
    function checkAndMintConviction(
        address to, 
        uint256 amount, 
        uint256 totalSupply,
        string memory currentName
    ) external returns (uint256 tokenId);
    
    /// @notice Gets the token URI for a conviction NFT
    /// @param tokenId The ID of the NFT
    /// @return string The token URI (SVG data)
    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    /// @notice Checks if an address owns any conviction NFTs
    /// @param owner The address to check
    /// @return bool True if the address owns any conviction NFTs
    function hasConviction(address owner) external view returns (bool);
    
    /// @notice Gets all conviction NFTs owned by an address
    /// @param owner The address to query
    /// @return uint256[] Array of token IDs owned by the address
    function getConvictions(address owner) external view returns (uint256[] memory);
}