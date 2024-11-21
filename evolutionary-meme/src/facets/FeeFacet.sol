// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "../libraries/LibDiamond.sol";

contract FeeFacet {
    // Fee constant
    uint256 public constant TOTAL_FEE_BPS = 100; // 1%

    // Events
    event FeesCollected(
        address indexed feeMultisig,
        uint256 totalFee
    );

    // Errors
    error FeeTransferFailed();
    error InvalidFeeAmount();

    /**
     * @notice Collects fees and sends them to the multisig
     * @param amount The base amount to calculate fees from
     * @return totalFee The total fee amount collected
     */
    function collectFees(
        uint256 amount,
        address /* orderReferrer - kept for interface compatibility */
    ) external returns (uint256 totalFee) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        if (amount == 0) revert InvalidFeeAmount();

        // Calculate fee
        totalFee = (amount * TOTAL_FEE_BPS) / 10000;

        // Send fee to multisig
        (bool success,) = ds.protocolFeeRecipient.call{value: totalFee}("");
        if (!success) revert FeeTransferFailed();

        emit FeesCollected(ds.protocolFeeRecipient, totalFee);
        return totalFee;
    }

    /**
     * @notice Preview fees for a given amount
     * @param amount The amount to calculate fees for
     */
    function previewFees(uint256 amount) external pure returns (
        uint256 totalFee,
        uint256 amountAfterFees
    ) {
        totalFee = (amount * TOTAL_FEE_BPS) / 10000;
        amountAfterFees = amount - totalFee;
    }

    /**
     * @notice Get fee recipient address
     */
    function getFeeRecipient() external view returns (address) {
        return LibDiamond.diamondStorage().protocolFeeRecipient;
    }

    /**
     * @notice Get fee percentage in basis points
     */
    function getFeeStructure() external pure returns (uint256) {
        return TOTAL_FEE_BPS;
    }
}