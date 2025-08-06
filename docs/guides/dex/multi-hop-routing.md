# Multi-hop Routing for Optimal Execution

Not all token pairs have direct liquidity pools. Multi-hop routing enables trades between any two tokens by routing through intermediate pools, finding the best path for optimal execution. This tutorial teaches you how to implement and optimize multi-hop swaps on Cedra.

#### What You'll Learn:
- Why multi-hop routing is essential
- Implementing two-hop and multi-hop swaps
- Path finding algorithms
- Gas optimization strategies
- Real-world routing examples

---

## The Liquidity Network Challenge

Imagine a DEX as a city where tokens are neighborhoods and liquidity pools are roads connecting them. In a perfect world, every neighborhood would have a direct road to every other neighborhood. But in reality, building and maintaining all these roads (liquidity pools) is impossibly expensive. With just 100 tokens, you'd need 4,950 separate pools to connect everything directly.

Multi-hop routing solves this by finding paths through intermediate destinations. Just as you might drive through downtown to get from the suburbs to the airport, tokens can route through major pairs like ETH/USDC to reach their destination. This creates a hub-and-spoke model where major tokens act as liquidity highways, dramatically reducing the infrastructure needed while maintaining global connectivity.

#### Reality in our DEX:

ETH/USDC: $10M liquidity (major highway)
USDC/DAI: $5M liquidity (stablecoin corridor)
ETH/WBTC: $3M liquidity (crypto blue chips)
SMALL/ETH: $50k liquidity (community token)

* **User wants**: DAI → SMALL (no direct pool exists)
* **Solution**: DAI → USDC → ETH → SMALL (three hops through liquid paths)

:::note Did You Know?
The constant product formula was first implemented by Uniswap V1 in 2018. Despite its simplicity, it remains the foundation for most DEXs today, processing billions in daily volume.
:::

### Understanding the Multihop Module
It ebales token swaps through intermediate pools when direct pairs don't exist or have insufficient liquidity. By chaining multiple swaps in a single atomic transaction, users can trade between any tokens in the ecosystem while maintaining security guarantees - if any swap in the chain fails, the entire transaction reverts, protecting users from partial execution risks

```rust
public entry fun swap_exact_input_multihop(
    user: &signer,
    xy_lp_metadata: Object<Metadata>,  // First pool (X→Y)
    yz_lp_metadata: Object<Metadata>,  // Second pool (Y→Z)
    x: Object<Metadata>,               // Starting token
    y: Object<Metadata>,               // Intermediate token
    z: Object<Metadata>,               // Final token
    amount_in: u64,                    // Input amount
    min_amount_out: u64                // Minimum final output
)
```

:::tip View Source
Complete multi-hop implementation: [`swap_exact_input_multihop`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/4-multihop.move#L12-L49)
:::

#### Execution Flow

1. **Calculate First Hop**: Determine Y tokens from X input
2. **Execute First Swap**: X → Y through first pool
3. **Calculate Second Hop**: Determine Z tokens from Y
4. **Validate Output**: Ensure final amount meets minimum
5. **Execute Second Swap**: Y → Z through second pool

Let's dive deep into Step-by-Step Breakdown

```rust
// Step 1: Get first pool reserves
let (reserve_x1, reserve_y1) = swap::reserves(xy_lp_metadata);

// Step 2: Calculate intermediate output
let amount_intermediate = math_amm::get_amount_out(
    amount_in, 
    reserve_x1, 
    reserve_y1
);

// Step 3: Execute first swap (X → Y)
swap::swap_exact_input(
    user, 
    xy_lp_metadata,
    x,
    y,
    amount_in,
    0  // No minimum for intermediate swap
);

// Step 4: Get second pool reserves
let (reserve_y2, reserve_z2) = swap::reserves(yz_lp_metadata);

// Step 5: Calculate final output
let amount_out = math_amm::get_amount_out(
    amount_intermediate, 
    reserve_y2, 
    reserve_z2
);

// Step 6: Validate against minimum
assert!(amount_out >= min_amount_out, ERROR_INSUFFICIENT_OUTPUT);

// Step 7: Execute second swap (Y → Z)
swap::swap_exact_input(
    user, 
    yz_lp_metadata,
    y,
    z,
    amount_intermediate,
    min_amount_out
);
```

#### Why Atomic Execution Matters?

All swaps execute in a single transaction:
- **No partial execution**: Either all succeed or all fail
- **No intermediate token risk**: User never holds Y tokens
- **MEV protection**: Can't be sandwiched between hops

---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Real-World Routing Strategies

<Tabs>
  <TabItem value="stable" label="Stablecoin Arbitrage" default>

This strategy exploits fee differences between pools. When stablecoin pools have different fee tiers, routing through lower-fee pools can save significant costs, especially for large trades. The 0.2% saved might seem small, but on a $1M trade, that's $2,000 in savings.

```rust
// Route through low-fee stable pools
fun efficient_stable_swap(user: &signer, amount_usdc: u64) {
    // USDC → USDT → DAI through 0.05% pools
    // Saves 0.2% vs direct 0.3% pool
    multihop::swap_exact_input_multihop(
        user,
        usdc_usdt_pool,  // 0.05% fee tier
        usdt_dai_pool,   // 0.05% fee tier
        usdc_metadata,
        usdt_metadata,
        dai_metadata,
        amount_usdc,
        (amount_usdc * 999) / 1000  // Expect 0.1% loss max
    );
}
```
</TabItem>
  <TabItem value="cross" label="Cross-Market Swap">
  Many tokens only have liquidity against ETH or USDC, creating isolated markets. This example shows how multi-hop routing breaks down these barriers, enabling any-to-any token swaps through bridge tokens.

```rust
// Access isolated markets through ETH bridge
fun swap_usdc_to_small_token(user: &signer, usdc_amount: u64) {
    // Calculate path: USDC → ETH → SMALL
    let (usdc_reserves, eth_reserves) = swap::reserves(usdc_eth_pool);
    let eth_amount = math_amm::get_amount_out(
        usdc_amount, usdc_reserves, eth_reserves
    );
    
    // Route through ETH to reach small cap token
    multihop::swap_exact_input_multihop(
        user,
        usdc_eth_pool,
        eth_small_pool,
        usdc_metadata,
        eth_metadata,
        small_metadata,
        usdc_amount,
        calculate_min_output(eth_amount, 200) // 2% slippage
    );
}
```
</TabItem>
</Tabs>

---

### When to Use Multi-hop

Use multi-hop when:
- No direct pool exists
- Direct pool has low liquidity
- Price improvement exceeds gas costs
- Arbitrage opportunity exists

Avoid multi-hop when:
- Direct pool has deep liquidity
- Small trade amounts (gas inefficient)
- Time-sensitive trades


Multi-hop routing transforms your DEX from isolated pools into an interconnected liquidity network.

Your DEX now supports efficient trading between any token pair!

## Next steps

You've mastered multi-hop routing:

- **Core Implementation**: Two-hop swaps with atomic execution
- **Advanced Strategies**: Split routing, dynamic path finding
- **Gas Optimization**: Batching, caching, optimistic execution
- **Real Integration**: Production-ready router examples

### [DEX Client Integration Guide](./client-integration)
Create a TypeScript/React frontend that interacts with your DEX smart contracts.