# Dynamic Fee System in Higherrrrr Protocol

The SimpleAMM in Higherrrrr Protocol implements a dynamic fee system inspired by Meteora's DLMM. This system adjusts fees based on market volatility to provide better protection for liquidity providers during high volatility periods.

## Fee Components

The total swap fee has two components:
- **Base Fee**: A fixed fee rate set during pool initialization (in basis points)
- **Variable Fee**: A dynamic fee that increases with market volatility
- **Total Fee**: Base Fee + Variable Fee

## Volatility Calculation

The protocol tracks volatility using:

1. **Volatility Accumulator (va)**: Current measure of market volatility
2. **Volatility Reference (vr)**: Reference from previous swaps that decays over time
3. **Price Reference**: Previous price used to calculate price movement
4. **Time Windows**: 
   - Filter period (tf): Minimum time between volatility updates
   - Decay period (td): Time after which volatility resets to zero

## How It Works

1. For each swap, the protocol calculates the price change since the last reference.
2. This price change contributes to a volatility accumulator.
3. The volatility accumulator grows with each volatile price movement.
4. The variable fee increases quadratically with the volatility accumulator.
5. During periods of low volatility, the fee gradually decays back to the base fee.

## Benefits

- LPs are protected from rapid price movements and sandwich attacks
- Fees automatically adjust to market conditions
- Arbitrageurs are incentivized during stable periods but pay more during volatile periods
- Protocol revenue is optimized based on market conditions

## Configuration Parameters

- `base_fee_rate`: Base fee rate in basis points (e.g., 30 = 0.3%)
- `variable_factor`: Controls how much volatility impacts fees
- `filter_period`: Time in seconds before updating price reference (e.g., 10 seconds)
- `decay_period`: Time in seconds before volatility resets (e.g., 600 seconds = 10 minutes)
- `decay_factor`: Rate at which volatility decays (in basis points, e.g., 5000 = 0.5)

## Example

In a typical market:
- Low volatility: Users pay close to the base fee (e.g., 0.3%)
- Medium volatility: Variable component adds 0.1-0.3% (total: 0.4-0.6%)
- High volatility: Variable component adds 0.5-4.7% (total: 0.8-5%)

This dynamic approach ensures the protocol can adapt to different market conditions while protecting liquidity providers. 