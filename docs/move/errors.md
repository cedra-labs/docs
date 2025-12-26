---
title: Error Handling and Assertions in Move
sidebar_label: Error Handling
description: Master error handling in Move - from assertions and abort codes to advanced patterns. Learn how to build robust modules that fail gracefully and provide clear error messages.
keywords: [move error handling, assertions, abort codes, error patterns, move programming, blockchain errors]
---

# Error Handling and Assertions in Move

Traditional error handling is like carefully backing out of a parking space when you realize it's too small. Move's approach is like never entering the space at all if it won't fit. The latter is simpler, safer, and leaves no room for getting stuck halfway.

Here's what happens when a Move transaction encounters an error:

1. The execution immediately stops
2. All changes made during the transaction are discarded
3. The blockchain state remains unchanged
4. Gas fees are still charged (to prevent denial-of-service attacks)
5. An error code is returned to indicate what went wrong

This might seem wasteful – why charge gas for failed transactions? But this design prevents attackers from spamming the network with deliberately failing transactions. Every computation costs something, whether it succeeds or fails.

## Assert: Your Guardian at the Gate

The `assert!` macro is Move's primary tool for error handling. It's deceptively simple: check a condition, and if it's false, abort with an error code. But don't let its simplicity fool you – it's the foundation of all safety checks in Move.

```rust
module 0x42::bank {
    const E_INSUFFICIENT_FUNDS: u64 = 1;
    
    public fun withdraw(account: &mut Account, amount: u64) {
        assert!(account.balance >= amount, E_INSUFFICIENT_FUNDS);
        account.balance = account.balance - amount;
    }
}
```

When `assert!` fails, it's like hitting an emergency stop button. Everything halts immediately. No partial execution, no corrupted state, no need for cleanup. The transaction simply never happened from the blockchain's perspective.

But why use error codes instead of error messages? This is another blockchain optimization. Storing strings on-chain is expensive, and error messages would bloat the blockchain. Numbers are compact and efficient. The error code `1` might mean "insufficient funds" in your module, and developers can look up what each code means in your documentation.

## The Anatomy of Good Error Handling

Let's build up a complete example to see how error handling patterns emerge naturally from Move's constraints. We'll create a simple marketplace where users can list items for sale.

First, let's think about what could go wrong:
- The seller might not own the item
- The price might be invalid (zero or too high)
- The item might already be listed
- The marketplace might be paused for maintenance

Here's how we structure these errors:

```rust
module 0x42::marketplace {
    // Error constants grouped by category
    
    // Authorization errors (1-99)
    const E_NOT_ITEM_OWNER: u64 = 1;
    const E_MARKETPLACE_PAUSED: u64 = 2;
    
    // Validation errors (100-199)
    const E_INVALID_PRICE: u64 = 100;
    const E_PRICE_TOO_HIGH: u64 = 101;
    
    // State errors (200-299)
    const E_ITEM_ALREADY_LISTED: u64 = 200;
    const E_ITEM_NOT_FOUND: u64 = 201;
}
```

Notice the grouping? This isn't just organization – it's a debugging tool. When you see error 101, you immediately know it's a validation issue related to pricing. Error 201? That's a state problem. This systematic approach becomes invaluable as your project grows.

