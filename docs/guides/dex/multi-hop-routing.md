# Multi-hop Routing for Optimal Execution

Not all token pairs have direct liquidity pools. Multi-hop routing enables trades between any two tokens by routing through intermediate pools, finding the best path for optimal execution. This tutorial teaches you how to implement and optimize multi-hop swaps on Cedra.

#### What You'll Learn:
- Why multi-hop routing is essential
- Implementing two-hop and multi-hop swaps
- Path finding algorithms
- Gas optimization strategies
- Real-world routing examples

---

## Why Multi-hop Routing?

In a DEX with N tokens, there could be N*(N-1)/2 possible pairs:
- 10 tokens = 45 possible pairs
- 100 tokens = 4,950 possible pairs
- 1000 tokens = 499,500 possible pairs

Most pairs won't have direct liquidity, making multi-hop essential.
```
Available pools:
- ETH/USDC (deep liquidity)
- USDC/DAI (stable pair)
- ETH/WBTC (correlated assets)
```

User wants: DAI → WBTC
Solution: DAI → USDC → ETH → WBTC

### Understanding the Multihop Module
It ebales token swaps through intermediate pools when direct pairs don't exist or have insufficient liquidity. By chaining multiple swaps in a single atomic transaction, users can trade between any tokens in the ecosystem while maintaining security guarantees - if any swap in the chain fails, the entire transaction reverts, protecting users from partial execution risks

```move
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

```move
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

### Example 1: Stablecoin Arbitrage Route
Example below demonstrates how multi-hop routing can reduce trading costs by finding more efficient paths. When swapping between stablecoins, routing through intermediate pairs with lower fees often results in better execution than direct swaps. Here we save 0.2% in fees by using two 0.05% fee pools instead of one 0.3% fee pool - a significant saving for large trades.

```move
// Pools: USDC/USDT (0.05% fee), USDT/DAI (0.05% fee)
// More efficient than direct USDC/DAI (0.3% fee)

fun efficient_stable_swap(
    user: &signer,
    amount_usdc: u64
) {
    // Route: USDC → USDT → DAI
    // Total fees: 0.1% vs 0.3% direct
    
    multihop::swap_exact_input_multihop(
        user,
        usdc_usdt_pool,
        usdt_dai_pool,
        usdc_metadata,
        usdt_metadata,
        dai_metadata,
        amount_usdc,
        (amount_usdc * 999) / 1000  // Expect 0.1% loss max
    );
}
```

### Example 2: Cross-Market Token Swap

Many smaller or newer tokens only have liquidity against major pairs like ETH or USDC. This example shows how to access these isolated markets through multi-hop routing. By using ETH as a bridge token, users can swap between USDC and any small-cap token even without a direct USDC/SMALL pool, dramatically expanding the accessible token ecosystem.

```move
// Scenario: Small cap token only paired with ETH
// User wants to swap USDC for SMALL token

fun swap_usdc_to_small_token(
    user: &signer,
    usdc_amount: u64
) {
    // Route: USDC → ETH → SMALL
    
    // First, calculate expected ETH from USDC
    let (usdc_reserves, eth_reserves) = swap::reserves(usdc_eth_pool);
    let eth_amount = math_amm::get_amount_out(
        usdc_amount,
        usdc_reserves,
        eth_reserves
    );
    
    // Then, calculate expected SMALL from ETH
    let (eth_reserves2, small_reserves) = swap::reserves(eth_small_pool);
    let small_amount = math_amm::get_amount_out(
        eth_amount,
        eth_reserves2,
        small_reserves
    );
    
    // Apply 2% slippage for safety
    let min_small = (small_amount * 98) / 100;
    
    multihop::swap_exact_input_multihop(
        user,
        usdc_eth_pool,
        eth_small_pool,
        usdc_metadata,
        eth_metadata,
        small_metadata,
        usdc_amount,
        min_small
    );
}
```

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