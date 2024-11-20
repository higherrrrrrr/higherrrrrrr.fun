// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "./LibDiamond.sol";

library LibToken {
    event Transfer(address indexed from, address indexed to, uint256 value);

    function _mint(address to, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(to != address(0), "ERC20: mint to zero");
        require(ds.totalSupply + amount <= LibDiamond.MAX_TOTAL_SUPPLY, "ERC20: max supply");

        unchecked {
            ds.totalSupply += amount;
            ds.balances[to] += amount;
        }

        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(from != address(0), "ERC20: burn from zero");

        uint256 balance = ds.balances[from];
        require(balance >= amount, "ERC20: burn amount exceeds balance");

        unchecked {
            ds.balances[from] = balance - amount;
            ds.totalSupply -= amount;
        }

        emit Transfer(from, address(0), amount);
    }
}