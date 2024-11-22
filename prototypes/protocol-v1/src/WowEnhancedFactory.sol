// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./Wow.sol";
import "./WowFeatureRegistry.sol";
import "./DynamicNameFeature.sol";
import "./ConvictionFeature.sol";
import "./BondingCurve.sol";
import "./interfaces/IWow.sol";
import "./interfaces/IWowFeature.sol";
import "./interfaces/IDynamicNameFeature.sol";
import "./interfaces/IConvictionFeature.sol";

contract WowEnhancedFactory {
    address public immutable protocolFeeRecipient;
    address public immutable protocolRewards;
    address public immutable weth;
    address public immutable nonfungiblePositionManager;
    address public immutable swapRouter;

    event WowTokenDeployed(
        address indexed wowToken,
        address indexed creator,
        address indexed featureRegistry,
        address dynamicNameFeature,
        address convictionFeature,
        string baseTokenName,
        string symbol
    );

    constructor(
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _nonfungiblePositionManager,
        address _swapRouter
    ) {
        require(_protocolFeeRecipient != address(0), "Zero address: protocolFeeRecipient");
        require(_protocolRewards != address(0), "Zero address: protocolRewards");
        require(_weth != address(0), "Zero address: weth");
        require(_nonfungiblePositionManager != address(0), "Zero address: nonfungiblePositionManager");
        require(_swapRouter != address(0), "Zero address: swapRouter");

        protocolFeeRecipient = _protocolFeeRecipient;
        protocolRewards = _protocolRewards;
        weth = _weth;
        nonfungiblePositionManager = _nonfungiblePositionManager;
        swapRouter = _swapRouter;
    }

    function deployWow(
        address tokenCreator,
        address platformReferrer,
        string memory tokenURI,
        string memory baseTokenName,
        string memory symbol,
        uint256[] calldata priceThresholds,
        string[] calldata names
    ) external payable returns (address) {
        // Input validation
        _validateInputs(tokenCreator, baseTokenName, symbol, priceThresholds, names);

        // Deploy core contracts and get wow token address
        address wowAddress = _deployCore(
            tokenCreator,
            platformReferrer,
            tokenURI,
            baseTokenName,
            symbol,
            priceThresholds,
            names
        );

        // Get registry and feature addresses for event
        WowFeatureRegistry registry = WowFeatureRegistry(Wow(payable(wowAddress)).featureRegistry());
        address dynamicName = registry.getFeature(keccak256("DYNAMIC_NAME"));
        address conviction = registry.getFeature(keccak256("CONVICTION"));

        emit WowTokenDeployed(
            wowAddress,
            tokenCreator,
            address(registry),
            dynamicName,
            conviction,
            baseTokenName,
            symbol
        );

        return wowAddress;
    }

    function _deployCore(
        address tokenCreator,
        address platformReferrer,
        string memory tokenURI,
        string memory baseTokenName,
        string memory symbol,
        uint256[] calldata priceThresholds,
        string[] calldata names
    ) internal returns (address) {
        BondingCurve bondingCurve = new BondingCurve();
        DynamicNameFeature dynamicNameFeature = new DynamicNameFeature();
        ConvictionFeature convictionFeature = new ConvictionFeature(
            string.concat(baseTokenName, " Conviction"),
            symbol
        );

        WowFeatureRegistry registry = new WowFeatureRegistry(address(0));
        
        registry.registerFeature(
            keccak256("DYNAMIC_NAME"),
            address(dynamicNameFeature),
            abi.encode(priceThresholds, names)
        );

        registry.registerFeature(
            keccak256("CONVICTION"),
            address(convictionFeature),
            ""
        );

        Wow wow = new Wow(
            protocolFeeRecipient,
            protocolRewards,
            weth,
            nonfungiblePositionManager,
            swapRouter,
            address(registry)
        );

        wow.initialize{value: msg.value}(
            tokenCreator,
            platformReferrer,
            address(bondingCurve),
            tokenURI,
            baseTokenName,
            symbol
        );

        registry.setWowToken(address(wow));
        dynamicNameFeature.setWowToken(address(wow));
        convictionFeature.setWowToken(address(wow));
        wow.setFeatureRegistry(address(registry));

        return address(wow);
    }

    function _validateInputs(
        address tokenCreator,
        string memory baseTokenName,
        string memory symbol,
        uint256[] calldata priceThresholds,
        string[] calldata names
    ) internal pure {
        require(tokenCreator != address(0), "Zero address: tokenCreator");
        require(bytes(baseTokenName).length > 0, "Empty base name");
        require(bytes(symbol).length > 0, "Empty symbol");
        require(priceThresholds.length == names.length, "Array length mismatch");
        require(priceThresholds.length > 0, "Empty arrays");
    }

    function getDeploymentAddresses(address wowToken) external view returns (
        address registryAddress,
        address dynamicNameAddress,
        address convictionAddress
    ) {
        registryAddress = address(Wow(payable(wowToken)).featureRegistry());
        
        if (registryAddress != address(0)) {
            WowFeatureRegistry registry = WowFeatureRegistry(registryAddress);
            dynamicNameAddress = registry.getFeature(keccak256("DYNAMIC_NAME"));
            convictionAddress = registry.getFeature(keccak256("CONVICTION"));
        }
    }

    receive() external payable {}
}