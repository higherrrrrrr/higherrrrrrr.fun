// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {LibDiamond} from "./LibDiamond.sol";

library LibToken {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function _transfer(address from, address to, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = ds.balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            ds.balances[from] = fromBalance - amount;
            ds.balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(account != address(0), "ERC20: mint to the zero address");

        ds.totalSupply += amount;
        unchecked {
            ds.balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = ds.balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            ds.balances[account] = accountBalance - amount;
            ds.totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        ds.allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}