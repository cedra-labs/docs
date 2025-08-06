# Building Your First Trading Pair on Cedra

In this tutorial, you'll build and deploy your first trading pair using Cedra's DEX infrastructure. We'll create a liquidity pool, add initial liquidity, and execute your first swap - all while understanding the mechanics behind each operation.

### What You'll Learn

- How to create a trading pair with LP tokens
- Understanding liquidity provision mechanics
- Executing token swaps with slippage protection
- Managing pool reserves and ratios

---

## What is a Trading Pair?

A trading pair is a smart contract that:
- Holds reserves of two tokens (e.g., ETH/USDC)
- Enables swapping between these tokens
- Issues LP tokens to liquidity providers
- Maintains the constant product formula (x*y=k)

```move
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

Each component serves a specific purpose:
- **Reserves**: Separate stores for each token prevent conflicts
- **Mint/Burn refs**: Control LP token supply
- **Extend refs**: Enable programmatic management of reserves

#### Step 1: Creating a Trading Pair


```move
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

#### Practical Example

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

## Step 2: Adding Liquidity

When adding liquidity, you must maintain the current pool ratio to ensure fair pricing. The `add_liquidity` function handles this automatically.

### The add_liquidity Function

```move
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

### Initial Liquidity Logic

For the first liquidity provider:
```move
if (reserve_x == 0 && reserve_y == 0) {
    // Use exact amounts provided
    (amount_x_desired, amount_y_desired)
    
    // LP tokens minted = sqrt(amount_x * amount_y)
    let lp_amount = std::math64::sqrt(amount_x * amount_y);
}
```

## Step 3: Executing Swaps

```move
public entry fun swap_exact_input(
    user: &signer,
    lp_metadata: Object<Metadata>,
    x_metadata: Object<Metadata>,
    _y_metadata: Object<Metadata>,
    amount_in: u64,
    min_amount_out: u64
)
```

This function:
1. Validates input amount is non-zero
2. Calculates output using AMM formula
3. Checks output meets minimum requirement
4. Executes the swap atomically

## Step 4: Monitoring Pool State

The swap module provides several view functions for monitoring that we can use:

```move
// Get current reserves
let (reserve_x, reserve_y) = swap::reserves(lp_metadata);

// Check if pair exists
let exists = swap::pair_exists(lp_metadata);

// Get comprehensive pair info
let (exists, reserve_x, reserve_y) = swap::get_pair_info(lp_metadata);
```

### Calculating Pool Metrics

```move
// Calculate current price
let price_x_in_y = (reserve_y * 1_000_000) / reserve_x; // 6 decimal precision

// Calculate pool TVL (Total Value Locked)
let tvl_in_y = reserve_y * 2; // Assuming equal value

