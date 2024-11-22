// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IConvictionFeature.sol";
import "./interfaces/IWow.sol";
import "./SVGLib.sol";

contract ConvictionFeature is IConvictionFeature, ERC721 {    
    /// @notice The Wow token contract address
    address public wowToken;
    
    /// @notice Whether the contract has been initialized
    bool private _initialized;
    
    /// @notice Simple counter for token IDs
    uint256 private _nextTokenId;
    
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
    
    // Start uninitialized with temporary name/symbol
    constructor() ERC721("Conviction", "CONV") {
        _nextTokenId = 1; // Start token IDs at 1
    }
    
    string private _name;
    string private _symbol;

    function initialize(address _wowToken) external {
        require(!_initialized, "ConvictionFeature: already initialized");
        require(_wowToken != address(0), "ConvictionFeature: zero address");
        
        wowToken = _wowToken;
        _initialized = true;
        
        // Get the token name from the Wow contract
        string memory tokenName = IWow(wowToken).name();
        
        // Store the new name and symbol
        _name = string(abi.encodePacked(tokenName, " Conviction"));
        _symbol = "CONV";
    }

    // Override the name and symbol functions
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
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
        
        uint256 tokenId = _nextTokenId++;
        
        _mint(to, tokenId);
        _userTokens[to].push(tokenId);
        
        convictionData[tokenId] = ConvictionData({
            name: currentName,
            amount: amount,
            timestamp: block.timestamp
        });
        
        emit ConvictionMinted(to, tokenId, amount, currentName);
        
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, IConvictionFeature) returns (string memory) {
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