// src/facets/FeeFacet.sol
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IProtocolRewards} from "../interfaces/IProtocolRewards.sol";

contract FeeFacet {
    // Fee constants
    uint256 public constant TOTAL_FEE_BPS = 100;            // 1%
    uint256 public constant TOKEN_CREATOR_FEE_BPS = 5000;   // 50% of total fee
    uint256 public constant PROTOCOL_FEE_BPS = 2000;        // 20% of total fee
    uint256 public constant PLATFORM_REFERRER_FEE_BPS = 1500; // 15% of total fee
    uint256 public constant ORDER_REFERRER_FEE_BPS = 1500;  // 15% of total fee

    event FeesCollected(
        address tokenCreator,
        address platformReferrer,
        address orderReferrer,
        address protocolFeeRecipient,
        uint256 tokenCreatorFee,
        uint256 platformReferrerFee,
        uint256 orderReferrerFee,
        uint256 protocolFee
    );

    error FeeTransferFailed();
    error InvalidFeeAmount();

    struct FeeBreakdown {
        uint256 totalFee;
        uint256 tokenCreatorFee;
        uint256 platformReferrerFee;
        uint256 orderReferrerFee;
        uint256 protocolFee;
    }

    /**
     * @notice Calculates and distributes fees for a given transaction
     * @param amount The base amount to calculate fees from
     * @param orderReferrer The referrer for this specific order
     * @return totalFee The total fee amount collected
     */
    function collectFees(
        uint256 amount,
        address orderReferrer
    ) external returns (uint256 totalFee) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (amount == 0) revert InvalidFeeAmount();

        // Calculate individual fee components
        FeeBreakdown memory fees = calculateFeeBreakdown(amount);
        totalFee = fees.totalFee;

        // If no order referrer, use protocol fee recipient
        if (orderReferrer == address(0)) {
            orderReferrer = ds.protocolFeeRecipient;
        }

        // Prepare batch deposit to protocol rewards
        address[] memory recipients = new address[](4);
        uint256[] memory amounts = new uint256[](4);
        bytes4[] memory reasons = new bytes4[](4);

        // Token creator fee
        recipients[0] = ds.tokenCreator;
        amounts[0] = fees.tokenCreatorFee;
        reasons[0] = bytes4(keccak256("WOW_CREATOR_FEE"));

        // Platform referrer fee
        recipients[1] = ds.platformReferrer;
        amounts[1] = fees.platformReferrerFee;
        reasons[1] = bytes4(keccak256("WOW_PLATFORM_REFERRER_FEE"));

        // Order referrer fee
        recipients[2] = orderReferrer;
        amounts[2] = fees.orderReferrerFee;
        reasons[2] = bytes4(keccak256("WOW_ORDER_REFERRER_FEE"));

        // Protocol fee
        recipients[3] = ds.protocolFeeRecipient;
        amounts[3] = fees.protocolFee;
        reasons[3] = bytes4(keccak256("WOW_PROTOCOL_FEE"));

        // Deposit all fees in one transaction
        IProtocolRewards(ds.protocolRewards).depositBatch{value: totalFee}(
            recipients,
            amounts,
            reasons,
            ""
        );

        emit FeesCollected(
            ds.tokenCreator,
            ds.platformReferrer,
            orderReferrer,
            ds.protocolFeeRecipient,
            fees.tokenCreatorFee,
            fees.platformReferrerFee,
            fees.orderReferrerFee,
            fees.protocolFee
        );

        return totalFee;
    }

    /**
     * @notice Calculates the fee breakdown for a given amount
     * @param amount The base amount to calculate fees from
     * @return FeeBreakdown The calculated fee components
     */
    function calculateFeeBreakdown(uint256 amount) public pure returns (FeeBreakdown memory) {
        uint256 totalFee = (amount * TOTAL_FEE_BPS) / 10000;

        return FeeBreakdown({
            totalFee: totalFee,
            tokenCreatorFee: (totalFee * TOKEN_CREATOR_FEE_BPS) / 10000,
            platformReferrerFee: (totalFee * PLATFORM_REFERRER_FEE_BPS) / 10000,
            orderReferrerFee: (totalFee * ORDER_REFERRER_FEE_BPS) / 10000,
            protocolFee: (totalFee * PROTOCOL_FEE_BPS) / 10000
        });
    }

    /**
     * @notice View function to preview fees for a given amount
     * @param amount The amount to calculate fees for
     * @return totalFee The total fee that would be charged
     */
    function previewFees(uint256 amount) external pure returns (
        uint256 totalFee,
        uint256 amountAfterFees,
        FeeBreakdown memory breakdown
    ) {
        breakdown = calculateFeeBreakdown(amount);
        totalFee = breakdown.totalFee;
        amountAfterFees = amount - totalFee;
    }

    /**
     * @notice Get current fee recipients
     */
    function getFeeRecipients() external view returns (
        address tokenCreator,
        address platformReferrer,
        address protocolFeeRecipient
    ) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return (
            ds.tokenCreator,
            ds.platformReferrer,
            ds.protocolFeeRecipient
        );
    }

    /**
     * @notice Get all fee percentages in basis points
     */
    function getFeeStructure() external pure returns (
        uint256 totalFeeBps,
        uint256 tokenCreatorFeeBps,
        uint256 platformReferrerFeeBps,
        uint256 orderReferrerFeeBps,
        uint256 protocolFeeBps
    ) {
        return (
            TOTAL_FEE_BPS,
            TOKEN_CREATOR_FEE_BPS,
            PLATFORM_REFERRER_FEE_BPS,
            ORDER_REFERRER_FEE_BPS,
            PROTOCOL_FEE_BPS
        );
    }
}