# Understanding Automated Market Makers on Cedra

Automated Market Makers (AMMs) revolutionized decentralized trading by replacing traditional order books with mathematical formulas. This tutorial teaches you the core concepts behind AMMs and how they work on Cedra blockchain.

## What You'll Learn

- How the constant product formula (x*y=k) works
- Why AMMs are essential for DeFi
- How trading fees benefit liquidity providers
- Real-world applications and use cases

---

## The Constant Product Formula

AMMs use a simple yet powerful formula: **x * y = k**

Where:
- `x` = quantity of token A in the pool
- `y` = quantity of token B in the pool
- `k` = constant product (remains unchanged during swaps)

Imagine a pool with:
- 1,000 ETH (x)
- 2,000,000 USDC (y)
- k = 1,000 * 2,000,000 = 2,000,000,000

When someone buys 10 ETH:
1. ETH in pool decreases: 1,000 - 10 = 990
2. To maintain k, USDC must increase: 2,000,000,000 / 990 = 2,020,202
3. User pays: 2,020,202 - 2,000,000 = 20,202 USDC

### Price Impact in Action

The relationship between trade size and price impact isn't linear - it's exponential. This fundamental property of the constant product formula protects pools from being drained while ensuring continuous liquidity availability. Let's explore this through a practical demonstration that shows how dramatically prices change as trades get larger.

```rust
module tutorial::amm_demo {
    use simple_dex::math_amm;
    
    #[test]
    fun demonstrate_price_impact() {
        // Initialize our pool with a 1:2000 ETH/USDC ratio
        // This represents a typical mid-sized liquidity pool
        let reserve_eth = 1000000; // 1,000 ETH with 6 decimal precision
        let reserve_usdc = 2000000000; // 2,000,000 USDC establishing $2000/ETH price
        
        // Small trades barely move the price - this is what enables
        // efficient trading for regular users. The pool can handle
        // many small trades without significant price deterioration
        let small_output = math_amm::get_amount_out(
            1000000, // Trading just 1 ETH
            reserve_eth,
            reserve_usdc
        );
        // The output is approximately 1,996 USDC, showing only 0.2% slippage
        // This minor price impact makes the pool attractive for traders
        
        // Large trades tell a different story. As trade size increases
        // relative to pool reserves, the price impact grows exponentially
        // This natural mechanism prevents pool manipulation
        let large_output = math_amm::get_amount_out(
            100000000, // Trading 100 ETH (10% of pool)
            reserve_eth,
            reserve_usdc
        );
        // The total output is ~181,488 USDC for 100 ETH
        // That's only 1,814.88 per ETH - a 9.2% price impact!
        // This dramatic difference protects the pool while rewarding liquidity providers
    }
}

```
This exponential price curve serves multiple purposes: it maintains pool stability by making large trades increasingly expensive, creates arbitrage opportunities that keep prices aligned across markets, and ensures there's always liquidity available at some price point. The beauty of this system lies in its simplicity - no complex order matching or market makers needed, just pure mathematics ensuring fair and continuous trading.

:::tip View Complete Math Module
Explore all AMM math functions: [`math_amm.move`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/1-math-amm.move)
:::

### The 0.3% Standard

Every swap incurs a 0.3% fee, which:
- Compensates liquidity providers for impermanent loss risk
- Creates sustainable yield for the protocol
- Prevents arbitrage attacks

```rust
// From math_amm.move
let amount_in_with_fee = (amount_in as u128) * 997u128; // 99.7% after 0.3% fee
let numerator = amount_in_with_fee * (reserve_out as u128);
let denominator = (reserve_in as u128) * 1000u128 + amount_in_with_fee;
```

:::tip View Source
See the complete implementation: [`get_amount_out`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/1-math-amm.move#L12-L26)
:::

Trading 100 USDC for ETH with 0.3% fee:
- Effective input: 99.70 USDC
- Fee collected: 0.30 USDC
- Fee goes to liquidity providers

---

## Liquidity Provider Tokens

When you provide liquidity, you receive LP tokens representing your pool share:

```rust
// Simplified LP calculation
let lp_amount = if (total_supply == 0) {
    sqrt(amount_x * amount_y) // Initial liquidity
} else {
    min(
        amount_x * total_supply / reserve_x,
        amount_y * total_supply / reserve_y
    )
}
```

:::tip View Source
See LP token calculations in action: [`add_liquidity`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/2-swap.move#L106-L163)
:::

1. **Initial Liquidity**: Alice adds 100 ETH + 200,000 USDC
   - Receives: 1,414 LP tokens (sqrt(100 * 200,000))

2. **Second Provider**: Bob adds 50 ETH + 100,000 USDC
   - Pool now has: 100 ETH + 200,000 USDC
   - Bob receives: 707 LP tokens (50% of Alice's share)

3. **Fee Accumulation**: After $1M volume at 0.3% fee
   - $3,000 in fees added to pool
   - Alice's share: 66.67% = $2,000
   - Bob's share: 33.33% = $1,000

---

## Real-World Applications

### 1. Decentralized Trading
- No order books or market makers needed
- 24/7 liquidity availability
- Permissionless trading

### 2. Price Discovery
- Market-driven price determination
- Arbitrage keeps prices aligned
- Transparent pricing mechanism

### 3. Yield Generation
- Passive income from trading fees
- No active management required
- Compound growth potential

---

## Next Steps

You've learned how AMMs use the x*y=k formula to enable decentralized trading. Key takeaways:

- Constant product formula maintains market equilibrium
- Trading fees compensate liquidity providers
- Price impact increases with trade size
- LP tokens represent proportional pool ownership

### [Building Your First Trading Pair](./first-trading-pair)
Hands-on implementation of a basic trading pair with swap, add liquidity, and remove liquidity functions.

### [Adding Price Protection Mechanisms](./price-protection)
Implement slippage protection, minimum output amounts, and deadline checks to protect users.

### [Multi-hop Routing for Optimal Execution](./multi-hop-routing)
Build a router that finds the best path through multiple pools for optimal trade execution.

### [DEX Client Integration Guide](./client-integration)
Create a TypeScript/React frontend that interacts with your DEX smart contracts.