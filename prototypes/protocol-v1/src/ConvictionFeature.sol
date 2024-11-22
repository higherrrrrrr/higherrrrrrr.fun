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

    event WowTokenSet(address indexed wowToken);

    // Add this state variable at the contract level
    address public deployer;

    // Make sure the constructor sets the deployer
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {
        deployer = msg.sender;
        _nextTokenId = 1;
    }

    /// @notice Sets the Wow token address if not already set
    /// @param _wowToken The address of the Wow token
    function setWowToken(address _wowToken) external {
        require(msg.sender == deployer, "WowFeatureRegistry: caller is not deployer");
        require(wowToken == address(0), "WowFeatureRegistry: wow token already set");
        require(_wowToken != address(0), "WowFeatureRegistry: zero address");
        
        wowToken = _wowToken;
        emit WowTokenSet(_wowToken);
    }
    
    
    string private _name;
    string private _symbol;

    function initialize(address _wowToken) external {
        require(!_initialized, "ConvictionFeature: already initialized");
        
        wowToken = _wowToken;
        _initialized = true;
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