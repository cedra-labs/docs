# Adding Price Protection Mechanisms

Price protection is crucial for DEX users to avoid unexpected losses from price movements and MEV attacks. This tutorial teaches you how to implement slippage tolerance and price impact limits to create a safer trading experience on Cedra.

#### What You'll Learn

- Understanding price impact vs slippage
- Calculating price movements in real-time
- Implementing protection mechanisms
- Best practices for user safety

---

## Price Impact vs Slippage: Key Differences

Price Impact is a difference between spot price and execution price due to trade size.

```
Price Impact = (Execution Price - Spot Price) / Spot Price
```

**Example**: 
- Pool: 1,000 ETH / 2,000,000 USDC (spot price: 2,000 USDC/ETH)
- Trade: Buy 100 ETH
- Execution price: ~2,227 USDC/ETH
- Price impact: (2,227 - 2,000) / 2,000 = 11.35%

Slippage the difference between expected and actual output due to other trades.

```
Slippage = (Expected Output - Actual Output) / Expected Output
```

**Example**:
- Expected: 1,980 USDC for 1 ETH
- Actual: 1,950 USDC (someone traded first)
- Slippage: (1,980 - 1,950) / 1,980 = 1.52%

## Understanding the Slippage Module

```rust
const MAX_SLIPPAGE_BPS: u64 = 500;      // 5% maximum slippage
const MAX_PRICE_IMPACT_BPS: u64 = 300;  // 3% maximum price impact
```

These constants protect users from:
- **Large price movements**: 3% max impact prevents manipulation
- **Sandwich attacks**: 5% max slippage limits MEV profitability

## Working with Basis Points

Financial systems avoid floating-point arithmetic due to precision errors that can compound over millions of transactions. Instead, we use basis points - a standard unit in finance that represents one hundredth of a percent. This approach gives us the precision needed for accurate calculations while using only integer math, making our contracts both efficient and deterministic.

```rust
const MAX_SLIPPAGE_BPS: u64 = 500;      // 5% maximum slippage
const MAX_PRICE_IMPACT_BPS: u64 = 300;  // 3% maximum price impact
```

Understanding basis points is crucial for DEX development. When a user sets 1% slippage tolerance, we represent this as 100 basis points. This granularity allows users to fine-tune their risk tolerance - someone might choose 50 basis points (0.5%) for stable pairs but 300 basis points (3%) for volatile tokens. The conversion is straightforward: multiply percentages by 100 to get basis points, or divide basis points by 100 to get percentages.

:::warning Production Consideration
In production, consider making these limits configurable per pool. Stable pairs might use 10 bps limits while volatile pairs might need 1000 bps to function effectively.
:::

### Calculating Price Impact

```rust
public fun calculate_price_impact(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64
): u64
```

