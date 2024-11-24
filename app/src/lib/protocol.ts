import { PriceLevel } from "@/types/tokens.types";
import { HigherrrrrrrFactory__factory } from "@/types/contracts/factories/HigherrrrrrrFactory__factory";
import { ethers } from "ethers";

export async function createNewCoin(
    provider: ethers.BrowserProvider,
    factoryAddress: string,
    name: string,
    symbol: string,
    uri: string,
    levels: PriceLevel[]
) {
    try {
        // Get signer
        const signer = await provider.getSigner();
        
        // Create contract instance
        const factory = HigherrrrrrrFactory__factory.connect(factoryAddress, signer);
        
        // Call the createHigherrrrrrr function
        const tx = await factory.createHigherrrrrrr(
            name,
            symbol,
            uri,
            levels,
            { value: ethers.parseEther("0.1") } // Adjust the value as needed
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        // Get the NewToken event from the receipt
        const event = receipt?.logs.find(
            log => log.topics[0] === factory.interface.getEvent("NewToken").topicHash
        );
        
        if (event) {
            const parsedEvent = factory.interface.parseLog({
                topics: event.topics,
                data: event.data,
            });
            
            return {
                tokenAddress: parsedEvent?.args.token,
                convictionAddress: parsedEvent?.args.conviction,
            };
        }
    } catch (error) {
        console.error("Error creating new coin:", error);
        throw error;
    }
}