:::tip Real-World Error Organization
See how our guides organize errors:
- [Fungible Asset Errors](/guides/first-fa#5-debug-cheatsheet) - Standard abort codes for token operations
- [Escrow Error Categories](/guides/escrow#core-data-structures) - Grouped by operation type
- [Fee Splitter Validation](/guides/fee-splitter#32-constants--errors) - Clear error constants with descriptive names
:::

Now let's implement the listing function:

```rust
public fun list_item(
    seller: &signer,
    item_id: u64,
    price: u64
) acquires ItemRegistry, ListingRegistry, MarketplaceConfig {
    // First, check if marketplace is operational
    let config = borrow_global<MarketplaceConfig>(@marketplace);
    assert!(!config.is_paused, E_MARKETPLACE_PAUSED);
    
    // Verify ownership
    let seller_addr = signer::address_of(seller);
    let registry = borrow_global<ItemRegistry>(@marketplace);
    assert!(
        table::contains(&registry.items, item_id),
        E_ITEM_NOT_FOUND
    );
    
    let item = table::borrow(&registry.items, item_id);
    assert!(item.owner == seller_addr, E_NOT_ITEM_OWNER);
    
    // Validate price
    assert!(price > 0, E_INVALID_PRICE);
    assert!(price <= MAX_LISTING_PRICE, E_PRICE_TOO_HIGH);
    
    // Check if already listed
    let listings = borrow_global<ListingRegistry>(@marketplace);
    assert!(
        !table::contains(&listings.active, item_id),
        E_ITEM_ALREADY_LISTED
    );
    
    // All checks passed - create the listing
    create_listing_internal(seller_addr, item_id, price);
}
```

Look at the flow: we check the broadest conditions first (is the marketplace even running?), then narrow down to specific validations. Each assertion acts as a guardian, ensuring the next step is safe to execute. By the time we reach `create_listing_internal`, we know with certainty that:
- The marketplace is operational
- The item exists and belongs to the seller  
- The price is valid
- The item isn't already listed

This pattern – validate everything before modifying anything – is fundamental to Move programming.

## Beyond Simple Assertions: Error Handling Patterns

While `assert!` is powerful, real-world applications need more sophisticated patterns. Let's explore how Move developers handle complex error scenarios.

### The Option Pattern: When Missing Isn't Failing

Sometimes the absence of data isn't an error – it's just a possibility to handle. Move's `Option<T>` type represents values that might or might not exist. This is perfect for queries where "not found" is a normal outcome:

```rust
public fun find_listing(item_id: u64): Option<Listing> acquires ListingRegistry {
    let listings = borrow_global<ListingRegistry>(@marketplace);
    
    if (table::contains(&listings.active, item_id)) {
        let listing = table::borrow(&listings.active, item_id);
        option::some(*listing)
    } else {
        option::none()
    }
}
```

Why return `Option<Listing>` instead of asserting the listing exists? Because callers might want to check if an item is listed without aborting if it isn't:

```rust
public fun get_listing_price(item_id: u64): u64 acquires ListingRegistry {
    let listing_opt = find_listing(item_id);
    
    if (option::is_some(&listing_opt)) {
        let listing = option::borrow(&listing_opt);
        listing.price
    } else {
        0  // Return 0 for unlisted items
    }
}

public fun buy_item(buyer: &signer, item_id: u64) acquires ListingRegistry {
    let listing_opt = find_listing(item_id);
    
    // Here we DO want to abort if not listed
    assert!(option::is_some(&listing_opt), E_ITEM_NOT_LISTED);
    
    let listing = option::extract(&mut listing_opt);
    process_purchase(buyer, listing);
}
```

See the flexibility? The same `find_listing` function serves different purposes. `get_listing_price` handles missing listings gracefully, while `buy_item` treats them as errors. The Option pattern lets callers decide what's an error and what isn't.

### The Validation Pattern: Separating Checks from Actions

Complex operations often require multiple validations. Separating validation logic from execution logic makes code cleaner and more testable:

:::info Pattern Implementation
The [NFT minting](/guides/first-nft#3-creatorgated-mint) shows this pattern with its creator validation. The [Escrow contract](/guides/escrow#step-3-releasing-funds) demonstrates comprehensive validation before fund release.
:::

```rust
// Pure validation function - returns bool, never aborts
public fun is_valid_purchase(
    buyer_addr: address,
    listing: &Listing,
    payment_amount: u64
): bool {
    let has_funds = get_balance(buyer_addr) >= payment_amount;
    let price_matches = payment_amount == listing.price;
    let not_own_item = buyer_addr != listing.seller;
    let not_expired = timestamp::now_seconds() < listing.expiry;
    
    has_funds && price_matches && not_own_item && not_expired
}

// Validation with specific error codes - aborts on failure
public fun validate_purchase(
    buyer_addr: address,
    listing: &Listing,
    payment_amount: u64
) {
    assert!(
        get_balance(buyer_addr) >= payment_amount,
        E_INSUFFICIENT_FUNDS
    );
    assert!(
        payment_amount == listing.price,
        E_INCORRECT_PAYMENT
    );
    assert!(
        buyer_addr != listing.seller,
        E_CANNOT_BUY_OWN_ITEM
    );
    assert!(
        timestamp::now_seconds() < listing.expiry,
        E_LISTING_EXPIRED
    );
}

// Main function uses validation
public entry fun purchase_item(
    buyer: &signer,
    item_id: u64,
    payment_amount: u64
) acquires ListingRegistry {
    let listing = get_listing(item_id);  // This asserts listing exists
    let buyer_addr = signer::address_of(buyer);
    
    // Validate everything upfront
    validate_purchase(buyer_addr, &listing, payment_amount);
    
    // Execute with confidence
    transfer_payment(buyer, listing.seller, payment_amount);
    transfer_item(listing.seller, buyer_addr, item_id);
    remove_listing(item_id);
}
```

This pattern has several benefits:
- The boolean version (`is_valid_purchase`) lets you check without aborting
- The asserting version (`validate_purchase`) provides specific error codes
- The main function (`purchase_item`) stays focused on the happy path
- Tests can verify each validation rule independently

### The Result Pattern: Handling Multiple Failure Modes

Sometimes you need to handle errors without immediately aborting. Maybe you want to try several approaches or provide detailed feedback about what went wrong. The Result pattern brings Try-Catch style error handling to Move:

```rust
struct Result<T> has drop {
    success: bool,
    value: Option<T>,
    error_code: u64,
}

// Constructor functions for convenience
public fun ok<T>(value: T): Result<T> {
    Result {
        success: true,
        value: option::some(value),
        error_code: 0,
    }
}

public fun err<T>(error_code: u64): Result<T> {
    Result {
        success: false,
        value: option::none(),
        error_code,
    }
}
```

Here's how you might use it for an operation that can fail in multiple ways:

```rust
public fun try_auto_purchase(
    buyer: address,
    max_price: u64,
    preferred_sellers: vector<address>
): Result<PurchaseReceipt> acquires ListingRegistry {
    let listings = borrow_global<ListingRegistry>(@marketplace);
    
    // First try: preferred sellers
    let i = 0;
    while (i < vector::length(&preferred_sellers)) {
        let seller = *vector::borrow(&preferred_sellers, i);
        let result = try_purchase_from_seller(buyer, seller, max_price);
        
        if (result.success) {
            return result  // Found a match!
        };
        
        i = i + 1;
    };
    
    // Second try: any seller within budget
    let all_listings = get_listings_under_price(max_price);
    if (vector::is_empty(&all_listings)) {
        return err<PurchaseReceipt>(E_NO_LISTINGS_IN_BUDGET)
    };
    
    // Try the cheapest option
    let cheapest = find_cheapest_listing(&all_listings);
    try_purchase_listing(buyer, cheapest)
}
```

The Result pattern shines when you have fallback strategies or want to collect multiple errors before deciding what to do.

## Organizing Errors in Large Projects

As your project grows from a single module to a complex system, error organization becomes crucial. A well-organized error system helps developers understand failures quickly and maintains consistency across teams.

### The Centralized Error Module Approach

For large projects, consider centralizing error definitions:

```rust
module marketplace::errors {
    // ===== Global Errors (1-999) =====
    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_ARGUMENT: u64 = 2;
    const E_NOT_FOUND: u64 = 3;
    const E_ALREADY_EXISTS: u64 = 4;
    
    // ===== Token Module Errors (1000-1999) =====
    const E_INSUFFICIENT_BALANCE: u64 = 1000;
    const E_TOKEN_NOT_REGISTERED: u64 = 1001;
    const E_MINT_EXCEEDS_SUPPLY: u64 = 1002;
    const E_TRANSFER_TO_SELF: u64 = 1003;
    
    // ===== Market Module Errors (2000-2999) =====
    const E_INVALID_PRICE: u64 = 2000;
    const E_LISTING_EXPIRED: u64 = 2001;
    const E_ALREADY_SOLD: u64 = 2002;
    const E_MARKET_PAUSED: u64 = 2003;
    
    // ===== Auction Module Errors (3000-3999) =====
    const E_AUCTION_NOT_STARTED: u64 = 3000;
    const E_AUCTION_ENDED: u64 = 3001;
    const E_BID_TOO_LOW: u64 = 3002;
    const E_WINNER_CANNOT_BID: u64 = 3003;
    
    // Accessor functions for use in other modules
    public fun unauthorized(): u64 { E_UNAUTHORIZED }
    public fun invalid_argument(): u64 { E_INVALID_ARGUMENT }
    public fun insufficient_balance(): u64 { E_INSUFFICIENT_BALANCE }
    // ... more accessors
}
```

Now other modules import and use these standardized errors:

```rust
module marketplace::token {
    use marketplace::errors;
    
    public fun transfer(from: &signer, to: address, amount: u64) {
        let from_balance = get_balance(signer::address_of(from));
        assert!(from_balance >= amount, errors::insufficient_balance());
        
        // Transfer logic
    }
}
```

This approach has several advantages:
- **Consistency**: All modules use the same error codes for similar situations
- **Documentation**: One place to document what each error means
- **Avoid conflicts**: No accidental reuse of error codes
- **Easy updates**: Change an error code in one place

### Error Namespacing for Very Large Projects

For enterprise-scale projects with dozens of modules, consider a hierarchical error numbering scheme:

```rust
// Format: [System:1][Module:2][Category:1][Specific:2]
// Example: 102034 = System 1, Module 02, Category 0, Error 34

module megaproject::lending_errors {
    // System 1: DeFi Platform
    // Module 01: Collateral Management
    const E_INSUFFICIENT_COLLATERAL: u64 = 101001;
    const E_COLLATERAL_NOT_SUPPORTED: u64 = 101002;
    const E_COLLATERAL_PRICE_STALE: u64 = 101003;
    
    // Module 02: Lending Pool
    const E_BORROW_EXCEEDS_LIMIT: u64 = 102001;
    const E_HEALTH_FACTOR_TOO_LOW: u64 = 102002;
    
    // Module 03: Interest Calculation
    const E_RATE_OVERFLOW: u64 = 103001;
    const E_NEGATIVE_INTEREST: u64 = 103002;
}
```

With this scheme, error 102002 immediately tells you:
- It's from the DeFi platform (1)
- Specifically the lending pool module (02)
- It's a validation error (0)
- The specific issue is health factor (02)

## Common Pitfalls and How to Avoid Them

Let's explore mistakes that even experienced developers make when handling errors in Move.

### The Silent Failure Trap

One of the most dangerous patterns is swallowing errors:

```rust
// ❌ DANGEROUS: Returns default value on error
public fun get_user_balance(addr: address): u64 acquires UserAccount {
    if (!exists<UserAccount>(addr)) {
        return 0  // Silently pretending user has zero balance!
    };
    
    borrow_global<UserAccount>(addr).balance
}
```

Why is this dangerous? Imagine this scenario:
1. A user tries to check their balance
2. Due to a bug, their account wasn't created properly
3. The function returns 0 instead of indicating an error
4. The user thinks they have no funds when they might have millions

Here's the safer approach:

```rust
// ✅ SAFE: Caller decides how to handle missing accounts
public fun try_get_balance(addr: address): Option<u64> acquires UserAccount {
    if (exists<UserAccount>(addr)) {
        let account = borrow_global<UserAccount>(addr);
        option::some(account.balance)
    } else {
        option::none()
    }
}

// ✅ SAFE: Clear error when account must exist
public fun get_user_balance(addr: address): u64 acquires UserAccount {
    assert!(exists<UserAccount>(addr), E_ACCOUNT_NOT_FOUND);
    borrow_global<UserAccount>(addr).balance
}
```

### The Overly Generic Error Problem

Generic errors make debugging a nightmare:

```rust
// ❌ BAD: What exactly is invalid?
public fun process_transaction(tx: &Transaction) {
    assert!(is_valid_transaction(tx), E_INVALID_TRANSACTION);
}

// ✅ GOOD: Specific errors for each validation
public fun process_transaction(tx: &Transaction) {
    assert!(tx.amount > 0, E_ZERO_AMOUNT);
    assert!(tx.amount <= MAX_AMOUNT, E_AMOUNT_TOO_LARGE);
    assert!(exists<Account>(tx.sender), E_SENDER_NOT_FOUND);
    assert!(exists<Account>(tx.recipient), E_RECIPIENT_NOT_FOUND);
    assert!(tx.deadline > timestamp::now_seconds(), E_TRANSACTION_EXPIRED);
}
```

Specific errors serve as documentation. When transaction processing fails with `E_TRANSACTION_EXPIRED`, developers immediately know the deadline passed. With `E_INVALID_TRANSACTION`, they have to dig through code to understand what went wrong.

### The Late Validation Anti-Pattern

Validating after expensive operations wastes gas:

```rust
// ❌ BAD: Wastes computation on invalid data
public fun expensive_operation(user: &signer, data: vector<u8>) {
    let processed = complex_transformation(data);        // Expensive!
    let validated = validate_format(processed);          // Also expensive!
    let result = apply_business_logic(validated);        // Very expensive!
    
    // Only NOW we check if user can do this?!
    assert!(is_authorized(signer::address_of(user)), E_UNAUTHORIZED);
    
    save_result(result);
}

// ✅ GOOD: Fail fast, fail cheap
public fun expensive_operation(user: &signer, data: vector<u8>) {
    // Check authorization first - cheap!
    assert!(is_authorized(signer::address_of(user)), E_UNAUTHORIZED);
    
    // Basic validation - still cheap!
    assert!(vector::length(&data) > 0, E_EMPTY_DATA);
    assert!(vector::length(&data) <= MAX_SIZE, E_DATA_TOO_LARGE);
    
    // Only process if all checks pass
    let processed = complex_transformation(data);
    let validated = validate_format(processed);
    let result = apply_business_logic(validated);
    save_result(result);
}
```

Remember: on blockchain, failed transactions still cost gas. Check the cheap conditions first to minimize costs when things go wrong.

## Testing Your Error Handling

Robust code tests both success and failure paths. Move provides excellent tools for testing that your functions fail correctly. For comprehensive testing documentation, see [Move Unit Testing](/move/testing).

```rust
#[test_only]
module marketplace::market_tests {
    use marketplace::market;
    
    #[test]
    fun test_successful_listing() {
        let seller = @0x123;
        create_test_account(seller, 1000);
        create_test_item(seller, 1);
        
        // Should succeed
        market::list_item(create_signer_for_test(seller), 1, 500);
        
        let listing = market::get_listing(1);
        assert!(listing.price == 500, 0);
    }
    
    #[test]
    #[expected_failure(abort_code = market::E_NOT_ITEM_OWNER)]
    fun test_list_item_not_owner() {
        let owner = @0x123;
        let other = @0x456;
        
        create_test_item(owner, 1);
        
        // Should fail - other doesn't own item
        market::list_item(create_signer_for_test(other), 1, 500);
    }
    
    #[test]
    #[expected_failure(abort_code = market::E_INVALID_PRICE)]
    fun test_list_item_zero_price() {
        let seller = @0x123;
        create_test_item(seller, 1);
        
        // Should fail - price is zero
        market::list_item(create_signer_for_test(seller), 1, 0);
    }
}
```

The `#[expected_failure]` annotation is powerful – it ensures your function not only fails but fails with the exact error code you expect. This catches bugs where functions fail for the wrong reason.

### Testing Complex Error Scenarios

For functions with multiple failure modes, test each path:

```rust
#[test_only]
public fun test_all_purchase_failures() {
    // Setup
    let seller = @0x123;
    let buyer = @0x456;
    let item_id = 1;
    let price = 1000;
    
    create_test_item(seller, item_id);
    market::list_item(create_signer_for_test(seller), item_id, price);
    
    // Test 1: Insufficient funds
    create_test_account(buyer, 500);  // Only 500, need 1000
    let result = market::try_purchase(buyer, item_id, 500);
    assert!(!result.success, 0);
    assert!(result.error_code == market::E_INSUFFICIENT_FUNDS, 1);
    
    // Test 2: Wrong payment amount
    update_balance(buyer, 2000);  // Now has enough
    let result = market::try_purchase(buyer, item_id, 999);  // Wrong amount
    assert!(!result.success, 2);
    assert!(result.error_code == market::E_INCORRECT_PAYMENT, 3);
    
    // Test 3: Buying own item
    let result = market::try_purchase(seller, item_id, price);
    assert!(!result.success, 4);
    assert!(result.error_code == market::E_CANNOT_BUY_OWN_ITEM, 5);
}
```

## Advanced Error Handling Patterns

<details>
<summary>📚 Advanced Error Handling Patterns</summary>

### The Retry Pattern with Exponential Backoff

When dealing with operations that might temporarily fail:

```rust
const MAX_RETRIES: u64 = 3;
const E_MAX_RETRIES_EXCEEDED: u64 = 9001;

struct RetryResult<T> has drop {
    success: bool,
    value: Option<T>,
    attempts: u64,
    last_error: u64,
}

public fun with_retry<T: drop>(
    max_attempts: u64,
    operation: |u64| -> Result<T>
): RetryResult<T> {
    let attempts = 0;
    let last_error = 0;
    
    while (attempts < max_attempts) {
        let result = operation(attempts);
        
        if (result.success) {
            return RetryResult {
                success: true,
                value: result.value,
                attempts: attempts + 1,
                last_error: 0,
            }
        };
        
        last_error = result.error_code;
        attempts = attempts + 1;
        
        // In real implementation, you might add delays here
    };
    
    RetryResult {
        success: false,
        value: option::none(),
        attempts,
        last_error,
    }
}
```

### The Circuit Breaker Pattern

Prevent cascading failures by temporarily disabling problematic operations:

```rust
struct CircuitBreaker has key {
    failure_count: u64,
    failure_threshold: u64,
    last_failure_time: u64,
    cooldown_period: u64,
    is_open: bool,
}

public fun call_with_circuit_breaker<T>(
    breaker: &mut CircuitBreaker,
    operation: || -> Result<T>
): Result<T> {
    // Check if circuit is open
    if (breaker.is_open) {
        let time_since_failure = timestamp::now_seconds() - breaker.last_failure_time;
        
        if (time_since_failure < breaker.cooldown_period) {
            return err<T>(E_CIRCUIT_BREAKER_OPEN)
        };
        
        // Try to close the circuit
        breaker.is_open = false;
        breaker.failure_count = 0;
    };
    
    // Try the operation
    let result = operation();
    
    if (!result.success) {
        breaker.failure_count = breaker.failure_count + 1;
        breaker.last_failure_time = timestamp::now_seconds();
        
        if (breaker.failure_count >= breaker.failure_threshold) {
            breaker.is_open = true;
        };
    } else if (breaker.failure_count > 0) {
        // Reset on success
        breaker.failure_count = 0;
    };
    
    result
}
```

### The Saga Pattern for Distributed Transactions

When you need to coordinate multiple operations that might fail:

```rust
struct SagaStep has drop {
    execute: |&mut SagaContext| -> Result<()>,
    compensate: |&mut SagaContext| -> Result<()>,
}

struct SagaContext has drop {
    data: SimpleMap<String, u64>,
    completed_steps: vector<u64>,
}

public fun execute_saga(steps: vector<SagaStep>): Result<()> {
    let context = SagaContext {
        data: simple_map::create(),
        completed_steps: vector::empty(),
    };
    
    let i = 0;
    while (i < vector::length(&steps)) {
        let step = vector::borrow(&steps, i);
        let result = (step.execute)(&mut context);
        
        if (!result.success) {
            // Compensate in reverse order
            compensate_saga(&steps, &context, i);
            return result
        };
        
        vector::push_back(&mut context.completed_steps, i);
        i = i + 1;
    };
    
    ok(())
}

fun compensate_saga(
    steps: &vector<SagaStep>,
    context: &SagaContext,
    failed_at: u64
) {
    let i = failed_at;
    
    while (i > 0) {
        i = i - 1;
        
        if (vector::contains(&context.completed_steps, &i)) {
            let step = vector::borrow(steps, i);
            let _ = (step.compensate)(context);  // Best effort
        };
    };
}
```

</details>

## Best Practices and Guidelines

After working with Move's error handling system, certain patterns emerge as best practices:

### 1. Design Your Error Codes Thoughtfully

Your error codes are part of your API. Once deployed, changing them can break integrations. Spend time organizing them well:

```rust
module myproject::errors {
    // Reserve ranges for future use
    // 1-999: Global errors
    // 1000-1999: Module A
    // 2000-2999: Module B
    // ...
    // 9000-9999: System errors
    
    // Document each error clearly
    /// Thrown when user tries to withdraw more than their balance
    const E_INSUFFICIENT_FUNDS: u64 = 1001;
    
    /// Thrown when user tries to withdraw from a frozen account
    const E_ACCOUNT_FROZEN: u64 = 1002;
}
```

### 2. Fail Fast, Fail Descriptively

Check conditions as early as possible and make errors specific:

```rust
public fun complex_operation(
    user: &signer,
    param1: u64,
    param2: vector<u8>,
    param3: address
) {
    // Authorization checks first (cheapest)
    let user_addr = signer::address_of(user);
    assert!(is_authorized(user_addr), E_UNAUTHORIZED);
    
    // Parameter validation (still cheap)
    assert!(param1 > 0, E_PARAM1_ZERO);
    assert!(param1 <= MAX_VALUE, E_PARAM1_TOO_LARGE);
    assert!(!vector::is_empty(&param2), E_PARAM2_EMPTY);
    
    // State checks (more expensive)
    assert!(exists<Registry>(param3), E_REGISTRY_NOT_FOUND);
    
    // Only then do expensive operations
    perform_operation(param1, param2, param3);
}
```

### 3. Provide Safe Alternatives

For every aborting function, consider providing a non-aborting alternative:

```rust
// Aborting version for when balance MUST exist
public fun get_balance(addr: address): u64 acquires Balance {
    assert!(exists<Balance>(addr), E_NO_BALANCE);
    borrow_global<Balance>(addr).amount
}

// Safe version for checking
public fun get_balance_or_zero(addr: address): u64 acquires Balance {
    if (exists<Balance>(addr)) {
        borrow_global<Balance>(addr).amount
    } else {
        0
    }
}

// Option version for flexibility
public fun try_get_balance(addr: address): Option<u64> acquires Balance {
    if (exists<Balance>(addr)) {
        option::some(borrow_global<Balance>(addr).amount)
    } else {
        option::none()
    }
}
```

### 4. Test Error Paths Thoroughly

Every assertion in your code should have a corresponding test:

```rust
#[test]
fun test_all_error_conditions() {
    test_unauthorized_access();
    test_insufficient_funds();
    test_invalid_parameters();
    test_expired_operations();
    // ... test every E_ constant
}
```

### 5. Document Error Conditions

Make it clear when and why functions might fail:

```rust
/// Transfers tokens from one account to another
/// 
/// # Arguments
/// * `from` - The account to transfer from
/// * `to` - The account to transfer to  
/// * `amount` - The amount to transfer
///
/// # Errors
/// * `E_INSUFFICIENT_FUNDS` - If from account has less than amount
/// * `E_ACCOUNT_FROZEN` - If either account is frozen
/// * `E_AMOUNT_ZERO` - If amount is 0
/// * `E_SAME_ACCOUNT` - If from and to are the same
public fun transfer(from: &signer, to: address, amount: u64) {
    // Implementation
}
```

:::tip Error Handling Checklist
Before deploying, ensure:
- ✅ All error codes are unique within your module
- ✅ Error codes are organized systematically  
- ✅ Every assertion has a test case
- ✅ Authorization checks come before expensive operations
- ✅ Safe alternatives exist for common operations
- ✅ Error conditions are documented
- ✅ No silent failures (returning defaults on error)
:::

## Key Takeaways

Move's error handling might seem restrictive at first, but it's designed for the unique requirements of blockchain:

- **Atomicity is non-negotiable**: Transactions either succeed completely or fail completely
- **Assert early and often**: Validate everything before making state changes
- **Error codes are your API**: Design them thoughtfully and document them well
- **Patterns provide flexibility**: Option, Result, and validation patterns handle complex scenarios
- **Testing is crucial**: Every error path needs verification
- **Organization scales**: Systematic error numbering helps large projects

The simplicity of Move's error model – abort on any error – actually makes programs more reliable. There's no confusion about partial states, no complex error propagation, no unexpected exception paths. When something goes wrong, the blockchain stays consistent, and developers get clear feedback about what happened.

## What's Next?

You've now completed the Move fundamentals series! With your understanding of resources, modules, functions, control flow, and error handling, you're ready to build real applications.

Check out our **[Real World Guides](/real-world-guides)** to put your knowledge into practice:
- Build your first token with the **[Fungible Asset Guide](/guides/first-fa)**
- Create unique collectibles with the **[NFT Contract Walkthrough](/guides/first-nft)**
- Implement secure payments with the **[Escrow Contract Guide](/guides/escrow)**
- Set up revenue sharing with the **[Fee Splitter Module](/guides/fee-splitter)**