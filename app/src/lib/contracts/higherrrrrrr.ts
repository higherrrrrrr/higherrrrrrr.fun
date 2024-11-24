import { ethers } from 'ethers'
import HigherrrrrrrABI from '@/types/contracts/Higherrrrrrr.json'

export interface PriceLevel {
    price: bigint;
    name: string;
}

export enum MarketType {
    BONDING_CURVE = 0,
    UNISWAP_V3 = 1
}

export interface MarketState {
    marketType: MarketType;
    marketAddress: string;
}

export type HigherrrrrrrConstructorParams = {
    _feeRecipient: string;
    _weth: string;
    _nonfungiblePositionManager: string;
    _swapRouter: string;
};

export type TokenCreationResult = {
    tokenAddress: string;
    convictionAddress: string;
};

export class Higherrrrrrr {
    private contract: ethers.Contract;

    constructor(
        address: string,
        signerOrProvider: ethers.Signer | ethers.Provider
    ) {
        this.contract = new ethers.Contract(address, HigherrrrrrrABI, signerOrProvider);
    }

    // Read functions
    async getCurrentPrice(): Promise<bigint> {
        return await this.contract.getCurrentPrice();
    }

    async getEthBuyQuote(ethOrderSize: bigint): Promise<bigint> {
        return await this.contract.getEthBuyQuote(ethOrderSize);
    }

    async getEthSellQuote(ethOrderSize: bigint): Promise<bigint> {
        return await this.contract.getEthSellQuote(ethOrderSize);
    }

    async getTokenBuyQuote(tokenOrderSize: bigint): Promise<bigint> {
        return await this.contract.getTokenBuyQuote(tokenOrderSize);
    }

    async getTokenSellQuote(tokenOrderSize: bigint): Promise<bigint> {
        return await this.contract.getTokenSellQuote(tokenOrderSize);
    }

    // Write functions
    async buy(
        recipient: string,
        refundRecipient: string,
        comment: string,
        expectedMarketType: MarketType,
        minOrderSize: bigint,
        sqrtPriceLimitX96: bigint,
        value: bigint
    ): Promise<ethers.ContractTransaction> {
        return await this.contract.buy(
            recipient,
            refundRecipient,
            comment,
            expectedMarketType,
            minOrderSize,
            sqrtPriceLimitX96,
            { value }
        );
    }

    async sell(
        tokensToSell: bigint,
        recipient: string,
        comment: string,
        expectedMarketType: MarketType,
        minPayoutSize: bigint,
        sqrtPriceLimitX96: bigint
    ): Promise<ethers.ContractTransaction> {
        return await this.contract.sell(
            tokensToSell,
            recipient,
            comment,
            expectedMarketType,
            minPayoutSize,
            sqrtPriceLimitX96
        );
    }

    // Standard ERC20 functions
    async balanceOf(address: string): Promise<bigint> {
        return await this.contract.balanceOf(address);
    }

    async totalSupply(): Promise<bigint> {
        return await this.contract.totalSupply();
    }

    async approve(spender: string, amount: bigint): Promise<ethers.ContractTransaction> {
        return await this.contract.approve(spender, amount);
    }
} 