:::tip View Source
Full implementation: [`calculate_price_impact`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/3-slippage.move#L25-L44)
:::

Let's examine how price impact calculation works under the hood. This implementation compares the spot price (current pool ratio) with the execution price (actual price paid after the swap) to determine how much a trade moves the market. By calculating this in basis points, we avoid floating-point arithmetic while maintaining precision - critical for financial calculations on
blockchain.

```rust
// 1. Calculate actual output after fees
let amount_out = math_amm::get_amount_out(amount_in, reserve_in, reserve_out);

// 2. Calculate spot price (current pool price)
// Multiply by 10000 for basis point precision
let spot_price = (reserve_out as u128) * 10000u128 / (reserve_in as u128);

// 3. Calculate execution price (what user pays)
let execution_price = (amount_in as u128) * 10000u128 / (amount_out as u128);

// 4. Calculate price impact in basis points
if (execution_price > spot_price) {
    ((execution_price - spot_price) * 10000u128 / spot_price as u64)
} else {
    0  // No negative impact (favorable to user)
}
```

#### Real-World Calculation Example

```rust
// Pool: 1,000 ETH / 2,000,000 USDC
let reserve_eth = 1_000_000_000;    // 1,000 ETH (6 decimals)
let reserve_usdc = 2_000_000_000_000; // 2,000,000 USDC (6 decimals)

// Trade: Buy 10 ETH
let eth_to_buy = 10_000_000; // 10 ETH

// Step 1: Calculate USDC needed (amount_in)
let usdc_needed = math_amm::get_amount_in(eth_to_buy, reserve_usdc, reserve_eth);
// Result: ~20,261 USDC

// Step 2: Calculate price impact
let impact = calculate_price_impact(usdc_needed, reserve_usdc, reserve_eth);
// Spot price: 2,000 USDC/ETH
// Execution price: 2,026.1 USDC/ETH
// Impact: 131 bps (1.31%)
```
---

## Implementing Slippage Protection

The slippage validation ensures users receive at least their minimum acceptable output, protecting against price movements between quote and execution. This calculation measures the percentage difference between what the user expected and what they actually received. If the difference exceeds the user's tolerance, the transaction reverts - preventing losses from front-running or sudden market movements.

```rust
public fun validate_slippage(
    expected_output: u64,
    actual_output: u64,
    max_slippage_bps: u64
)
```

This function ensures the actual output meets user expectations within tolerance.

### Slippage Calculation Logic

```rust
let slippage = if (expected_output > actual_output) {
    // Calculate percentage difference
    ((expected_output - actual_output) as u128) * 10000u128 / (expected_output as u128)
} else {
    0u128  // Favorable slippage (user gets more)
};

// Verify within tolerance
assert!((slippage as u64) <= max_slippage_bps, ERROR_SLIPPAGE_TOO_HIGH);
```

:::tip View Source
See validation logic: [`validate_slippage`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/3-slippage.move#L49-L59)
:::

#### Practical Example

```rust
// User expects 1,980 USDC for 1 ETH
let expected = 1_980_000_000;  // 1,980 USDC
let actual = 1_950_000_000;    // 1,950 USDC (pool changed)

// Calculate slippage
let slippage_bps = ((1_980 - 1_950) * 10000) / 1_980;
// Result: 151 bps (1.51%)

// Validate against user's tolerance (e.g., 2%)
validate_slippage(expected, actual, 200); // 200 bps = 2%
```
---

## The Safe Swap Function

The safe swap function combines all our protection mechanisms into a single, user-friendly entry point. It performs comprehensive checks before executing any trade: first validating that the price impact won't exceed safe limits, then ensuring the output meets the user's minimum requirements, and finally executing the swap only if all protections pass.

```rust
public entry fun safe_swap(
    user: &signer,
    lp_metadata: Object<Metadata>,
    x_metadata: Object<Metadata>,
    y_metadata: Object<Metadata>,
    amount_in: u64,
    min_amount_out: u64,
    max_slippage_bps: u64
)

// 1. Get current pool state
let (reserve_x, reserve_y) = swap::reserves(lp_metadata);

// 2. Calculate and validate price impact
let price_impact = calculate_price_impact(amount_in, reserve_x, reserve_y);
assert!(price_impact <= MAX_PRICE_IMPACT_BPS, ERROR_PRICE_IMPACT_TOO_HIGH);

// 3. Calculate expected output
let expected_output = math_amm::get_amount_out(amount_in, reserve_x, reserve_y);

// 4. Validate slippage tolerance
validate_slippage(expected_output, min_amount_out, max_slippage_bps);

// 5. Execute swap if all checks pass
swap::swap_exact_input(
    user, 
    lp_metadata,
    x_metadata,
    y_metadata,
    amount_in, 
    min_amount_out
);

```

:::tip View Source
Complete safe swap implementation: [`safe_swap`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/3-slippage.move#L61-L94)
:::

1. **Price Impact Check**: Ensures trade won't move price too much
2. **Slippage Validation**: Confirms output meets user expectations
3. **Atomic Execution**: All checks pass or transaction reverts

## Next Steps

You've learned how to implement comprehensive price protection:

- **Price Impact Calculation**: Measure true cost of trades
- **Slippage Protection**: Ensure users get expected outputs
- **Safe Swap Function**: Combine all protections atomically

### [Multi-hop Routing for Optimal Execution](./multi-hop-routing)
Build a router that finds the best path through multiple pools for optimal trade execution.

### [DEX Client Integration Guide](./client-integration)
Create a TypeScript/React frontend that interacts with your DEX smart contracts.
