# Adding Price Protection Mechanisms

## Introduction

Price protection is crucial for DEX users to avoid unexpected losses from price movements and MEV attacks. This tutorial teaches you how to implement slippage tolerance and price impact limits to create a safer trading experience on Cedra.

## What You'll Learn

- Understanding price impact vs slippage
- Calculating price movements in real-time
- Implementing protection mechanisms
- Best practices for user safety

## Prerequisites

- Completed Tutorials 1-3
- Understanding of AMM mechanics
- Basic knowledge of basis points (bps)

## Price Impact vs Slippage: Key Differences

### Price Impact

**Definition**: The difference between spot price and execution price due to trade size.

```
Price Impact = (Execution Price - Spot Price) / Spot Price
```

**Example**: 
- Pool: 1,000 ETH / 2,000,000 USDC (spot price: 2,000 USDC/ETH)
- Trade: Buy 100 ETH
- Execution price: ~2,227 USDC/ETH
- Price impact: (2,227 - 2,000) / 2,000 = 11.35%

### Slippage

**Definition**: The difference between expected and actual output due to other trades.

```
Slippage = (Expected Output - Actual Output) / Expected Output
```

**Example**:
- Expected: 1,980 USDC for 1 ETH
- Actual: 1,950 USDC (someone traded first)
- Slippage: (1,980 - 1,950) / 1,980 = 1.52%

## Understanding the Slippage Module

### Module Constants

```move
const MAX_SLIPPAGE_BPS: u64 = 500;      // 5% maximum slippage
const MAX_PRICE_IMPACT_BPS: u64 = 300;  // 3% maximum price impact
```

These constants protect users from:
- **Large price movements**: 3% max impact prevents manipulation
- **Sandwich attacks**: 5% max slippage limits MEV profitability

### Basis Points Explained

- 1 basis point (bps) = 0.01%
- 100 bps = 1%
- 10,000 bps = 100%

Using basis points avoids floating-point math while maintaining precision.

## Calculating Price Impact

### The calculate_price_impact Function

```move
public fun calculate_price_impact(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64
): u64
```

### Implementation Deep Dive

```move
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

### Real-World Calculation Example

```move
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

## Implementing Slippage Protection

### The validate_slippage Function

```move
public fun validate_slippage(
    expected_output: u64,
    actual_output: u64,
    max_slippage_bps: u64
)
```

This function ensures the actual output meets user expectations within tolerance.

### Slippage Calculation Logic

```move
let slippage = if (expected_output > actual_output) {
    // Calculate percentage difference
    ((expected_output - actual_output) as u128) * 10000u128 / (expected_output as u128)
} else {
    0u128  // Favorable slippage (user gets more)
};

// Verify within tolerance
assert!((slippage as u64) <= max_slippage_bps, ERROR_SLIPPAGE_TOO_HIGH);
```

### Practical Example

```move
// User expects 1,980 USDC for 1 ETH
let expected = 1_980_000_000;  // 1,980 USDC
let actual = 1_950_000_000;    // 1,950 USDC (pool changed)

// Calculate slippage
let slippage_bps = ((1_980 - 1_950) * 10000) / 1_980;
// Result: 151 bps (1.51%)

// Validate against user's tolerance (e.g., 2%)
validate_slippage(expected, actual, 200); // 200 bps = 2%
```

## The Safe Swap Function

### Complete Implementation

```move
public entry fun safe_swap(
    user: &signer,
    lp_metadata: Object<Metadata>,
    x_metadata: Object<Metadata>,
    y_metadata: Object<Metadata>,
    amount_in: u64,
    min_amount_out: u64,
    max_slippage_bps: u64
)
```

This function combines all protection mechanisms:

1. **Price Impact Check**: Ensures trade won't move price too much
2. **Slippage Validation**: Confirms output meets user expectations
3. **Atomic Execution**: All checks pass or transaction reverts

### Step-by-Step Flow

```move
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

## Protection Strategies

### Strategy 1: Dynamic Slippage Based on Trade Size

```move
fun calculate_dynamic_slippage(amount_in: u64, reserve_in: u64): u64 {
    let trade_percentage = (amount_in as u128) * 10000u128 / (reserve_in as u128);
    
    if (trade_percentage < 100) {        // < 1% of pool
        50   // 0.5% slippage
    } else if (trade_percentage < 500) { // < 5% of pool
        100  // 1% slippage
    } else {
        200  // 2% slippage for large trades
    }
}
```

### Strategy 2: Time-Weighted Average Price (TWAP)

```move
struct PriceHistory has key {
    prices: vector<u64>,
    timestamps: vector<u64>,
    current_index: u64
}