// Calculate your LP share
let lp_balance = primary_fungible_store::balance(user_addr, lp_metadata);
let total_supply = fungible_asset::supply(lp_metadata);
let share_percentage = (lp_balance * 100) / total_supply;
```

## Common Integration Patterns

### Pattern 1: Safe Swap with Price Check

```move
fun safe_swap_with_price_check(
    user: &signer,
    lp_metadata: Object<Metadata>,
    amount_in: u64,
    max_price_impact_bps: u64 // basis points (100 = 1%)
) {
    // Get current reserves
    let (reserve_in, reserve_out) = swap::reserves(lp_metadata);
    
    // Calculate expected output
    let expected_out = math_amm::get_amount_out(amount_in, reserve_in, reserve_out);
    
    // Calculate price impact
    let spot_price = (reserve_out * 1_000_000) / reserve_in;
    let execution_price = (amount_in * 1_000_000) / expected_out;
    let price_impact = ((execution_price - spot_price) * 10_000) / spot_price;
    
    // Verify price impact is acceptable
    assert!(price_impact <= max_price_impact_bps, ERROR_PRICE_IMPACT_TOO_HIGH);
    
    // Execute swap with 0.5% slippage tolerance
    let min_out = (expected_out * 995) / 1000;
    swap::swap_exact_input(
        user,
        lp_metadata,
        input_metadata,
        output_metadata,
        amount_in,
        min_out
    );
}
```

### Pattern 2: Zap Function (Single-Sided Liquidity)

```move
fun zap_single_token_to_lp(
    user: &signer,
    lp_metadata: Object<Metadata>,
    token_metadata: Object<Metadata>,
    amount: u64
) {
    // Split input amount
    let swap_amount = amount / 2;
    let add_amount = amount - swap_amount;
    
    // Swap half to the other token
    swap::swap_exact_input(
        user,
        lp_metadata,
        token_metadata,
        other_token_metadata,
        swap_amount,
        0 // Calculate min_out based on current price
    );
    
    // Add liquidity with both tokens
    swap::add_liquidity(
        user,
        lp_metadata,
        token_metadata,
        other_token_metadata,
        add_amount,
        swapped_amount,
        0,
        0
    );
}
```

## Testing Your Trading Pair

### Unit Test Example

```move
#[test(admin = @0x123, user = @0x456)]
fun test_complete_flow(admin: &signer, user: &signer) acquires TradingPair {
    // Setup
    let eth = create_test_token(admin, b"ETH", 8);
    let usdc = create_test_token(admin, b"USDC", 6);
    
    // Create pair
    let lp = swap::create_pair(admin, eth, usdc);
    
    // Add initial liquidity
    mint_tokens(admin, eth, 100_000_000); // 100 ETH
    mint_tokens(admin, usdc, 200_000_000_000); // 200,000 USDC
    
    swap::add_liquidity(
        admin, lp, eth, usdc,
        100_000_000, 200_000_000_000,
        0, 0
    );
    
    // Verify reserves
    let (r_x, r_y) = swap::reserves(lp);
    assert!(r_x == 100_000_000, 0);
    assert!(r_y == 200_000_000_000, 1);
    
    // Test swap
    mint_tokens(user, eth, 1_000_000); // 1 ETH
    swap::swap_exact_input(
        user, lp, eth, usdc,
        1_000_000, 1_900_000_000 // Expect ~1,977 USDC
    );
    
    // Verify user received USDC
    let user_usdc = primary_fungible_store::balance(signer::address_of(user), usdc);
    assert!(user_usdc > 1_900_000_000, 2);
}
```

## Troubleshooting Guide

### Error: "Pair already exists"
- Each token pair can only have one pool
- Check if pair already exists using `pair_exists()` view function

### Error: "Insufficient output"
- Slippage tolerance too tight
- Pool reserves changed between calculation and execution
- Solution: Increase `min_amount_out` parameter

### Error: "Zero amount"
- Ensure input amounts are greater than 0
- Check token decimals match expected values

### Gas Optimization Tips

1. **Batch Operations**: Combine multiple operations in single transaction
2. **Use View Functions**: Check state before executing transactions
3. **Optimal Amounts**: Use quote function to avoid failed transactions

## Security Considerations

### 1. Reentrancy Protection
Move's resource model prevents reentrancy by design:
```move
// Resources can only be moved once
let asset_in = primary_fungible_store::withdraw(user, x_metadata, amount_in);
fungible_asset::deposit(pair.reserve_x, asset_in);
```

### 2. Integer Overflow Protection
All arithmetic operations are checked:
```move
// Safe multiplication with automatic overflow checks
let lp_supply = ((amount_x as u128) * total_supply / (reserve_x as u128) as u64);
```

### 3. Access Control
Only authorized signers can modify reserves:
```move
// Only pair contract can withdraw from reserves
let fa = fungible_asset::withdraw(
    &object::generate_signer_for_extending(&pair.reserve_y_ref),
    pair.reserve_y,
    amount_out
);
```

## Summary

You've learned how to:
- Create a trading pair with LP token generation
- Add liquidity while maintaining pool ratios
- Execute swaps with slippage protection
- Monitor and interact with pool state
- Implement common integration patterns

Your trading pair is now ready for production use!