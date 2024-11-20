// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./DynamicMeme.sol";
import "./BondingCurve.sol";
import "./interfaces/IDiamondCut.sol";
import "./facets/DiamondCutFacet.sol";
import "./facets/ERC20Facet.sol";
import "./facets/CoreFacet.sol";
import "./facets/BondingCurveFacet.sol";
import "./facets/UniswapFacet.sol";
import "./facets/FeeFacet.sol";
import "./facets/MemeFacet.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";



contract DynamicMemeFactory {
    struct MemeLevel {
        uint256 priceThreshold;
        string memeName;
    }

    address public immutable implementation;
    address public immutable protocolFeeRecipient;
    address public immutable protocolRewards;
    address public immutable weth;
    address public immutable positionManager;
    address public immutable swapRouter;

    // Facet addresses
    address public immutable diamondCutFacet;
    address public immutable erc20Facet;
    address public immutable coreFacet;
    address public immutable bondingCurveFacet;
    address public immutable uniswapFacet;
    address public immutable feeFacet;
    address public immutable memeFacet;

    event MemeTokenDeployed(
        address indexed token,
        address indexed creator,
        string memeType,
        address bondingCurve
    );

    constructor(
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _positionManager,
        address _swapRouter
    ) {
        protocolFeeRecipient = _protocolFeeRecipient;
        protocolRewards = _protocolRewards;
        weth = _weth;
        positionManager = _positionManager;
        swapRouter = _swapRouter;

        // Deploy implementation
        implementation = address(new DynamicMeme(
            _protocolFeeRecipient,
            _protocolRewards,
            _weth,
            _positionManager,
            _swapRouter
        ));

        // Deploy facets
        diamondCutFacet = address(new DiamondCutFacet());
        erc20Facet = address(new ERC20Facet());
        coreFacet = address(new CoreFacet());
        bondingCurveFacet = address(new BondingCurveFacet());
        uniswapFacet = address(new UniswapFacet());
        feeFacet = address(new FeeFacet());
        memeFacet = address(new MemeFacet());
    }

    function deployMeme(
        string memory symbol,
        string memory tokenURI,
        string memory memeType,
        address platformReferrer,
        uint256[] calldata priceThresholds,
        string[] calldata memeNames
    ) external returns (address memeToken, address bondingCurveAddress) {
        require(priceThresholds.length == memeNames.length, "Arrays must be equal length");

        // Deploy a new bonding curve for this specific meme token
        bondingCurveAddress = address(new BondingCurve());

        // Create and marshal meme levels
        LibDiamond.MemeLevel[] memory memeLevels = new LibDiamond.MemeLevel[](priceThresholds.length);
        for (uint i = 0; i < priceThresholds.length; i++) {
            memeLevels[i] = LibDiamond.MemeLevel({
                priceThreshold: priceThresholds[i],
                memeName: memeNames[i]
            });
        }

        // Deploy proxy with the DiamondCutFacet selector already initialized
        ERC1967Proxy proxy = new ERC1967Proxy(
            implementation,
            new bytes(0) // No initialization needed as diamond cut is set up in constructor
        );

        memeToken = address(proxy);

        // Now add all the facets through the diamond cut
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](7);

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(diamondCutFacet)
        });

        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: erc20Facet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(erc20Facet)
        });

        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: coreFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(coreFacet)
        });

        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: bondingCurveFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(bondingCurveFacet)
        });

        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: uniswapFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(uniswapFacet)
        });

        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: feeFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(feeFacet)
        });

        cuts[6] = IDiamondCut.FacetCut({
            facetAddress: memeFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(memeFacet)
        });

        // Prepare initialization data for core functionality
        bytes memory initData = abi.encodeWithSelector(
            CoreFacet.initialize.selector,
            msg.sender,           // _tokenCreator
            platformReferrer,     // _platformReferrer
            bondingCurveAddress,  // _bondingCurve
            tokenURI,            // _tokenURI
            memeLevels[0].memeName, // Initial name is first meme name
            symbol,              // _symbol
            memeType            // _memeType
        );

        // Add all facets and initialize through diamond cut
        IDiamondCut(memeToken).diamondCut(
            cuts,
            coreFacet,
            initData
        );

        // Initialize meme levels
        MemeFacet(memeToken).initializeMeme(memeType, memeLevels);

        emit MemeTokenDeployed(memeToken, msg.sender, memeType, bondingCurveAddress);
        return (memeToken, bondingCurveAddress);
    }


    /// @notice Returns function selectors for a given facet
    // Inside DynamicMemeFactory.sol
    function _getFunctionSelectors(address facet) internal view returns (bytes4[] memory selectors) {
        if (facet == diamondCutFacet) {
            selectors = new bytes4[](1);
            selectors[0] = IDiamondCut.diamondCut.selector;
        }
        else if (facet == erc20Facet) {
            selectors = new bytes4[](9);
            selectors[0] = ERC20Facet.name.selector;
            selectors[1] = ERC20Facet.symbol.selector;
            selectors[2] = ERC20Facet.decimals.selector;
            selectors[3] = ERC20Facet.totalSupply.selector;
            selectors[4] = ERC20Facet.balanceOf.selector;
            selectors[5] = ERC20Facet.allowance.selector;
            selectors[6] = ERC20Facet.approve.selector;
            selectors[7] = ERC20Facet.transfer.selector;
            selectors[8] = ERC20Facet.transferFrom.selector;
        }
        else if (facet == coreFacet) {
            selectors = new bytes4[](4);
            selectors[0] = CoreFacet.initialize.selector;
            selectors[1] = CoreFacet.tokenURI.selector;
            selectors[2] = CoreFacet.marketType.selector;
            selectors[3] = bytes4(keccak256("multicall(bytes[])")); // If added
        }
        else if (facet == bondingCurveFacet) {
            selectors = new bytes4[](9);
            selectors[0] = BondingCurveFacet.buy.selector;
            selectors[1] = BondingCurveFacet.sell.selector;
            selectors[2] = BondingCurveFacet.getTokensForEth.selector;
            selectors[3] = BondingCurveFacet.getEthForTokens.selector;
            selectors[4] = bytes4(keccak256("currentPrice()")); // Changed this line
            selectors[5] = bytes4(keccak256("getCurrentPriceView()")); // Add view version
            selectors[6] = bytes4(keccak256("getMarketState()"));
            selectors[7] = bytes4(0xd0e30db0); // receive()
            selectors[8] = bytes4(keccak256("fallback()")); // fallback()
        }
        else if (facet == uniswapFacet) {
            selectors = new bytes4[](6);
            selectors[0] = UniswapFacet.initializePool.selector;
            selectors[1] = UniswapFacet.graduateMarket.selector;
            selectors[2] = UniswapFacet.swapExactInputSingle.selector;
            selectors[3] = UniswapFacet.getCurrentPrice.selector;
            selectors[4] = UniswapFacet.uniswapV3SwapCallback.selector;
            selectors[5] = UniswapFacet.onERC721Received.selector;
        }
        else if (facet == feeFacet) {
            selectors = new bytes4[](4);
            selectors[0] = FeeFacet.collectFees.selector;
            selectors[1] = FeeFacet.calculateFeeBreakdown.selector;
            selectors[2] = FeeFacet.previewFees.selector;
            selectors[3] = FeeFacet.getFeeRecipients.selector;
        }
        else if (facet == memeFacet) {
            selectors = new bytes4[](8);
            selectors[0] = MemeFacet.initializeMeme.selector;
            selectors[1] = MemeFacet.updateMeme.selector;
            selectors[2] = MemeFacet.getCurrentPrice.selector;
            selectors[3] = MemeFacet.getMemeLevelsCount.selector;
            selectors[4] = MemeFacet.getAllMemeLevels.selector;
            selectors[5] = MemeFacet.getMemeState.selector;
            selectors[6] = MemeFacet.onERC721Received.selector;
            selectors[7] = bytes4(keccak256("name()")); // ERC20 name override
        }
        else {
            revert("Unknown facet");
        }
    }
}