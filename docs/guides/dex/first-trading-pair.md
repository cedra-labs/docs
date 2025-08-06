# Building Your First Trading Pair on Cedra

In this tutorial, you'll build and deploy your first trading pair using Cedra's DEX infrastructure. We'll create a liquidity pool, add initial liquidity, and execute your first swap - all while understanding the mechanics behind each operation.

### What You'll Learn

- How to create a trading pair with LP tokens
- Understanding liquidity provision mechanics
- Executing token swaps with slippage protection
- Managing pool reserves and ratios

---

## What is a Trading Pair?

A trading pair isn't just a container for tokens - it's a sophisticated financial instrument that manages reserves, tracks ownership, and enables atomic operations. Each field in the `TradingPair` struct serves a critical purpose in maintaining the integrity and functionality of the liquidity pool.

```rust
struct TradingPair has key {
    reserve_x: Object<FungibleStore>,    // Token A reserves
    reserve_y: Object<FungibleStore>,    // Token B reserves
    mint_ref: fungible_asset::MintRef,   // For creating LP tokens
    burn_ref: fungible_asset::BurnRef,   // For burning LP tokens
    extend_ref: ExtendRef,               // For managing the pair
    reserve_x_ref: ExtendRef,            // For managing reserve X
    reserve_y_ref: ExtendRef             // For managing reserve Y
}
```

:::info Architecture Decision
The use of separate `ExtendRef` objects for each reserve might seem redundant, but it follows the principle of least privilege. Each reference grants specific permissions, making the contract's intentions explicit and auditable.
:::

The separation of reserves into distinct FungibleStore objects prevents any possibility of token mixing or confusion - a critical safety feature when handling user funds. The mint and burn references provide controlled access to LP token supply, ensuring that tokens can only be created when liquidity is added and destroyed when it's removed.

:::tip View Source
See the complete struct definition: [`TradingPair`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/2-swap.move#L20-L28)
:::

Each component serves a specific purpose:
- **Reserves**: Separate stores for each token prevent conflicts
- **Mint/Burn refs**: Control LP token supply
- **Extend refs**: Enable programmatic management of reserves

---

### Step 1: Creating a Trading Pair


```rust
public fun create_pair(
    lp_creator: &signer, 
    x_metadata: Object<Metadata>, 
    y_metadata: Object<Metadata>
): Object<Metadata>
```

This function:
1. Creates a new object for the trading pair
2. Initializes LP token with metadata
3. Sets up separate reserve stores
4. Returns LP token metadata for future operations

:::tip View Source
Complete implementation: [`create_pair`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/2-swap.move#L31-L71)
:::

You can see real example below:

```rust
{
    use simple_dex::swap;
    use std::signer;
    
    fun create_eth_usdc_pair(admin: &signer) {
        // Assume ETH and USDC metadata objects exist
        let eth_metadata = @0x123::tokens::eth_metadata();
        let usdc_metadata = @0x456::tokens::usdc_metadata();
        
        // Create the trading pair
        let lp_metadata = swap::create_pair(
            admin,
            eth_metadata,
            usdc_metadata
        );
        
        // Store LP metadata for future use
        // In production, emit an event or store in registry
    }
}
```
---

### Step 2: Adding Liquidity

When adding liquidity, you must maintain the current pool ratio to ensure fair pricing. The `add_liquidity` function handles this automatically.

```rust
public entry fun add_liquidity(
    user: &signer,
    lp_metadata: Object<Metadata>,
    x_metadata: Object<Metadata>,
    y_metadata: Object<Metadata>,
    amount_x_desired: u64,
    amount_y_desired: u64,
    amount_x_min: u64,
    amount_y_min: u64
)
```

Parameters explained:
- **amount_x_desired, amount_y_desired**: Maximum amounts you're willing to provide
- **amount_x_min, amount_y_min**: Minimum amounts to protect against slippage


For the first liquidity provider:
```rust
if (reserve_x == 0 && reserve_y == 0) {
    // Use exact amounts provided
    (amount_x_desired, amount_y_desired)
    
    // LP tokens minted = sqrt(amount_x * amount_y)
    let lp_amount = std::math64::sqrt(amount_x * amount_y);
}
```

---

### Step 3: Executing Swaps

To execute swap you should:
1. Validates input amount is non-zero
2. Calculates output using AMM formula
3. Checks output meets minimum requirement

```rust
public entry fun swap_exact_input(
    user: &signer,
    lp_metadata: Object<Metadata>,
    x_metadata: Object<Metadata>,
    _y_metadata: Object<Metadata>,
    amount_in: u64,
    min_amount_out: u64
)
```

:::tip View Source
See the swap implementation: [`swap_exact_input`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/2-swap.move#L74-L103)
:::

---

### Step 4: Monitoring Pool State

The swap module provides several view functions for monitoring that we can use:

```rust
// Get current reserves
let (reserve_x, reserve_y) = swap::reserves(lp_metadata);

// Check if pair exists
let exists = swap::pair_exists(lp_metadata);

// Get comprehensive pair info
let (exists, reserve_x, reserve_y) = swap::get_pair_info(lp_metadata);
```

:::tip Complete Swap Module
Explore the full trading pair implementation: [`swap.move`](https://github.com/cedra-labs/move-contract-examples/blob/main/dex/sources/2-swap.move)
:::

## Summary

You've learned how to:
- Create a trading pair with LP token generation
- Add liquidity while maintaining pool ratios
- Execute swaps with slippage protection
- Monitor and interact with pool state

Your trading pair is now ready for use!

## Next Steps

You've learned how AMMs use the x*y=k formula to enable decentralized trading. Key takeaways:

- Constant product formula maintains market equilibrium
- Trading fees compensate liquidity providers
- Price impact increases with trade size
- LP tokens represent proportional pool ownership

### [Adding Price Protection Mechanisms](./price-protection)
Implement slippage protection, minimum output amounts, and deadline checks to protect users.

### [Multi-hop Routing for Optimal Execution](./multi-hop-routing)
Build a router that finds the best path through multiple pools for optimal trade execution.

### [DEX Client Integration Guide](./client-integration)
Create a TypeScript/React frontend that interacts with your DEX smart contracts.