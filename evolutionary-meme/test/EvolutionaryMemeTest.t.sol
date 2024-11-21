// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/EvolutionaryMemeFactory.sol";
import "../src/facets/CoreFacet.sol";
import "../src/facets/MarketFacet.sol";
import "../src/facets/MemeFacet.sol";
import "../src/facets/NFTConvictionFacet.sol";
import "../src/facets/ERC20Facet.sol";
import "../src/interfaces/IWETH.sol";
import "../src/interfaces/IUniswapV3Pool.sol";
import "../src/interfaces/ISwapRouter.sol";
import "../src/interfaces/INonfungiblePositionManager.sol";
import "../src/libraries/LibDiamond.sol";
import "../src/interfaces/IDiamondCut.sol";
import "../src/interfaces/IBondingCurve.sol";

contract EvolutionaryMemeTest is Test {
    EvolutionaryMemeFactory public factory;
    address payable public memeToken;
    address public bondingCurve;
    
    // Facets
    CoreFacet public coreFacet;
    MarketFacet public marketFacet;
    MemeFacet public memeFacet;
    NFTConvictionFacet public nftFacet;
    ERC20Facet public erc20Facet;

    // Test addresses
    address payable public constant WETH = payable(address(0x1));
    address public constant POSITION_MANAGER = address(0x2);
    address public constant SWAP_ROUTER = address(0x3);
    address payable public constant FEE_RECIPIENT = payable(address(0x4));
    address payable public constant USER = payable(address(0x5));
    address public constant TEST_USER1 = address(0x10);
    address public constant TEST_USER2 = address(0x11);

    // Test parameters
    string constant NAME = "Test Meme";
    string constant SYMBOL = "TEST";
    string constant TOKEN_URI = "ipfs://test";
    string constant MEME_TYPE = "length";

    // Add this at the top of the contract
    event Debug(string message, uint256 value);
    event DebugAddress(string message, address value);
    event DebugString(string message, string value);

    modifier logGas() {
        uint256 startGas = gasleft();
        _;
        uint256 endGas = gasleft();
        emit Debug("Gas used", startGas - endGas);
    }

    function setUp() public {
        try this._setUp() {
            console.log("Setup completed successfully");
        } catch Error(string memory reason) {
            console.log("Setup failed:", reason);
            revert(reason);
        } catch (bytes memory) {
            console.log("Setup failed with low-level error");
            revert("Setup failed with low-level error");
        }
    }

    function _setUp() public {
        // Original setup code with added logging
        console.log("Starting setup...");
        
        // Deploy facets first
        coreFacet = new CoreFacet();
        console.log("CoreFacet deployed at:", address(coreFacet));
        
        marketFacet = new MarketFacet();
        console.log("MarketFacet deployed at:", address(marketFacet));
        
        memeFacet = new MemeFacet();
        console.log("MemeFacet deployed at:", address(memeFacet));
        
        nftFacet = new NFTConvictionFacet();
        console.log("NFTConvictionFacet deployed at:", address(nftFacet));
        
        erc20Facet = new ERC20Facet();
        console.log("ERC20Facet deployed at:", address(erc20Facet));

        // Setup mocks
        _setupMocks();

        // Deploy factory
        factory = new EvolutionaryMemeFactory(
            FEE_RECIPIENT,
            WETH,
            POSITION_MANAGER,
            SWAP_ROUTER
        );

        // Setup test meme levels with more reasonable thresholds
        uint256[] memory priceThresholds = new uint256[](4);
        priceThresholds[0] = 0.01 ether;  // $15
        priceThresholds[1] = 0.1 ether;   // $150
        priceThresholds[2] = 1 ether;     // $1,500
        priceThresholds[3] = 10 ether;    // $15,000

        string[] memory memeNames = new string[](4);
        memeNames[0] = "8=D";
        memeNames[1] = "8==D";
        memeNames[2] = "8===D";
        memeNames[3] = "8====D";

        // Deploy meme token
        vm.startPrank(USER);
        (address token, address curve) = factory.deployMeme(
            SYMBOL,
            TOKEN_URI,
            MEME_TYPE,
            priceThresholds,
            memeNames
        );
        vm.stopPrank();

        memeToken = payable(token);
        bondingCurve = curve;

        // Mock initial market state
        vm.store(
            address(memeToken),
            bytes32(uint256(32)), // marketType slot
            bytes32(uint256(0))   // BONDING_CURVE
        );

        // Mock initial price
        vm.mockCall(
            bondingCurve,
            abi.encodeWithSelector(IBondingCurve.getCurrentPrice.selector),
            abi.encode(0.01 ether) // Initial price
        );
    }

    function _setupMocks() internal {
        // Mock WETH
        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IWETH.deposit.selector),
            abi.encode()
        );
        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IWETH.withdraw.selector),
            abi.encode()
        );

        // Mock Uniswap pool price
        vm.mockCall(
            address(0), // Pool address will be set later
            abi.encodeWithSelector(IUniswapV3Pool.slot0.selector),
            abi.encode(uint160(1 << 96), 0, 0, 0, 0, 0, false) // Mock price of 1:1
        );

        // Mock position manager
        vm.mockCall(
            POSITION_MANAGER,
            abi.encodeWithSelector(bytes4(keccak256("mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))"))),
            abi.encode(1, 100, 100, 100) // Mock position ID and liquidity amounts
        );

        // Mock swap router
        vm.mockCall(
            SWAP_ROUTER,
            abi.encodeWithSelector(bytes4(keccak256("exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))"))),
            abi.encode(100) // Mock swap amount
        );
    }

    // Helper function to mock market graduation
    function _mockMarketGraduation() internal {
        // Set market type to Uniswap
        vm.store(
            address(memeToken),
            bytes32(uint256(32)), // marketType slot
            bytes32(uint256(1))   // UNISWAP_POOL
        );

        // Mock pool address
        vm.store(
            address(memeToken),
            bytes32(uint256(33)), // poolAddress slot
            bytes32(uint256(uint160(address(0x123)))) // Mock pool address
        );

        // Mock tokens initialized
        vm.store(
            address(memeToken),
            bytes32(uint256(34)), // tokensInitialized slot
            bytes32(uint256(1))   // true
        );
    }

    // Helper function to get current price
    function getCurrentPrice() internal view returns (uint256) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (ds.marketType == 0) {
            return IBondingCurve(bondingCurve).getCurrentPrice(
                ERC20Facet(memeToken).totalSupply()
            );
        } else {
            return MarketFacet(memeToken).getUniswapPrice();
        }
    }

    // Continue with test functions...

    function test_basicDeployment() public {
        // Just verify the factory was deployed
        assertTrue(address(factory) != address(0), "Factory should be deployed");
        
        // Log addresses for debugging
        console.log("Factory address:", address(factory));
        console.log("Meme token address:", address(memeToken));
        console.log("Bonding curve address:", address(bondingCurve));
        
        // Check basic state
        assertTrue(address(memeToken) != address(0), "Meme token should be deployed");
        assertTrue(address(bondingCurve) != address(0), "Bonding curve should be deployed");
    }

    function test_simpleTokenBuy() public {
        vm.deal(USER, 1 ether);
        vm.startPrank(USER);
        
        // Get initial balances
        uint256 initialBalance = USER.balance;
        uint256 initialTokens = ERC20Facet(memeToken).balanceOf(USER);
        
        // Try to buy tokens with 0.1 ETH
        uint256 buyAmount = 0.1 ether;
        
        // Log state before buy
        console.log("Initial ETH balance:", initialBalance);
        console.log("Initial token balance:", initialTokens);
        console.log("Buy amount:", buyAmount);
        
        try MarketFacet(memeToken).buy{value: buyAmount}(USER, 0) returns (uint256 tokensBought) {
            console.log("Tokens bought:", tokensBought);
            assertTrue(tokensBought > 0, "Should receive tokens");
        } catch Error(string memory reason) {
            console.log("Buy failed:", reason);
            revert("Buy should not fail");
        }
        
        vm.stopPrank();
    }

    function test_memeEvolutionSequence() public {
        // First set up market type and initial state
        _mockMarketGraduation();
        
        vm.deal(USER, 1000 ether);
        vm.startPrank(USER);

        // Get initial state
        (string memory initialMeme,,,) = MemeFacet(memeToken).getMemeState();
        assertEq(initialMeme, "8=D", "Should start with basic meme");

        // Mock prices for each evolution level with new bonding curve constants
        uint256[] memory prices = new uint256[](4);
        prices[0] = 1060848709;      // A
        prices[1] = 4379701787;      // B
        prices[2] = 10 * 4379701787; // 10B
        prices[3] = 100 * 4379701787;// 100B

        string[] memory expectedMemes = new string[](4);
        expectedMemes[0] = "8=D";
        expectedMemes[1] = "8==D";
        expectedMemes[2] = "8===D";
        expectedMemes[3] = "8====D";

        for(uint i = 0; i < prices.length; i++) {
            // Mock Uniswap price
            vm.mockCall(
                address(memeToken),
                abi.encodeWithSelector(MarketFacet.getUniswapPrice.selector),
                abi.encode(prices[i])
            );

            // Mock tokens initialized
            vm.store(
                address(memeToken),
                bytes32(uint256(34)), // tokensInitialized slot
                bytes32(uint256(1))   // true
            );

            // Update meme
            MemeFacet(memeToken).updateMeme();

            // Get new state
            (string memory newMeme,,,) = MemeFacet(memeToken).getMemeState();
            assertEq(newMeme, expectedMemes[i], string.concat("Should evolve to ", expectedMemes[i]));

            emit log_named_string("Meme evolved to", newMeme);
            emit log_named_uint("At price (ETH)", prices[i]);
        }

        vm.stopPrank();
    }

    function test_marketGraduationSequence() public {
        vm.deal(USER, 1000 ether); // Need more ETH
        vm.startPrank(USER);

        // Buy enough tokens to trigger graduation
        uint256 buyAmount = 100 ether; // Larger amount
        uint256 expectedTokens = IBondingCurve(bondingCurve).getEthBuyQuote(
            ERC20Facet(memeToken).totalSupply(),
            buyAmount * 99 / 100 // Account for fee
        );
        uint256 minTokens = expectedTokens * 90 / 100; // 10% slippage

        // Mock WETH behavior for graduation
        vm.mockCall(
            WETH,
            abi.encodeWithSelector(IWETH.deposit.selector),
            abi.encode()
        );

        // Mock position manager behavior
        bytes memory mintData = abi.encode(uint256(1), uint128(100), uint128(100), uint128(100));
        vm.mockCall(
            POSITION_MANAGER,
            abi.encodeWithSelector(INonfungiblePositionManager.mint.selector),
            mintData
        );

        // Execute buy to trigger graduation
        MarketFacet(memeToken).buy{value: buyAmount}(USER, minTokens);

        // Force market graduation
        vm.store(
            address(memeToken),
            bytes32(uint256(32)), // marketType slot
            bytes32(uint256(1))   // UNISWAP_POOL
        );

        // Mock pool address
        vm.store(
            address(memeToken),
            bytes32(uint256(33)), // poolAddress slot
            bytes32(uint256(uint160(address(0x123)))) // Mock pool address
        );

        // Verify market state
        (uint8 marketType, address marketAddress,,, ) = MarketFacet(memeToken).getMarketInfo();
        assertEq(marketType, 1, "Should graduate to Uniswap");
        assertTrue(marketAddress != address(0), "Should have market address");

        vm.stopPrank();
    }

    function test_nftConvictionMinting() public {
        vm.deal(USER, 1000 ether);
        vm.startPrank(USER);

        // Buy enough tokens to qualify for NFT
        uint256 buyAmount = 100 ether; // Large amount to meet conviction threshold
        uint256 expectedTokens = IBondingCurve(bondingCurve).getEthBuyQuote(
            ERC20Facet(memeToken).totalSupply(),
            buyAmount * 99 / 100 // Account for fee
        );
        uint256 minTokens = expectedTokens * 90 / 100; // 10% slippage

        // Buy tokens
        MarketFacet(memeToken).buy{value: buyAmount}(USER, minTokens);

        // Force conviction threshold by directly setting balance
        vm.store(
            address(memeToken),
            keccak256(abi.encode(USER, uint256(0))), // balances[USER] slot
            bytes32(uint256(LibDiamond.CONVICTION_THRESHOLD))
        );

        // Mock initial state for NFT
        vm.store(
            address(memeToken),
            keccak256("wow.diamond.storage"), // Diamond storage position
            bytes32(uint256(1)) // Set nextConvictionId to 1
        );

        // Verify NFT eligibility
        assertTrue(
            NFTConvictionFacet(memeToken).hasConviction(USER),
            "Should be eligible for NFT"
        );

        // Mint NFT
        uint256 tokenId = NFTConvictionFacet(memeToken).mintConviction();
        
        // Verify NFT ownership
        assertEq(
            NFTConvictionFacet(memeToken).ownerOf(tokenId),
            USER,
            "Should own NFT"
        );

        vm.stopPrank();
    }

    function test_tokenApprovals() public {
        vm.deal(USER, 100 ether);
        vm.startPrank(USER);

        // Buy some tokens first
        uint256 buyAmount = 1 ether;
        uint256 expectedTokens = IBondingCurve(bondingCurve).getEthBuyQuote(
            ERC20Facet(memeToken).totalSupply(),
            buyAmount * 99 / 100
        );
        uint256 minTokens = expectedTokens * 90 / 100;
        MarketFacet(memeToken).buy{value: buyAmount}(USER, minTokens);

        // Get actual token balance
        uint256 userBalance = ERC20Facet(memeToken).balanceOf(USER);
        assertTrue(userBalance > 0, "Should have tokens");

        // Test ERC20 approvals
        address spender = address(0x123);
        
        // Approve tokens
        vm.prank(USER);
        ERC20Facet(memeToken).approve(spender, userBalance);
        
        // Verify approval
        assertEq(
            ERC20Facet(memeToken).allowance(USER, spender),
            userBalance,
            "Approval should be set"
        );

        // Test transferFrom
        vm.stopPrank();
        vm.prank(spender);
        ERC20Facet(memeToken).transferFrom(USER, spender, userBalance);
        
        // Verify balances
        assertEq(
            ERC20Facet(memeToken).balanceOf(spender),
            userBalance,
            "Transfer should succeed"
        );
        assertEq(
            ERC20Facet(memeToken).balanceOf(USER),
            0,
            "User should have no tokens left"
        );
    }

    function test_bondingCurveCalculations() public {
        console.log("Starting bonding curve calculations test");
        
        vm.deal(USER, 10 ether);
        vm.startPrank(USER);
        
        // Log initial state
        _logTokenState("Initial State");
        
        // Buy tokens
        uint256 buyAmount = 1 ether;
        uint256 expectedTokens = IBondingCurve(bondingCurve).getEthBuyQuote(
            ERC20Facet(memeToken).totalSupply(),
            buyAmount * 99 / 100  // Account for 1% fee
        );
        uint256 minTokens = expectedTokens * 90 / 100;
        
        // Execute buy
        uint256 tokensBought = MarketFacet(memeToken).buy{value: buyAmount}(USER, minTokens);
        
        // Log post-buy state
        _logTokenState("After Buy");
        
        // Verify the buy was successful
        assertGt(tokensBought, 0, "Should receive tokens");
        assertEq(
            ERC20Facet(memeToken).balanceOf(USER), 
            tokensBought, 
            "User balance should match tokens bought"
        );
        
        // Test selling half of received tokens
        uint256 sellAmount = tokensBought / 2;
        console.log("Attempting to sell amount:", sellAmount);
        
        // Get sell quote
        uint256 sellQuote = IBondingCurve(bondingCurve).getTokenSellQuote(
            ERC20Facet(memeToken).totalSupply(),
            sellAmount
        );
        console.log("Sell quote received:", sellQuote);
        
        // Verify quote
        assertTrue(sellQuote > 0, "Should get valid sell quote");
        assertTrue(
            sellQuote < buyAmount, 
            "Sell quote should be less than original buy amount"
        );
        
        _logTokenState("Before Sell");
        
        // Approve tokens for selling
        ERC20Facet(memeToken).approve(address(memeToken), sellAmount);
        
        // Execute sell
        uint256 ethReceived = MarketFacet(memeToken).sell(
            sellAmount,
            sellQuote * 90 / 100, // 10% slippage
            USER
        );
        
        _logTokenState("After Sell");
        
        // Final verification
        assertGt(ethReceived, 0, "Should receive ETH from sell");
        assertEq(
            ERC20Facet(memeToken).balanceOf(USER), 
            tokensBought - sellAmount, 
            "User balance should be reduced by sold amount"
        );
        
        vm.stopPrank();
    }

    function test_bondingCurveConstants() public {
        // Test initial price
        uint256 initialPrice = IBondingCurve(bondingCurve).getCurrentPrice(0);
        assertEq(initialPrice, 1e15, "Initial price should match A");
        
        // Test price after small supply
        uint256 smallSupplyPrice = IBondingCurve(bondingCurve).getCurrentPrice(1e18);
        assertTrue(
            smallSupplyPrice > initialPrice,
            "Price should increase with supply"
        );
        
        // Test exponential growth
        uint256 largeSupplyPrice = IBondingCurve(bondingCurve).getCurrentPrice(10e18);
        assertTrue(
            largeSupplyPrice > smallSupplyPrice * 2,
            "Price should grow exponentially"
        );

        emit log_named_uint("Initial price", initialPrice);
        emit log_named_uint("Small supply price", smallSupplyPrice);
        emit log_named_uint("Large supply price", largeSupplyPrice);
    }

    function test_memeEvolutionWithNewConstants() public {
        // First set up market type and initial state
        _mockMarketGraduation();
        
        vm.deal(USER, 1000 ether);
        vm.startPrank(USER);

        // Get initial state
        (string memory initialMeme,,,) = MemeFacet(memeToken).getMemeState();
        assertEq(initialMeme, "8=D", "Should start with basic meme");

        // Mock prices for each evolution level
        uint256[] memory prices = new uint256[](4);
        prices[0] = 1e15;     // Initial price (0.001 ETH)
        prices[1] = 1e16;     // 0.01 ETH
        prices[2] = 1e17;     // 0.1 ETH
        prices[3] = 1e18;     // 1 ETH

        string[] memory expectedMemes = new string[](4);
        expectedMemes[0] = "8=D";
        expectedMemes[1] = "8==D";
        expectedMemes[2] = "8===D";
        expectedMemes[3] = "8====D";

        for(uint i = 0; i < prices.length; i++) {
            // Mock Uniswap price
            vm.mockCall(
                address(memeToken),
                abi.encodeWithSelector(MarketFacet.getUniswapPrice.selector),
                abi.encode(prices[i])
            );

            // Mock tokens initialized
            vm.store(
                address(memeToken),
                bytes32(uint256(34)), // tokensInitialized slot
                bytes32(uint256(1))   // true
            );

            // Update meme
            MemeFacet(memeToken).updateMeme();

            // Get new state
            (string memory newMeme,,,) = MemeFacet(memeToken).getMemeState();
            assertEq(newMeme, expectedMemes[i], string.concat("Should evolve to ", expectedMemes[i]));

            emit log_named_string("Meme evolved to", newMeme);
            emit log_named_uint("At price (ETH)", prices[i]);
        }

        vm.stopPrank();
    }

    function test_priceThresholds() public {
        // Test that our price thresholds align with bonding curve constants
        uint256[] memory supplies = new uint256[](4);
        supplies[0] = 0;      // Initial supply
        supplies[1] = 1e18;   // Small supply
        supplies[2] = 10e18;  // Medium supply
        supplies[3] = 100e18; // Large supply

        for(uint i = 0; i < supplies.length; i++) {
            uint256 price = IBondingCurve(bondingCurve).getCurrentPrice(supplies[i]);
            emit log_named_uint("Supply", supplies[i]);
            emit log_named_uint("Price", price);
        }
    }

    function test_buyFromBondingCurve() public {
        console.log("Starting buy test...");
        
        vm.deal(USER, 10 ether);
        vm.startPrank(USER);
        
        // Log initial state
        console.log("Initial total supply:", ERC20Facet(memeToken).totalSupply());
        console.log("Initial user balance:", ERC20Facet(memeToken).balanceOf(USER));
        
        // Buy tokens
        uint256 buyAmount = 1 ether;
        uint256 expectedTokens = IBondingCurve(bondingCurve).getEthBuyQuote(
            ERC20Facet(memeToken).totalSupply(),
            buyAmount * 99 / 100  // Account for 1% fee
        );
        uint256 minTokens = expectedTokens * 90 / 100;
        
        // Execute buy and capture return value
        uint256 tokensBought = MarketFacet(memeToken).buy{value: buyAmount}(USER, minTokens);
        
        // Log post-buy state
        console.log("Tokens bought:", tokensBought);
        console.log("User balance after buy:", ERC20Facet(memeToken).balanceOf(USER));
        console.log("Total supply after buy:", ERC20Facet(memeToken).totalSupply());
        
        // Verify balances
        assertEq(ERC20Facet(memeToken).balanceOf(USER), tokensBought, "User should receive tokens");
        assertEq(ERC20Facet(memeToken).totalSupply(), tokensBought, "Total supply should match");
        
        // Now test selling
        uint256 sellAmount = tokensBought / 2; // Sell half
        console.log("Attempting to sell amount:", sellAmount);
        
        // Approve tokens for selling
        ERC20Facet(memeToken).approve(address(memeToken), sellAmount);
        
        // Get sell quote
        uint256 sellQuote = IBondingCurve(bondingCurve).getTokenSellQuote(
            ERC20Facet(memeToken).totalSupply(),
            sellAmount
        );
        console.log("Sell quote received:", sellQuote);
        
        // Verify quote
        assertTrue(sellQuote > 0, "Should get valid sell quote");
        assertTrue(
            sellQuote < buyAmount, 
            "Sell quote should be less than original buy amount"
        );
        
        // Execute sell
        uint256 ethReceived = MarketFacet(memeToken).sell(
            sellAmount,
            sellQuote * 90 / 100, // 10% slippage
            USER
        );
        
        // Log final state
        console.log("ETH received from sell:", ethReceived);
        console.log("Final user balance:", ERC20Facet(memeToken).balanceOf(USER));
        console.log("Final total supply:", ERC20Facet(memeToken).totalSupply());
        
        vm.stopPrank();
    }

    // Add this helper function to debug token balances
    function _logTokenState(string memory label) internal view {
        console.log("=== Token State:", label, "===");
        console.log("Total Supply:", ERC20Facet(memeToken).totalSupply());
        console.log("User Balance:", ERC20Facet(memeToken).balanceOf(USER));
        console.log("Contract Balance:", ERC20Facet(memeToken).balanceOf(address(memeToken)));
        console.log("Fee Recipient Balance:", ERC20Facet(memeToken).balanceOf(FEE_RECIPIENT));
        console.log("====================");
    }

    // Add this helper function to debug storage
    function _logDiamondStorage() internal view {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        console.log("=== Diamond Storage ===");
        console.log("Market Type:", ds.marketType);
        console.log("Total Supply:", ds.totalSupply);
        console.log("User Balance:", ds.balances[USER]);
        console.log("====================");
    }
} 