// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "forge-std/console.sol";
import "./interfaces/IDiamondCut.sol";
import "./facets/DiamondCutFacet.sol";
import "./facets/ERC20Facet.sol";
import "./facets/CoreFacet.sol";
import "./facets/MarketFacet.sol";
import "./facets/MemeFacet.sol";
import "./facets/NFTConvictionFacet.sol";
import "./facets/BondingCurveFacet.sol";
import {LibDiamond} from "./libraries/LibDiamond.sol";
import "./EvolutionaryMeme.sol";

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
    address public immutable feeRecipient;
    address public immutable weth;
    address public immutable positionManager;
    address public immutable swapRouter;

    // Facet addresses
    address public immutable diamondCutFacet;
    address public immutable erc20Facet;
    address public immutable coreFacet;
    address public immutable marketFacet;
    address public immutable memeFacet;
    address public immutable nftConvictionFacet;
    address public immutable bondingCurveFacet;

    // Events
    event MemeTokenDeployed(
        address indexed token,
        address indexed creator,
        string memeType,
        address bondingCurve,
        uint256 timestamp
    );

    event FacetAdded(
        address indexed token,
        address indexed facet,
        bytes4[] selectors
    );

    // Errors
    error InvalidArrayLengths();
    error ZeroAddress();
    error UnknownFacet();
    error DeploymentFailed();
    error InvalidInitialization();
    error FacetCutFailed();
    error SelectorCollision(bytes4 selector);

    constructor(
        address _feeRecipient,
        address _weth,
        address _positionManager,
        address _swapRouter
    ) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        if (_weth == address(0)) revert ZeroAddress();
        if (_positionManager == address(0)) revert ZeroAddress();
        if (_swapRouter == address(0)) revert ZeroAddress();

        feeRecipient = _feeRecipient;
        weth = _weth;
        positionManager = _positionManager;
        swapRouter = _swapRouter;

        // Deploy implementation
        implementation = address(new EvolutionaryMeme(
            _feeRecipient,
            _weth,
            _positionManager,
            _swapRouter,
            address(this)
        ));

        // Deploy facets
        diamondCutFacet = address(new DiamondCutFacet());
        erc20Facet = address(new ERC20Facet());
        coreFacet = address(new CoreFacet());
        marketFacet = address(new MarketFacet());
        memeFacet = address(new MemeFacet());
        nftConvictionFacet = address(new NFTConvictionFacet());
        bondingCurveFacet = address(new BondingCurveFacet());
    }

    // Create a struct to hold initialization parameters to reduce stack variables
    struct InitParams {
        address bondingCurve;
        string tokenURI;
        string symbol;
        string memeType;
        LibDiamond.MemeLevel firstLevel;
    }

    function _prepareInitData(InitParams memory params) internal view returns (bytes memory) {
        return abi.encodeWithSignature(
            "initialize(address,address,address,string,string,string,string)",
            msg.sender,                // _tokenCreator
            address(0),               // _platformReferrer
            params.bondingCurve,      // _bondingCurve
            params.tokenURI,          // _tokenURI
            params.firstLevel.memeName, // _name
            params.symbol,            // _symbol
            params.memeType          // _memeType
        );
    }

    // Break down the initialization into smaller functions
    function _initializeMeme(
        address memeToken,
        address bondingCurveAddress,
        InitParams memory params,
        uint256[] calldata priceThresholds,
        string[] calldata memeNames
    ) internal {
        console.log("Starting _initializeMeme...");
        console.log("Meme token address:", memeToken);
        console.log("Bonding curve address:", bondingCurveAddress);

        // First register all facets
        console.log("Registering facets...");
        _registerFacets(memeToken);
        console.log("Facets registered successfully");

        // Then initialize the core facet
        console.log("Preparing init data...");
        bytes memory initData = _prepareInitData(params);
        console.log("Init data prepared, initializing core facet...");

        try IDiamondCut(memeToken).diamondCut(
            new IDiamondCut.FacetCut[](0),
            coreFacet,
            initData
        ) {
            console.log("Core facet initialized successfully");

            // Create meme levels array for initialization
            console.log("Creating meme levels...");
            LibDiamond.MemeLevel[] memory memeLevels = new LibDiamond.MemeLevel[](priceThresholds.length);
            for (uint i = 0; i < priceThresholds.length; i++) {
                memeLevels[i] = LibDiamond.MemeLevel({
                    priceThreshold: priceThresholds[i],
                    memeName: memeNames[i]
                });
            }
            console.log("Meme levels created successfully");

            // Initialize meme state through diamondCut
            console.log("Preparing meme init data...");
            bytes memory memeInitData = abi.encodeWithSelector(
                MemeFacet.initializeMeme.selector,
                params.memeType,
                memeLevels
            );
            console.log("Meme init data prepared, initializing meme facet...");

            try IDiamondCut(memeToken).diamondCut(
                new IDiamondCut.FacetCut[](0),
                memeFacet,
                memeInitData
            ) {
                console.log("Meme facet initialized successfully");
            } catch Error(string memory reason) {
                console.log("Meme facet initialization failed:", reason);
                revert DeploymentFailed();
            } catch {
                console.log("Meme facet initialization failed with low-level error");
                revert DeploymentFailed();
            }
        } catch Error(string memory reason) {
            console.log("Core facet initialization failed:", reason);
            revert DeploymentFailed();
        } catch {
            console.log("Core facet initialization failed with low-level error");
            revert DeploymentFailed();
        }
    }

    function _registerFacets(address memeToken) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // First register just the DiamondCutFacet
        IDiamondCut.FacetCut[] memory diamondCutCuts = new IDiamondCut.FacetCut[](1);
        bytes4[] memory cutSelectors = _getFunctionSelectors(diamondCutFacet);
        
        // Check for collisions in DiamondCutFacet
        for(uint i = 0; i < cutSelectors.length; i++) {
            if(ds.usedSelectors[cutSelectors[i]]) revert SelectorCollision(cutSelectors[i]);
            ds.usedSelectors[cutSelectors[i]] = true;
        }

        diamondCutCuts[0] = IDiamondCut.FacetCut({
            facetAddress: diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: cutSelectors
        });

        // Register diamondCut function first
        (bool success,) = memeToken.call(
            abi.encodeWithSelector(
                bytes4(keccak256("diamondCut((address,uint8,bytes4[])[],address,bytes)")),
                diamondCutCuts,
                address(0),
                new bytes(0)
            )
        );
        if (!success) revert FacetCutFailed();

        // Then register all other facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](6);
        address[6] memory facets = [
            erc20Facet,
            coreFacet,
            marketFacet,
            memeFacet,
            nftConvictionFacet,
            bondingCurveFacet
        ];

        for(uint i = 0; i < facets.length; i++) {
            bytes4[] memory selectors = _getFunctionSelectors(facets[i]);
            
            // Check for collisions
            for(uint j = 0; j < selectors.length; j++) {
                if(ds.usedSelectors[selectors[j]]) revert SelectorCollision(selectors[j]);
                ds.usedSelectors[selectors[j]] = true;
            }

            cuts[i] = IDiamondCut.FacetCut({
                facetAddress: facets[i],
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: selectors
            });
        }

        try IDiamondCut(memeToken).diamondCut(cuts, address(0), new bytes(0)) {
            // Success
        } catch {
            revert DeploymentFailed();
        }
    }

    function deployMeme(
        string memory symbol,
        string memory tokenURI,
        string memory memeType,
        uint256[] calldata priceThresholds,
        string[] calldata memeNames
    ) external returns (address memeToken, address bondingCurveAddress) {
        if (priceThresholds.length != memeNames.length) revert InvalidArrayLengths();
        if (priceThresholds.length == 0) revert InvalidArrayLengths();

        // Use bondingCurveFacet address instead of deploying new contract
        bondingCurveAddress = bondingCurveFacet;

        // Deploy proxy
        memeToken = address(new ERC1967Proxy(
            implementation,
            new bytes(0)
        ));

        // Initialize everything
        InitParams memory params = InitParams({
            bondingCurve: bondingCurveAddress,
            tokenURI: tokenURI,
            symbol: symbol,
            memeType: memeType,
            firstLevel: LibDiamond.MemeLevel({
                priceThreshold: priceThresholds[0],
                memeName: memeNames[0]
            })
        });

        _initializeMeme(memeToken, bondingCurveAddress, params, priceThresholds, memeNames);

        emit MemeTokenDeployed(
            memeToken,
            msg.sender,
            memeType,
            bondingCurveAddress,
            block.timestamp
        );

        return (memeToken, bondingCurveAddress);
    }

    function _getFunctionSelectors(address facet) internal view returns (bytes4[] memory selectors) {
        if (facet == address(0)) revert ZeroAddress();

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
            selectors = new bytes4[](3);
            selectors[0] = bytes4(keccak256("initialize(address,address,address,string,string,string,string)"));
            selectors[1] = CoreFacet.tokenURI.selector;
            selectors[2] = CoreFacet.marketType.selector;

            // Add debug log
            console.log("Registered initialize selector:", uint32(selectors[0]));
        }
        else if (facet == marketFacet) {
            selectors = new bytes4[](8);
            selectors[0] = MarketFacet.buy.selector;
            selectors[1] = MarketFacet.sell.selector;
            selectors[2] = MarketFacet.getMarketInfo.selector;
            selectors[3] = MarketFacet.getCurrentPrice.selector;
            selectors[4] = MarketFacet.getCurrentPriceView.selector;
            selectors[5] = MarketFacet.getUniswapPrice.selector;
            selectors[6] = MarketFacet.onERC721Received.selector;
            selectors[7] = bytes4(keccak256("getMarketState()"));
        }
        else if (facet == memeFacet) {
            selectors = new bytes4[](7);
            selectors[0] = MemeFacet.initializeMeme.selector;
            selectors[1] = MemeFacet.updateMeme.selector;
            selectors[2] = MemeFacet.getCurrentPrice.selector;
            selectors[3] = MemeFacet.getMemeLevelsCount.selector;
            selectors[4] = MemeFacet.getAllMemeLevels.selector;
            selectors[5] = MemeFacet.getMemeState.selector;
            selectors[6] = MemeFacet.onERC721Received.selector;
        }
        else if (facet == nftConvictionFacet) {
            selectors = new bytes4[](15);
            // NFT core
            selectors[0] = NFTConvictionFacet.hasConviction.selector;
            selectors[1] = NFTConvictionFacet.mintConviction.selector;
            selectors[2] = NFTConvictionFacet.burnConviction.selector;
            // ERC721 metadata
            selectors[3] = NFTConvictionFacet.tokenURI.selector;
            selectors[4] = NFTConvictionFacet.name.selector;
            selectors[5] = NFTConvictionFacet.symbol.selector;
            // ERC721 core
            selectors[6] = NFTConvictionFacet.balanceOf.selector;
            selectors[7] = NFTConvictionFacet.ownerOf.selector;
            selectors[8] = NFTConvictionFacet.approve.selector;
            selectors[9] = NFTConvictionFacet.getApproved.selector;
            selectors[10] = NFTConvictionFacet.setApprovalForAll.selector;
            selectors[11] = NFTConvictionFacet.isApprovedForAll.selector;
            // Transfer functions
            selectors[12] = NFTConvictionFacet.transferFrom.selector;
            // Both safeTransferFrom functions
            selectors[13] = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
            selectors[14] = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
        }
        else if (facet == bondingCurveFacet) {
            selectors = new bytes4[](11);
            selectors[0] = BondingCurveFacet.buy.selector;
            selectors[1] = BondingCurveFacet.sell.selector;
            selectors[2] = BondingCurveFacet.getEthSellQuote.selector;
            selectors[3] = BondingCurveFacet.getTokenSellQuote.selector;
            selectors[4] = BondingCurveFacet.getEthBuyQuote.selector;
            selectors[5] = BondingCurveFacet.getTokenBuyQuote.selector;
            selectors[6] = BondingCurveFacet.getCurrentPrice.selector;
            selectors[7] = BondingCurveFacet.getCurrentPriceView.selector;
            selectors[8] = BondingCurveFacet.remainingPrimarySupply.selector;
            selectors[9] = BondingCurveFacet.A.selector;
            selectors[10] = BondingCurveFacet.B.selector;
        }
        else {
            revert UnknownFacet();
        }
    }

    /**
     * @notice Gets all facet addresses and their selectors
     */
    function getFacetInfo(address memeToken) external view returns (
        address[] memory facets,
        uint256[] memory selectorCounts,
        bool initialized
    ) {
        facets = new address[](6);
        selectorCounts = new uint256[](6);

        facets[0] = diamondCutFacet;
        facets[1] = erc20Facet;
        facets[2] = coreFacet;
        facets[3] = marketFacet;
        facets[4] = memeFacet;
        facets[5] = nftConvictionFacet;

        for(uint i = 0; i < facets.length; i++) {
            try IDiamondCut(memeToken).facetFunctionSelectors(facets[i]) returns (bytes4[] memory selectors) {
                selectorCounts[i] = selectors.length;
            } catch {
                selectorCounts[i] = 0;
            }
        }

        // Check if token is initialized
        try ERC20Facet(memeToken).name() returns (string memory) {
            initialized = true;
        } catch {
            initialized = false;
        }

        return (facets, selectorCounts, initialized);
    }

    /**
     * @notice Gets all system addresses
     */
    function getAddresses() external view returns (
        address _implementation,
        address _feeRecipient,
        address _weth,
        address _positionManager,
        address _swapRouter
    ) {
        return (
            implementation,
            feeRecipient,
            weth,
            positionManager,
            swapRouter
        );
    }

    // Add this function to help debug
    function getInitializeSelector() public pure returns (bytes4) {
        return CoreFacet.initialize.selector;
    }
}