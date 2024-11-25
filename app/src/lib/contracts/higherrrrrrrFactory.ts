import { ethers } from 'ethers'
import HigherrrrrrrFactoryABI from '@/types/contracts/HigherrrrrrrFactory.json'
import { PriceLevel, TokenCreationResult } from './higherrrrrrr'

interface ContractConfig {
  address: string;
  abi: any[];
}

export class HigherrrrrrrFactory {
    private contract: ethers.Contract;

    constructor(
        address: string,
        signerOrProvider: ethers.Signer | ethers.Provider
    ) {
        this.contract = new ethers.Contract(address, HigherrrrrrrFactoryABI, signerOrProvider);
    }

    async createHigherrrrrrr(
        name: string,
        symbol: string,
        uri: string,
        priceLevels: PriceLevel[]
    ): Promise<TokenCreationResult> {
        const tx = await this.contract.createHigherrrrrrr(
            name,
            symbol,
            uri,
            priceLevels.map(level => ({
                price: level.price,
                name: level.name
            }))
        );

        const receipt = await tx.wait();
        const event = receipt.logs
            .map((log: any) => {
                try {
                    return this.contract.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find((event: any) => event && event.name === 'NewToken');

        if (!event) {
            throw new Error('Failed to create token: NewToken event not found');
        }

        return {
            tokenAddress: event.args.token,
            convictionAddress: event.args.conviction
        };
    }

    // Read functions
    async getBondingCurve(): Promise<string> {
        return await this.contract.bondingCurve();
    }

    async getFeeRecipient(): Promise<string> {
        return await this.contract.feeRecipient();
    }

    async getNonfungiblePositionManager(): Promise<string> {
        return await this.contract.nonfungiblePositionManager();
    }

    async getSwapRouter(): Promise<string> {
        return await this.contract.swapRouter();
    }

    async getWeth(): Promise<string> {
        return await this.contract.weth();
    }
} 