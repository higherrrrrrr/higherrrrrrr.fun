#!/bin/bash

# First reset the database
echo "Resetting database for clean test..."
curl -s -X POST http://localhost:3000/api/dev/reset

# Generate a unique wallet address
WALLET="test_wallet_$(date +%s)_$(openssl rand -hex 4)"
echo "========= PnL Test with different token decimals: $WALLET ========="

# Skip trying to read .env file (which doesn't exist in the tests directory)
# Instead, use API endpoints to get results

# Test 1: Testing with SOL (9 decimals)
echo -e "\n1. Buying 1 SOL at \$100/SOL"
HASH1="buy_sol_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH1'",
    "wallet_address": "'$WALLET'",
    "token_in": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "token_out": "So11111111111111111111111111111111111111112",
    "amount_in": "100",
    "amount_out": "1",
    "price_in_usd": "1.00",
    "price_out_usd": "100.00",
    "value_in_usd": "100",
    "value_out_usd": "100"
  }'
sleep 1

echo -e "\n2. Selling 0.5 SOL at \$120/SOL (profit)"
HASH2="sell_sol_profit_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH2'",
    "wallet_address": "'$WALLET'",
    "token_in": "So11111111111111111111111111111111111111112",
    "token_out": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount_in": "0.5",
    "amount_out": "60",
    "price_in_usd": "120.00",
    "price_out_usd": "1.00",
    "value_in_usd": "60",
    "value_out_usd": "60"
  }'
sleep 1

# Test 2: Testing with USDC (6 decimals)
echo -e "\n3. Buying 100 USDC at \$1/USDC"
HASH3="buy_usdc_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH3'",
    "wallet_address": "'$WALLET'",
    "token_in": "So11111111111111111111111111111111111111112",
    "token_out": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount_in": "0.5",
    "amount_out": "100",
    "price_in_usd": "100.00",
    "price_out_usd": "1.00",
    "value_in_usd": "50",
    "value_out_usd": "100"
  }'
sleep 1

echo -e "\n4. Selling 50 USDC at \$0.99/USDC (loss)"
HASH4="sell_usdc_loss_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH4'",
    "wallet_address": "'$WALLET'",
    "token_in": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "token_out": "So11111111111111111111111111111111111111112",
    "amount_in": "50",
    "amount_out": "0.495",
    "price_in_usd": "0.99",
    "price_out_usd": "100.00",
    "value_in_usd": "49.5",
    "value_out_usd": "49.5"
  }'
sleep 1

# Test 3: Testing with very large and very small amounts
echo -e "\n5. Trading a very small token amount (BONK - 5 decimals)"
HASH5="buy_bonk_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH5'",
    "wallet_address": "'$WALLET'",
    "token_in": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "token_out": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "amount_in": "10",
    "amount_out": "1000000",
    "price_in_usd": "1.00",
    "price_out_usd": "0.00001",
    "value_in_usd": "10",
    "value_out_usd": "10"
  }'
sleep 1

echo -e "\n6. Selling half of BONK at 20% higher price"
HASH6="sell_bonk_profit_$(date +%s)"
curl -s -X POST http://localhost:3000/api/trades/record \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "'$HASH6'",
    "wallet_address": "'$WALLET'",
    "token_in": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "token_out": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount_in": "500000",
    "amount_out": "6",
    "price_in_usd": "0.000012",
    "price_out_usd": "1.00",
    "value_in_usd": "6",
    "value_out_usd": "6"
  }'
sleep 1

# Final check - using API instead of psql
echo -e "\nFinal portfolio via API:"
curl -s "http://localhost:3000/api/portfolio?wallet_address=$WALLET" | python3 -m json.tool || echo "API call failed"

echo -e "\nTrades via API:"
curl -s "http://localhost:3000/api/trades?wallet_address=$WALLET" | python3 -m json.tool || echo "API call failed"

echo "========= Test Complete =========" 