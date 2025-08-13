---
title: Functions in Move - Declaration and Usage
description: Master Move functions - from basic declarations to advanced patterns. Learn about parameters, return values, generics, and how to design robust blockchain APIs.
keywords: [move functions, function parameters, return values, generics, move programming, blockchain functions]
---

# Functions in Move: Declaration and Usage

Functions are where Move code comes to life. They define the actions your modules can perform, from simple calculations to complex asset transfers. Let's explore how to write functions that are safe, efficient, and easy to use.

## Function Basics

Every function in Move follows a consistent structure:

```rust
fun function_name(parameter1: Type1, parameter2: Type2): ReturnType {
    // Function body
}
```

But Move functions have unique characteristics driven by blockchain requirements. Unlike traditional programming, Move functions must be deterministic – given the same inputs, they always produce the same outputs. No random numbers from system time, no network calls, no file I/O.

Here's a simple function that demonstrates Move's clarity:

```rust
public fun calculate_fee(amount: u64, fee_percentage: u8): u64 {
    (amount * (fee_percentage as u64)) / 100
}
```

This function is public (callable from other modules), takes two parameters, and returns a fee amount.

## Parameters: How Data Flows In

Move is strict about how data enters functions. Understanding parameter passing is crucial because it directly relates to Move's ownership model.

### Passing by Value

When you pass a value directly, Move transfers ownership:

```rust
fun consume_token(token: Token) {
    // Function now owns token
    let Token { amount } = token; // Destructure and destroy
    emit_burn_event(amount);
}
```

Once `token` is passed to `consume_token`, the caller no longer has access to it. This is Move's linear type system in action – ensuring resources can't be duplicated. Use this pattern when:
- The function needs to destroy or store the resource
- You're transferring ownership permanently
- The resource won't be needed by the caller afterward

### Immutable References (&)

References let you read data without taking ownership:

```rust
public fun check_balance(account: &Account): u64 {
    account.balance
}

public fun validate_transfer(from: &Account, to: &Account, amount: u64): bool {
    from.balance >= amount && to.status == ACTIVE
}
```

Immutable references are perfect for:
- Reading data without modifying it
- Checking conditions or validating state
- Passing large structs efficiently (no copying)

The `&` symbol creates a reference. Multiple functions can hold immutable references to the same data simultaneously – Move's borrow checker ensures safety.

### Mutable References (&mut)

Mutable references allow modification:

```rust
public fun deposit(account: &mut Account, amount: u64) {
    account.balance = account.balance + amount;
    account.last_updated = timestamp::now_seconds();
}
```

Key rules for mutable references:
- Only one mutable reference can exist at a time
- Cannot coexist with immutable references
- Changes affect the original data

This exclusivity prevents data races and ensures consistency – critical for financial operations.

### The Signer Type

The `signer` type is special – it represents transaction authority:

```rust
public entry fun withdraw(user: &signer, amount: u64) {
    let user_address = signer::address_of(user);
    let account = borrow_global_mut<Account>(user_address);
    
    assert!(account.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
    account.balance = account.balance - amount;
}
```

You can only get a `signer` for the account that initiated the transaction. This prevents impersonation – you can't create a signer for someone else's address. Functions typically use `&signer` (reference) rather than `signer` (value) because the signer doesn't need to be consumed.

## Return Values: Getting Data Out

Move functions can return zero, one, or multiple values. This flexibility enables clean APIs without wrapper types.

### Single Returns

Most functions return a single value:

```rust
public fun calculate_interest(principal: u64, rate: u8, days: u64): u64 {
    (principal * (rate as u64) * days) / 36500
}
```

### Multiple Returns

Move shines with multiple return values:

```rust
public fun swap_exact_input(
    input: Token<X>,
    min_output: u64
): (Token<Y>, u64) {
    let output_amount = calculate_output_amount(token::value(&input));
    assert!(output_amount >= min_output, ERROR_SLIPPAGE);
    
    let output = withdraw_from_pool<Y>(output_amount);
    deposit_to_pool(input);
    
    (output, output_amount)
}
```

This function returns both the output tokens and the amount – no need for a wrapper struct. Callers can destructure the result:

```rust
let (tokens, amount) = swap_exact_input(my_tokens, 1000);
```

### No Return Value

Functions that only cause side effects return nothing:

```rust
public entry fun register_user(user: &signer, username: vector<u8>) {
    let user_addr = signer::address_of(user);
    assert!(!exists<UserProfile>(user_addr), ERROR_ALREADY_REGISTERED);
    
    move_to(user, UserProfile {
        username,
        reputation: 0,
        joined_at: timestamp::now_seconds(),
    });
}
```

:::info Entry Functions
Functions marked `entry` are special – they can be called directly from transactions but cannot return values. They're your module's user interface.