fun update_twap(pool: address, current_price: u64) acquires PriceHistory {
    let history = borrow_global_mut<PriceHistory>(pool);
    let now = timestamp::now_seconds();
    
    // Store price every minute
    if (now - *vector::borrow(&history.timestamps, history.current_index) >= 60) {
        history.current_index = (history.current_index + 1) % vector::length(&history.prices);
        *vector::borrow_mut(&mut history.prices, history.current_index) = current_price;
        *vector::borrow_mut(&mut history.timestamps, history.current_index) = now;
    }
}

fun get_twap(pool: address, period: u64): u64 acquires PriceHistory {
    // Calculate average price over period
    let history = borrow_global<PriceHistory>(pool);
    let mut sum = 0u128;
    let mut count = 0u64;
    let now = timestamp::now_seconds();
    
    let i = 0;
    while (i < vector::length(&history.prices)) {
        let timestamp = *vector::borrow(&history.timestamps, i);
        if (now - timestamp <= period) {
            sum = sum + (*vector::borrow(&history.prices, i) as u128);
            count = count + 1;
        }
        i = i + 1;
    }
    
    (sum / (count as u128) as u64)
}
```

### Strategy 3: MEV Protection with Commit-Reveal

```move
struct PendingSwap has key {
    commitment: vector<u8>,
    amount_in: u64,
    min_out: u64,
    deadline: u64
}

// Phase 1: Commit to swap
public entry fun commit_swap(
    user: &signer,
    commitment: vector<u8>,  // hash(amount_in, min_out, nonce)
    deadline: u64
) {
    move_to(user, PendingSwap {
        commitment,
        amount_in: 0,
        min_out: 0,
        deadline
    });
}

// Phase 2: Reveal and execute
public entry fun reveal_swap(
    user: &signer,
    lp_metadata: Object<Metadata>,
    amount_in: u64,
    min_out: u64,
    nonce: u64
) acquires PendingSwap {
    let pending = move_from<PendingSwap>(signer::address_of(user));
    
    // Verify commitment
    let revealed = hash::sha3_256(
        bcs::to_bytes(&amount_in) + 
        bcs::to_bytes(&min_out) + 
        bcs::to_bytes(&nonce)
    );
    assert!(revealed == pending.commitment, ERROR_INVALID_REVEAL);
    
    // Execute swap
    safe_swap(user, lp_metadata, ..., amount_in, min_out, 100);
}
```

## Integration Examples

### Example 1: User-Friendly Web3 Integration

```typescript
class SafeDEX {
  // Calculate recommended slippage based on trade size
  async getRecommendedSlippage(
    poolAddress: string,
    amountIn: bigint
  ): Promise<number> {
    const [reserveIn, reserveOut] = await this.getReserves(poolAddress);
    const priceImpact = this.calculatePriceImpact(amountIn, reserveIn, reserveOut);
    
    // Add buffer to price impact
    if (priceImpact < 50) return 100;      // 1% for small trades
    if (priceImpact < 200) return 300;     // 3% for medium trades
    return 500;                            // 5% for large trades
  }
  
  // Execute swap with auto-protection
  async swapWithProtection(
    user: Account,
    poolAddress: string,
    amountIn: bigint,
    customSlippage?: number
  ) {
    const slippage = customSlippage ?? await this.getRecommendedSlippage(poolAddress, amountIn);
    const expectedOut = await this.getAmountOut(poolAddress, amountIn);
    const minOut = (expectedOut * BigInt(10000 - slippage)) / 10000n;
    
    return await this.cedra.transaction.build.simple({
      function: `${MODULE_ADDRESS}::slippage::safe_swap`,
      arguments: [
        poolAddress,
        inputToken,
        outputToken,
        amountIn.toString(),
        minOut.toString(),
        slippage
      ]
    });
  }
}
```

### Example 2: Arbitrage Bot Protection

```move
module dex::anti_mev {
    struct LastSwap has key {
        trader: address,
        block_height: u64,
        amount: u64
    }
    
