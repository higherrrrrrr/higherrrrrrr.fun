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
import "./facets/NFTConvictionFacet.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";

/**
 * @title EvolutionaryMemeFactory
 * @notice Factory for deploying new dynamic meme tokens with upgradeable facets
 */
contract EvolutionaryMemeFactory {
    struct MemeLevel {
        uint256 priceThreshold;
        string memeName;
    }

    // Immutable addresses
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
    address public immutable nftConvictionFacet;

    // Events
    event MemeTokenDeployed(
        address indexed token,
        address indexed creator,
        string memeType,
        address bondingCurve
    );

    /**
     * @notice Deploys factory and all facet implementations
     */
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
        nftConvictionFacet = address(new NFTConvictionFacet());
    }

    /**
     * @notice Deploys a new meme token with all facets
     * @param symbol Token symbol
     * @param tokenURI IPFS URI for token metadata
     * @param memeType Type of meme (e.g., "length", "pepe", etc.)
     * @param platformReferrer Address for platform referrer fees
     * @param priceThresholds Array of price thresholds for meme evolution
     * @param memeNames Array of meme names corresponding to price thresholds
     * @return memeToken Address of deployed meme token
     * @return bondingCurveAddress Address of deployed bonding curve
     */
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
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](8);

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

        cuts[7] = IDiamondCut.FacetCut({
            facetAddress: nftConvictionFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getFunctionSelectors(nftConvictionFacet)
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

    /**
     * @notice Returns function selectors for a given facet
     * @param facet Address of the facet
     * @return selectors Array of function selectors
     */
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
            selectors[4] = bytes4(keccak256("currentPrice()"));
            selectors[5] = bytes4(keccak256("getCurrentPriceView()"));
            selectors[6] = bytes4(keccak256("getMarketState()"));
            selectors[7] = bytes4(0xd0e30db0); // receive()
            selectors[8] = bytes4(keccak256("fallback()"));
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
        else if (facet == nftConvictionFacet) {
            selectors = new bytes4[](15);
            selectors[0] = NFTConvictionFacet.hasConviction.selector;
            selectors[1] = NFTConvictionFacet.mintConviction.selector;
            selectors[2] = NFTConvictionFacet.burnConviction.selector;
            selectors[3] = NFTConvictionFacet.tokenURI.selector;
            selectors[4] = NFTConvictionFacet.name.selector;
            selectors[5] = NFTConvictionFacet.symbol.selector;
            selectors[6] = NFTConvictionFacet.balanceOf.selector;
            selectors[7] = NFTConvictionFacet.ownerOf.selector;
            selectors[8] = NFTConvictionFacet.approve.selector;
            selectors[9] = NFTConvictionFacet.getApproved.selector;
            selectors[10] = NFTConvictionFacet.setApprovalForAll.selector;
            selectors[11] = NFTConvictionFacet.isApprovedForAll.selector;
            selectors[12] = NFTConvictionFacet.transferFrom.selector;
            selectors[13] = NFTConvictionFacet.safeTransferFrom.selector;
            selectors[14] = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)")); // overloaded version
        }
        else {
            revert("Unknown facet");
        }
        return selectors;
    }

    /**
     * @notice Utility function to get all facet addresses
     */
    function getFacets() external view returns (
        address diamondCut,
        address erc20,
        address core,
        address bondingCurve,
        address uniswap,
        address fee,
        address meme,
        address nftConviction
    ) {
        return (
            diamondCutFacet,
            erc20Facet,
            coreFacet,
            bondingCurveFacet,
            uniswapFacet,
            feeFacet,
            memeFacet,
            nftConvictionFacet
        );
    }

    /**
     * @notice Utility function to get implementation addresses
     */
    function getAddresses() external view returns (
        address _implementation,
        address _protocolFeeRecipient,
        address _protocolRewards,
        address _weth,
        address _positionManager,
        address _swapRouter
    ) {
        return (
            implementation,
            protocolFeeRecipient,
            protocolRewards,
            weth,
            positionManager,
            swapRouter
        );
    }

    /**
     * @notice Utility function to verify a deployed meme token's facets
     * @param memeToken Address of the deployed meme token
     */
    function verifyDeployment(address memeToken) external view returns (
        bool hasAllFacets,
        bool[8] memory facetStatus
    ) {
        // Check each facet's functions are properly registered
        try IDiamondCut(memeToken).facetFunctionSelectors(diamondCutFacet) returns (bytes4[] memory selectors) {
            facetStatus[0] = selectors.length == _getFunctionSelectors(diamondCutFacet).length;
        } catch {
            facetStatus[0] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(erc20Facet) returns (bytes4[] memory selectors) {
            facetStatus[1] = selectors.length == _getFunctionSelectors(erc20Facet).length;
        } catch {
            facetStatus[1] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(coreFacet) returns (bytes4[] memory selectors) {
            facetStatus[2] = selectors.length == _getFunctionSelectors(coreFacet).length;
        } catch {
            facetStatus[2] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(bondingCurveFacet) returns (bytes4[] memory selectors) {
            facetStatus[3] = selectors.length == _getFunctionSelectors(bondingCurveFacet).length;
        } catch {
            facetStatus[3] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(uniswapFacet) returns (bytes4[] memory selectors) {
            facetStatus[4] = selectors.length == _getFunctionSelectors(uniswapFacet).length;
        } catch {
            facetStatus[4] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(feeFacet) returns (bytes4[] memory selectors) {
            facetStatus[5] = selectors.length == _getFunctionSelectors(feeFacet).length;
        } catch {
            facetStatus[5] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(memeFacet) returns (bytes4[] memory selectors) {
            facetStatus[6] = selectors.length == _getFunctionSelectors(memeFacet).length;
        } catch {
            facetStatus[6] = false;
        }

        try IDiamondCut(memeToken).facetFunctionSelectors(nftConvictionFacet) returns (bytes4[] memory selectors) {
            facetStatus[7] = selectors.length == _getFunctionSelectors(nftConvictionFacet).length;
        } catch {
            facetStatus[7] = false;
        }

        // Check if all facets are properly registered
        hasAllFacets = true;
        for(uint i = 0; i < facetStatus.length; i++) {
            if (!facetStatus[i]) {
                hasAllFacets = false;
                break;
            }
        }

        return (hasAllFacets, facetStatus);
    }

    /**
     * @notice Helper function to encode meme initialization data
     * @param tokenCreator Address of token creator
     * @param platformReferrer Address of platform referrer
     * @param bondingCurve Address of bonding curve
     * @param tokenURI Token URI
     * @param name Initial token name
     * @param symbol Token symbol
     * @param memeType Type of meme
     */
    function encodeInitData(
        address tokenCreator,
        address platformReferrer,
        address bondingCurve,
        string memory tokenURI,
        string memory name,
        string memory symbol,
        string memory memeType
    ) external pure returns (bytes memory) {
        return abi.encodeWithSelector(
            CoreFacet.initialize.selector,
            tokenCreator,
            platformReferrer,
            bondingCurve,
            tokenURI,
            name,
            symbol,
            memeType
        );
    }

    /**
     * @notice Internal helper to combine function selectors into a single array
     * @param selectors1 First array of selectors
     * @param selectors2 Second array of selectors
     */
    function _combineSelectors(
        bytes4[] memory selectors1,
        bytes4[] memory selectors2
    ) internal pure returns (bytes4[] memory) {
        bytes4[] memory combined = new bytes4[](selectors1.length + selectors2.length);
        for (uint i = 0; i < selectors1.length; i++) {
            combined[i] = selectors1[i];
        }
        for (uint i = 0; i < selectors2.length; i++) {
            combined[selectors1.length + i] = selectors2[i];
        }
        return combined;
    }
}