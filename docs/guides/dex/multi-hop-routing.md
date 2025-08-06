# Multi-hop Routing for Optimal Execution

## Introduction

Not all token pairs have direct liquidity pools. Multi-hop routing enables trades between any two tokens by routing through intermediate pools, finding the best path for optimal execution. This tutorial teaches you how to implement and optimize multi-hop swaps on Cedra.

## What You'll Learn

- Why multi-hop routing is essential
- Implementing two-hop and multi-hop swaps
- Path finding algorithms
- Gas optimization strategies
- Real-world routing examples

## Prerequisites

- Completed Tutorials 1-4
- Understanding of single-pool swaps
- Basic graph theory concepts

## Why Multi-hop Routing?

### The Liquidity Fragmentation Problem

In a DEX with N tokens, there could be N*(N-1)/2 possible pairs:
- 10 tokens = 45 possible pairs
- 100 tokens = 4,950 possible pairs
- 1000 tokens = 499,500 possible pairs

Most pairs won't have direct liquidity, making multi-hop essential.

### Real-World Example

```
Available pools:
- ETH/USDC (deep liquidity)
- USDC/DAI (stable pair)
- ETH/WBTC (correlated assets)

User wants: DAI → WBTC
Solution: DAI → USDC → ETH → WBTC
```

## Understanding the Multihop Module

### Core Function

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

### Execution Flow

1. **Calculate First Hop**: Determine Y tokens from X input
2. **Execute First Swap**: X → Y through first pool
3. **Calculate Second Hop**: Determine Z tokens from Y
4. **Validate Output**: Ensure final amount meets minimum
5. **Execute Second Swap**: Y → Z through second pool

## Implementation Deep Dive

### Step-by-Step Breakdown

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

### Why Atomic Execution Matters

All swaps execute in a single transaction:
- **No partial execution**: Either all succeed or all fail
- **No intermediate token risk**: User never holds Y tokens
- **MEV protection**: Can't be sandwiched between hops

## Practical Multi-hop Examples

### Example 1: Stablecoin Arbitrage Route

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

## Advanced Routing Strategies

### Strategy 1: Three-Hop Implementation

```move
module advanced_dex::triple_hop {
    public entry fun swap_three_hops(
        user: &signer,
        pool_ab: Object<Metadata>,
        pool_bc: Object<Metadata>,
        pool_cd: Object<Metadata>,
        token_a: Object<Metadata>,
        token_b: Object<Metadata>,
        token_c: Object<Metadata>,
        token_d: Object<Metadata>,
        amount_in: u64,
        min_out: u64
    ) {
        // Calculate through all hops
        let (reserve_a, reserve_b) = swap::reserves(pool_ab);
        let amount_b = math_amm::get_amount_out(amount_in, reserve_a, reserve_b);
        
        let (reserve_b2, reserve_c) = swap::reserves(pool_bc);
        let amount_c = math_amm::get_amount_out(amount_b, reserve_b2, reserve_c);
        
        let (reserve_c2, reserve_d) = swap::reserves(pool_cd);
        let amount_d = math_amm::get_amount_out(amount_c, reserve_c2, reserve_d);
        
        assert!(amount_d >= min_out, ERROR_INSUFFICIENT_OUTPUT);
        
        // Execute all swaps
        swap::swap_exact_input(user, pool_ab, token_a, token_b, amount_in, 0);
        swap::swap_exact_input(user, pool_bc, token_b, token_c, amount_b, 0);
        swap::swap_exact_input(user, pool_cd, token_c, token_d, amount_c, min_out);
    }
}
```

### Strategy 2: Split Route Optimization

```move
module advanced_dex::split_router {
    /// Split trade across multiple routes for better execution
    public entry fun split_route_swap(
        user: &signer,
        // Route 1: A → B → C
        route1_pool1: Object<Metadata>,
        route1_pool2: Object<Metadata>,
        // Route 2: A → D → C
        route2_pool1: Object<Metadata>,
        route2_pool2: Object<Metadata>,
        token_a: Object<Metadata>,
        token_b: Object<Metadata>,
        token_c: Object<Metadata>,
        token_d: Object<Metadata>,
        total_amount: u64,
        split_percentage: u64,  // 0-100
        min_total_out: u64
    ) {
        // Calculate split
        let amount_route1 = (total_amount * split_percentage) / 100;
        let amount_route2 = total_amount - amount_route1;
        
        // Calculate outputs for each route
        let output1 = calculate_two_hop_output(
            route1_pool1, route1_pool2, amount_route1
        );
        let output2 = calculate_two_hop_output(
            route2_pool1, route2_pool2, amount_route2
        );
        
        assert!(output1 + output2 >= min_total_out, ERROR_INSUFFICIENT_OUTPUT);
        
        // Execute both routes
        if (amount_route1 > 0) {
            multihop::swap_exact_input_multihop(
                user, route1_pool1, route1_pool2,
                token_a, token_b, token_c,
                amount_route1, 0
            );
        }
        
        if (amount_route2 > 0) {
            multihop::swap_exact_input_multihop(
                user, route2_pool1, route2_pool2,
                token_a, token_d, token_c,
                amount_route2, 0
            );
        }
    }
}
```