    public entry fun protected_swap(
        user: &signer,
        lp_metadata: Object<Metadata>,
        amount_in: u64,
        min_out: u64
    ) acquires LastSwap {
        let user_addr = signer::address_of(user);
        let current_block = block::get_current_block_height();
        
        // Check for same-block repeated swaps
        if (exists<LastSwap>(user_addr)) {
            let last = borrow_global<LastSwap>(user_addr);
            assert!(
                last.block_height < current_block, 
                ERROR_SAME_BLOCK_SWAP
            );
        }
        
        // Execute swap
        slippage::safe_swap(user, lp_metadata, ..., amount_in, min_out, 100);
        
        // Record swap
        move_to(user, LastSwap {
            trader: user_addr,
            block_height: current_block,
            amount: amount_in
        });
    }
}
```

## Testing Price Protection

### Unit Test Suite

```move
#[test]
fun test_price_impact_calculation() {
    // Small trade: < 0.1% of pool
    let impact = calculate_price_impact(
        1_000_000,        // 1 token
        1_000_000_000,    // 1000 token reserve
        2_000_000_000     // 2000 token reserve
    );
    assert!(impact < 10, 0); // Less than 0.1%
    
    // Large trade: 10% of pool
    let impact = calculate_price_impact(
        100_000_000,      // 100 tokens
        1_000_000_000,    // 1000 token reserve
        2_000_000_000     // 2000 token reserve
    );
    assert!(impact > 1000, 1); // More than 10%
}

#[test]
#[expected_failure(abort_code = ERROR_PRICE_IMPACT_TOO_HIGH)]
fun test_excessive_price_impact() {
    // Try to trade 50% of pool
    safe_swap(
        user,
        lp_metadata,
        x_metadata,
        y_metadata,
        500_000_000,      // 50% of reserve
        0,
        500
    );
}

#[test]
fun test_slippage_protection() {
    let expected = 1_000_000;
    let actual = 950_000;
    
    // Should pass with 10% tolerance
    validate_slippage(expected, actual, 1000);
    
    // Should fail with 1% tolerance
    validate_slippage(expected, actual, 100); // This will abort
}
```

## Best Practices

### 1. Default Protection Levels

```move
const DEFAULT_SLIPPAGE_BPS: u64 = 100;     // 1% default
const WARNING_IMPACT_BPS: u64 = 200;       // Warn at 2%
const CRITICAL_IMPACT_BPS: u64 = 500;      // Block at 5%
```

### 2. User Education

Provide clear feedback about protection:

```move
struct SwapReceipt has drop {
    amount_in: u64,
    amount_out: u64,
    price_impact_bps: u64,
    slippage_applied_bps: u64,
    protection_triggered: bool
}

public fun swap_with_receipt(
    user: &signer,
    ...
): SwapReceipt {
    // Execute swap and return detailed receipt
}
```

### 3. Emergency Circuit Breakers

```move
struct CircuitBreaker has key {
    max_trade_size: u64,
    daily_volume_limit: u64,
    current_volume: u64,
    last_reset: u64
}

fun check_circuit_breaker(amount: u64) acquires CircuitBreaker {
    let breaker = borrow_global_mut<CircuitBreaker>(@dex);
    
    // Reset daily counter
    let now = timestamp::now_seconds();
    if (now - breaker.last_reset > 86400) {
        breaker.current_volume = 0;
        breaker.last_reset = now;
    }
    
    // Check limits
    assert!(amount <= breaker.max_trade_size, ERROR_TRADE_TOO_LARGE);
    assert!(
        breaker.current_volume + amount <= breaker.daily_volume_limit,
        ERROR_DAILY_LIMIT_EXCEEDED
    );
    
    breaker.current_volume = breaker.current_volume + amount;
}
```

## Common Issues and Solutions

### Issue: "Price impact too high"
**Causes**:
- Trade size too large relative to pool
- Insufficient liquidity

**Solutions**:
- Break trade into smaller chunks
- Use multi-hop routing through deeper pools
- Wait for more liquidity

### Issue: "Slippage tolerance exceeded"
**Causes**:
- High volatility period
- Front-running attempts
- Network congestion

**Solutions**:
- Increase slippage tolerance
- Use private mempools
- Implement commit-reveal pattern

### Issue: False positives blocking legitimate trades
**Causes**:
- Protection thresholds too strict
- Calculation precision issues

**Solutions**:
- Implement dynamic thresholds
- Add governance controls
- Use time-weighted averages

## Summary

You've learned how to implement comprehensive price protection:

- **Price Impact Calculation**: Measure true cost of trades
- **Slippage Protection**: Ensure users get expected outputs
- **Safe Swap Function**: Combine all protections atomically
- **Advanced Strategies**: TWAP, MEV protection, circuit breakers

These mechanisms create a safer trading environment while maintaining DEX efficiency.

Your DEX now provides institutional-grade price protection!