**See Entry Functions in Action:**
- [NFT Minting](/guides/first-nft#3-creatorgated-mint) - The `mint_nft` entry function
- [FA Transfer](/guides/first-fa#213-transfer---peertopeer-move) - The `transfer` entry function  
- [Escrow Operations](/guides/escrow#step-2-locking-funds-into-escrow) - Multiple entry functions for locking and releasing funds
:::

## Generic Functions: Write Once, Use Many

Generics let you write functions that work with multiple types. This is powerful for building reusable components.

### Basic Generics

Here's a generic function that works with any token type:

```rust
public fun transfer<TokenType>(
    from: &signer,
    to: address,
    amount: u64
) {
    let coins = coin::withdraw<TokenType>(from, amount);
    coin::deposit(to, coins);
}
```

The `<TokenType>` declares a type parameter. When calling this function, Move infers or requires the type:

:::tip Real-World Generic Usage
Our [Fungible Asset Guide](/guides/first-fa) uses generics extensively. The entire FA framework is built on generic types like `FungibleStore<T>` and functions like `mint<T>` that work with any token type.
:::

```rust
// Move infers USDC from the context
transfer<USDC>(from, recipient, 1000);

// Or explicitly specify
transfer<0x1::cedra_coin::CedraCoin>(from, recipient, 1000);
```

### Type Constraints

You can constrain generic types with abilities:

```rust
public fun store_in_vault<T: store>(item: T) {
    // T must have the 'store' ability
    move_to(vault_address, VaultItem { contents: item });
}

public fun create_pair<T: copy + drop>(first: T, second: T): Pair<T> {
    // T must have both 'copy' and 'drop'
    Pair { first, second }
}
```

These constraints ensure type safety. The compiler verifies that only appropriate types are used.

### Phantom Types

Phantom types exist only at compile time for type safety:

```rust
struct Balance<phantom TokenType> has key {
    amount: u64
}

public fun get_balance<TokenType>(addr: address): u64 acquires Balance {
    borrow_global<Balance<TokenType>>(addr).amount
}
```

The `phantom` keyword indicates that `TokenType` isn't stored in the struct – it's just used for type checking. This creates type-safe interfaces without runtime overhead.

## Function Modifiers and Annotations

Move provides several modifiers that change function behavior or provide information to the compiler.

### The `acquires` Annotation

When a function accesses global storage, it must declare what it acquires:

```rust
public fun get_user_tokens(user: address): u64 acquires TokenVault {
    let vault = borrow_global<TokenVault>(user);
    vault.balance
}

public fun transfer_from_vault(
    user: address,
    recipient: address,
    amount: u64
) acquires TokenVault {
    let vault = borrow_global_mut<TokenVault>(user);
    assert!(vault.balance >= amount, ERROR_INSUFFICIENT_BALANCE);
    
    vault.balance = vault.balance - amount;
    // Transfer logic
}
```

The `acquires` annotation serves two purposes:
1. Documents what resources the function touches
2. Prevents reentrancy by tracking resource access

If you forget `acquires`, the compiler catches it – another safety net.

### View Functions

Functions marked `#[view]` are read-only queries:

:::success View Functions in Practice
Check out these view functions in our guides:
- [Escrow Status Checks](/guides/escrow#step-4-checking-status) - Multiple view functions for checking locked funds
- [Fee Splitter Info](/guides/fee-splitter#36-read-only-helpers) - Query recipient shares and existence
- [NFT Collection Data](/guides/first-nft#6-readonly-helpers) - Read collection metadata without gas costs
:::

```rust
#[view]
public fun get_price(token_a: address, token_b: address): u64 acquires PriceOracle {
    let oracle = borrow_global<PriceOracle>(@oracle_address);
    *table::borrow(&oracle.prices, &PricePair { token_a, token_b })
}

#[view]
public fun calculate_reward(staker: address): u64 acquires StakeInfo {
    let info = borrow_global<StakeInfo>(staker);
    let duration = timestamp::now_seconds() - info.start_time;
    (info.amount * duration * REWARD_RATE) / SECONDS_PER_YEAR
}
```

View functions:
- Can be called off-chain without a transaction
- Must not modify state
- Perfect for building UIs and dashboards

### Test Functions

Test-specific functions help you write comprehensive tests:

```rust
#[test]
public fun test_transfer_success() {
    let sender = @0x1;
    let recipient = @0x2;
    
    // Setup
    create_account_for_test(sender, 1000);
    create_account_for_test(recipient, 0);
    
    // Execute
    transfer(sender, recipient, 500);
    
    // Verify
    assert!(get_balance(sender) == 500, 0);
    assert!(get_balance(recipient) == 500, 1);
}

#[test_only]
public fun create_account_for_test(addr: address, initial_balance: u64) {
    // This function only exists in test builds
}
```

## Advanced Function Patterns

Let's explore patterns that make your functions more robust and maintainable.

### The Check-Effects-Interactions Pattern

This pattern prevents reentrancy and ensures consistency:

```rust
public fun safe_withdraw(user: &signer, amount: u64) acquires Vault {
    // 1. Checks
    let user_addr = signer::address_of(user);
    let vault = borrow_global_mut<Vault>(user_addr);
    assert!(vault.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
    assert!(!vault.is_locked, ERROR_VAULT_LOCKED);
    
    // 2. Effects (update state)
    vault.balance = vault.balance - amount;
    vault.last_withdrawal = timestamp::now_seconds();
    
    // 3. Interactions (external calls)
    coin::transfer<AptosCoin>(user, amount);
}
```

By updating state before external interactions, you prevent reentrancy attacks. Even if the external call somehow triggers a callback, your state is already updated.

### Builder Pattern with Functions

For complex operations, use a builder pattern:

```rust
public fun create_pool(): PoolBuilder {
    PoolBuilder {
        token_a: option::none(),
        token_b: option::none(),
        fee_tier: 30, // 0.3% default
        initial_price: 0,
    }
}

public fun with_tokens<A, B>(builder: PoolBuilder): PoolBuilder {
    builder.token_a = option::some(type_name<A>());
    builder.token_b = option::some(type_name<B>());
    builder
}

public fun with_fee(builder: PoolBuilder, fee: u64): PoolBuilder {
    assert!(fee <= 1000, ERROR_FEE_TOO_HIGH); // Max 10%
    builder.fee_tier = fee;
    builder
}

public fun build(builder: PoolBuilder): Pool {
    assert!(option::is_some(&builder.token_a), ERROR_TOKEN_A_NOT_SET);
    assert!(option::is_some(&builder.token_b), ERROR_TOKEN_B_NOT_SET);
    assert!(builder.initial_price > 0, ERROR_INVALID_PRICE);
    
    // Create the actual pool
}
```

This pattern provides a fluent interface for complex object construction while maintaining type safety.

### Result Pattern for Error Handling

While Move uses `assert!` for errors, you can create Result-like types:

```rust
struct Result<T> has drop {
    value: Option<T>,
    error: Option<u64>,
}

public fun safe_divide(numerator: u64, denominator: u64): Result<u64> {
    if (denominator == 0) {
        Result {
            value: option::none(),
            error: option::some(ERROR_DIVISION_BY_ZERO),
        }
    } else {
        Result {
            value: option::some(numerator / denominator),
            error: option::none(),
        }
    }
}
```

This pattern is useful when you want to handle errors without aborting the transaction.

## Best Practices

### Naming Conventions

Follow Move's naming conventions consistently:

```rust
// Functions: snake_case
public fun calculate_interest() { }

// Parameters: snake_case
public fun transfer(from_account: &signer, to_address: address) { }

// Type parameters: PascalCase
public fun create<TokenType>() { }
```

### Function Documentation

Document your functions thoroughly:

```rust
/// Calculates compound interest for a given principal
/// @param principal - The initial amount in base units
/// @param rate - Annual interest rate as a percentage (e.g., 5 for 5%)
/// @param years - Number of years to compound
/// @return The final amount after compound interest
public fun calculate_compound_interest(
    principal: u64,
    rate: u8,
    years: u8
): u64 {
    // Implementation
}
```

### Input Validation

Always validate inputs early:

```rust
public fun create_order(
    trader: &signer,
    amount: u64,
    price: u64,
    is_buy: bool
) {
    // Validate immediately
    assert!(amount > 0, ERROR_ZERO_AMOUNT);
    assert!(price > 0, ERROR_ZERO_PRICE);
    assert!(amount <= MAX_ORDER_SIZE, ERROR_ORDER_TOO_LARGE);
    
    // Then proceed with logic
    let order = Order { amount, price, is_buy };
    // ...
}
```

Early validation provides better error messages and prevents unnecessary computation.

<details>
<summary>📖 Function Design Checklist</summary>

Before finalizing a function, check:
- ✅ Is the function name clear and descriptive?
- ✅ Are parameters in the most logical order?
- ✅ Does it validate inputs early?
- ✅ Is the visibility (public/private/friend) appropriate?
- ✅ Are error messages helpful?
- ✅ Is it documented?
- ✅ Does it follow the single responsibility principle?

</details>

## Key Takeaways

Functions in Move are designed with blockchain's unique requirements in mind:

- **Ownership is explicit**: Parameters show exactly how data moves
- **References provide flexibility**: Read or modify without ownership transfer
- **Generics enable reusability**: Write once, use with many types
- **Safety is built-in**: The compiler catches many errors before deployment

Remember: good functions are predictable, well-documented, and do one thing well.

## What's Next?

In our next article, **[Resource Types: The Heart of Move's Security Model](/move/resource)**, we'll explore how Move's resource types provide unprecedented safety for digital assets. You'll learn how to create resources that can't be copied or lost, and why this makes Move perfect for blockchain development.