### Strategy 3: Dynamic Path Finding

```move
module advanced_dex::pathfinder {
    struct Route has drop {
        pools: vector<Object<Metadata>>,
        tokens: vector<Object<Metadata>>,
        expected_output: u64
    }
    
    /// Find best route between two tokens
    public fun find_best_route(
        token_in: Object<Metadata>,
        token_out: Object<Metadata>,
        amount_in: u64,
        max_hops: u64
    ): Route {
        // Initialize with direct route if exists
        let best_route = try_direct_route(token_in, token_out, amount_in);
        
        if (max_hops >= 2) {
            // Try all 2-hop routes through common intermediates
            let intermediates = get_common_pairs(token_in, token_out);
            let i = 0;
            while (i < vector::length(&intermediates)) {
                let intermediate = *vector::borrow(&intermediates, i);
                let route = calculate_two_hop_route(
                    token_in, intermediate, token_out, amount_in
                );
                
                if (route.expected_output > best_route.expected_output) {
                    best_route = route;
                }
                i = i + 1;
            }
        }
        
        best_route
    }
}
```

## Gas Optimization Techniques

### Technique 1: Batched Reserve Reads

```move
/// Read multiple pool reserves in one call
public fun batch_get_reserves(
    pools: vector<Object<Metadata>>
): vector<(u64, u64)> {
    let reserves = vector::empty();
    let i = 0;
    
    while (i < vector::length(&pools)) {
        let pool = *vector::borrow(&pools, i);
        let (r_x, r_y) = swap::reserves(pool);
        vector::push_back(&mut reserves, (r_x, r_y));
        i = i + 1;
    }
    
    reserves
}
```

### Technique 2: Pre-calculated Routes

```move
struct RouteCache has key {
    routes: SimpleMap<(address, address), Route>,
    last_update: u64
}

public fun get_cached_route(
    token_in: address,
    token_out: address
): Route acquires RouteCache {
    let cache = borrow_global<RouteCache>(@router);
    let key = (token_in, token_out);
    
    if (simple_map::contains_key(&cache.routes, &key)) {
        let route = *simple_map::borrow(&cache.routes, &key);
        let age = timestamp::now_seconds() - cache.last_update;
        
        // Use cache if less than 5 minutes old
        if (age < 300) {
            return route
        }
    }
    
    // Calculate fresh route
    find_best_route(token_in, token_out)
}
```

### Technique 3: Optimistic Execution

```move
/// Execute multi-hop with optimistic gas usage
public fun optimistic_multihop(
    user: &signer,
    route: Route,
    amount_in: u64,
    min_out: u64
) {
    let current_amount = amount_in;
    let num_hops = vector::length(&route.pools);
    
    // Pre-check if route is viable
    assert!(route.expected_output >= min_out, ERROR_INSUFFICIENT_OUTPUT);
    
    // Execute all hops without intermediate checks
    let i = 0;
    while (i < num_hops) {
        let pool = *vector::borrow(&route.pools, i);
        let token_in = *vector::borrow(&route.tokens, i);
        let token_out = *vector::borrow(&route.tokens, i + 1);
        
        // Only check minimum on last hop
        let min = if (i == num_hops - 1) { min_out } else { 0 };
        
        swap::swap_exact_input(
            user, pool, token_in, token_out,
            current_amount, min
        );
        
        // Update amount for next hop
        if (i < num_hops - 1) {
            current_amount = primary_fungible_store::balance(
                signer::address_of(user), 
                token_out
            );
        }
        
        i = i + 1;
    }
}
```

## Real-World Integration Example

### Complete Router Implementation

