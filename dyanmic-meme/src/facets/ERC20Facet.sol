// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import {LibToken} from "../libraries/LibToken.sol";

contract ERC20Facet is IERC20 {
    function name() external view returns (string memory) {
        return LibDiamond.diamondStorage().name;
    }

    function symbol() external view returns (string memory) {
        return LibDiamond.diamondStorage().symbol;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function totalSupply() external view override returns (uint256) {
        return LibDiamond.diamondStorage().totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return LibDiamond.diamondStorage().balances[account];
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return LibDiamond.diamondStorage().allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(to != address(0), "ERC20: transfer to zero");

        uint256 balance = ds.balances[msg.sender];
        require(balance >= amount, "ERC20: insufficient");

        unchecked {
            ds.balances[msg.sender] = balance - amount;
            ds.balances[to] += amount;
        }

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(to != address(0), "ERC20: transfer to zero");

        uint256 balance = ds.balances[from];
        require(balance >= amount, "ERC20: insufficient");

        uint256 allowed = ds.allowances[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "ERC20: insufficient allowance");
            unchecked {
                ds.allowances[from][msg.sender] = allowed - amount;
            }
        }

        unchecked {
            ds.balances[from] = balance - amount;
            ds.balances[to] += amount;
        }

        emit Transfer(from, to, amount);
        return true;
    }
}