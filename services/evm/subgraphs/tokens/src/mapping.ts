import { NewToken as NewTokenEvent } from "../generated/Contract/Contract"
import { NewTokenEvent as NewTokenEventEntity } from "../generated/schema"
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

export function handleNewToken(event: NewTokenEvent): void {
  let entity = new NewTokenEventEntity(event.transaction.hash.toHex())
  
  entity.token = event.params.token.toHexString()
  entity.conviction = event.params.conviction.toHexString()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash.toHexString()
  entity.volumeETH = BigDecimal.fromString('0')
  entity.lastTradeTimestamp = event.block.timestamp
  entity.tradeCount = BigInt.fromI32(0)
  entity.marketType = 0 // Default to bonding curve
  
  entity.save()
}