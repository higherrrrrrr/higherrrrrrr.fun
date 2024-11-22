// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IConvictionFeature.sol";
import "./interfaces/IWow.sol";
import "./SVGLib.sol";

contract ConvictionFeature is IConvictionFeature, ERC721 {
    using Counters for Counters.Counter;
    
    /// @notice The Wow token contract address
    address public wowToken;
    
    /// @notice Whether the contract has been initialized
    bool private _initialized;
    
    /// @notice Counter for token IDs
    Counters.Counter private _tokenIds;
    
    /// @notice Threshold percentage for minting (0.1% = 1000)
    uint256 public constant CONVICTION_THRESHOLD = 1000; // 0.1%
    
    /// @notice Mapping of token ID to conviction data
    mapping(uint256 => ConvictionData) public convictionData;
    
    /// @notice Mapping of address to owned token IDs
    mapping(address => uint256[]) private _userTokens;
    
    struct ConvictionData {
        string name;
        uint256 amount;
        uint256 timestamp;
    }
    
    modifier onlyWow() {
        require(msg.sender == wowToken, "ConvictionFeature: caller is not Wow");
        _;
    }
    
    // Start uninitialized with placeholder name
    constructor() ERC721("", "") {}
    
    function initialize(address _wowToken) external {
        require(!_initialized, "ConvictionFeature: already initialized");
        require(_wowToken != address(0), "ConvictionFeature: zero address");
        
        wowToken = _wowToken;
        _initialized = true;
        
        // Set the NFT name and symbol based on the original token
        string memory tokenName = IWow(wowToken).name();
        _name = string(abi.encodePacked(tokenName, " Conviction"));
        _symbol = string(abi.encodePacked(tokenName, "CONV"));
    }
    
    function isInitialized() external view returns (bool) {
        return _initialized;
    }
    
    function checkAndMintConviction(
        address to,
        uint256 amount,
        uint256 totalSupply,
        string memory currentName
    ) external onlyWow returns (uint256) {
        // Check if amount is > 0.1% of total supply
        if (amount * 1000000 < totalSupply * CONVICTION_THRESHOLD) {
            return 0;
        }
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        _userTokens[to].push(newTokenId);
        
        convictionData[newTokenId] = ConvictionData({
            name: currentName,
            amount: amount,
            timestamp: block.timestamp
        });
        
        emit ConvictionMinted(to, newTokenId, amount, currentName);
        
        return newTokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ConvictionFeature: URI query for nonexistent token");
        
        ConvictionData memory data = convictionData[tokenId];
        return SVGLib.generateConvictionSVG(
            data.name,
            tokenId,
            data.amount,
            data.timestamp
        );
    }
    
    function hasConviction(address owner) external view returns (bool) {
        return _userTokens[owner].length > 0;
    }
    
    function getConvictions(address owner) external view returns (uint256[] memory) {
        return _userTokens[owner];
    }
}