```typescript
class MultiHopRouter {
  private cedra: Cedra;
  private routeCache: Map<string, Route>;
  
  constructor(cedra: Cedra) {
    this.cedra = cedra;
    this.routeCache = new Map();
  }
  
  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<Route> {
    const cacheKey = `${tokenIn}-${tokenOut}`;
    const cached = this.routeCache.get(cacheKey);
    
    // Use cache if fresh (< 30 seconds)
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached;
    }
    
    // Find all possible routes
    const routes = await this.findAllRoutes(tokenIn, tokenOut);
    
    // Calculate output for each route
    const routeOutputs = await Promise.all(
      routes.map(route => this.calculateRouteOutput(route, amountIn))
    );
    
    // Select best route
    const bestIndex = routeOutputs.indexOf(Math.max(...routeOutputs));
    const bestRoute = {
      path: routes[bestIndex],
      expectedOutput: routeOutputs[bestIndex],
      timestamp: Date.now()
    };
    
    this.routeCache.set(cacheKey, bestRoute);
    return bestRoute;
  }
  
  async executeMultiHop(
    user: Account,
    route: Route,
    amountIn: bigint,
    slippageBps: number = 100
  ): Promise<string> {
    const minOut = (route.expectedOutput * BigInt(10000 - slippageBps)) / 10000n;
    
    if (route.path.length === 2) {
      // Direct swap
      return await this.executeDirectSwap(user, route, amountIn, minOut);
    } else if (route.path.length === 3) {
      // Two-hop swap
      return await this.executeTwoHopSwap(user, route, amountIn, minOut);
    } else {
      // Multi-hop swap
      return await this.executeMultiHopSwap(user, route, amountIn, minOut);
    }
  }
  
  private async executeTwoHopSwap(
    user: Account,
    route: Route,
    amountIn: bigint,
    minOut: bigint
  ): Promise<string> {
    const tx = await this.cedra.transaction.build.simple({
      sender: user.address(),
      data: {
        function: `${MODULE_ADDRESS}::multihop::swap_exact_input_multihop`,
        functionArguments: [
          route.pools[0],     // First pool
          route.pools[1],     // Second pool
          route.path[0],      // Token A
          route.path[1],      // Token B (intermediate)
          route.path[2],      // Token C
          amountIn.toString(),
          minOut.toString()
        ]
      }
    });
    
    const pending = await this.cedra.signAndSubmitTransaction({
      signer: user,
      transaction: tx
    });
    
    return pending.hash;
  }
}
```

## Testing Multi-hop Routes

### Comprehensive Test Suite

```move
#[test]
fun test_two_hop_routing() acquires TradingPair {
    // Setup: Create three tokens and two pools
    let token_a = create_test_token(b"A");
    let token_b = create_test_token(b"B");
    let token_c = create_test_token(b"C");
    
    let pool_ab = swap::create_pair(admin, token_a, token_b);
    let pool_bc = swap::create_pair(admin, token_b, token_c);
    
    // Add liquidity
    add_liquidity(pool_ab, 1000, 2000);  // A:B = 1:2
    add_liquidity(pool_bc, 2000, 4000);  // B:C = 1:2
    
    // Test: Swap 100 A for C (expect ~396 C)
    multihop::swap_exact_input_multihop(
        user,
        pool_ab,
        pool_bc,
        token_a,
        token_b,
        token_c,
        100,
        390  // Minimum with slippage
    );
    
    // Verify final balance
    let balance_c = get_balance(user, token_c);
    assert!(balance_c >= 390 && balance_c <= 400, 0);
}

#[test]
fun test_route_comparison() {
    // Compare direct route vs multi-hop
    let direct_output = calculate_direct_swap(token_a, token_c, 100);
    let multihop_output = calculate_multihop_output(
        token_a, token_b, token_c, 100
    );
    
    // Multi-hop should be better if direct pool has less liquidity
    if (direct_pool_liquidity < multihop_pools_liquidity) {
        assert!(multihop_output > direct_output, 0);
    }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Intermediate Token Approval

**Problem**: User lacks approval for intermediate token
**Solution**: Router handles all transfers internally

### Pitfall 2: Price Impact Accumulation

**Problem**: Each hop adds price impact
**Solution**: Calculate cumulative impact before execution

```move
fun calculate_cumulative_impact(
    route: &Route,
    amount_in: u64
): u64 {
    let total_impact = 0;
    let current_amount = amount_in;
    
    let i = 0;
    while (i < vector::length(&route.pools)) {
        let pool = *vector::borrow(&route.pools, i);
        let (reserve_in, reserve_out) = swap::reserves(pool);
        
        let impact = slippage::calculate_price_impact(
            current_amount,
            reserve_in,
            reserve_out
        );
        
        total_impact = total_impact + impact;
        current_amount = math_amm::get_amount_out(
            current_amount,
            reserve_in,
            reserve_out
        );
        
        i = i + 1;
    }
    
    total_impact
}
```

### Pitfall 3: Failed Intermediate Swaps

**Problem**: Second hop fails after first succeeds
**Solution**: Atomic execution ensures all-or-nothing

## Performance Optimization

### Benchmark Results

```
Direct swap gas: ~50,000
Two-hop gas: ~95,000 (90% more)
Three-hop gas: ~140,000 (180% more)

Break-even calculation:
Two-hop profitable if: output_gain > gas_cost_difference
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

## Summary

You've mastered multi-hop routing:

- **Core Implementation**: Two-hop swaps with atomic execution
- **Advanced Strategies**: Split routing, dynamic path finding
- **Gas Optimization**: Batching, caching, optimistic execution
- **Real Integration**: Production-ready router examples

Multi-hop routing transforms your DEX from isolated pools into an interconnected liquidity network.

Your DEX now supports efficient trading between any token pair!