---
title: Resource Types - The Heart of Move's Security Model
description: Deep dive into Move's revolutionary resource types. Learn how linear types prevent duplication and loss of digital assets, making Move the safest language for blockchain development.
keywords: [move resources, linear types, digital assets, blockchain security, resource safety, move programming]
---

# Resource Types: The Heart of Move's Security Model

In traditional programming, data can be freely copied and discarded. You can duplicate a bank balance variable, accidentally overwrite it, or let it go out of scope. This flexibility is dangerous when dealing with digital assets.

Move takes a radically different approach. Resources are special types that follow strict rules:

```rust
struct Coin has store {
    value: u64
}

struct NFT has key, store {
    id: u64,
    metadata: vector<u8>
}
```

Notice what's missing? Neither struct has the `copy` or `drop` abilities. This makes them resources – linear types that must be explicitly handled. You can't duplicate a Coin or accidentally lose an NFT. The compiler enforces this at every step.

## The Four Abilities: Controlling Resource Behavior

Move's ability system gives you fine-grained control over how types behave. Understanding these abilities is crucial for resource programming.

### Copy: The Ability Resources Don't Have

The `copy` ability allows types to be duplicated. Resources deliberately lack this ability:

```rust
struct Price has copy, drop {
    amount: u64
}

struct Token has store {
    amount: u64
}

let price = Price { amount: 100 };
let price2 = price;  
let price3 = price;  

let token = Token { amount: 100 };
let token2 = token;  
```

The Price struct can be copied freely – `price` remains valid after creating `price2` and `price3`. Each variable has its own independent copy. This is perfect for data that represents information rather than value.

The Token struct cannot be copied. After `token2 = token`, the original `token` variable is no longer accessible. The ownership has moved. This movement is tracked by the compiler, ensuring no tokens are created or destroyed accidentally.

### Drop: Controlling Destruction

The `drop` ability allows values to be discarded implicitly:

```rust
struct LogEntry has drop {
    message: vector<u8>,
    timestamp: u64
}

struct Ticket has store {
    event_id: u64,
    seat_number: u64
}

fun process_log() {
    let log = LogEntry { 
        message: b"User logged in", 
        timestamp: 1234567890 
    };
}

fun process_ticket() {
    let ticket = Ticket { 
        event_id: 1, 
        seat_number: 42 
    };
}
```

When `process_log` ends, the LogEntry is automatically dropped – no special handling needed. This is convenient for temporary data that doesn't represent value.

The Ticket in `process_ticket` cannot be dropped. This code won't compile because the ticket must be explicitly handled. You must transfer it, store it, or explicitly destroy it. This prevents accidentally losing valuable assets.

### Store: Enabling Composition

The `store` ability allows types to be stored inside other structs:

```rust
struct Coin has store {
    value: u64
}

struct NFT has key, store {
    id: u64,
    metadata: vector<u8>
}

struct Wallet has key {
    nfts: vector<NFT>
}
```

NFT have the `store` ability, so it can be placed in containers. This enables building complex data structures while maintaining resource safety. Without `store`, a type can only exist independently, not as part of other structures.

The container (Wallet) has the `key` ability, allowing it to exist in global storage. This creates a hierarchy: resources with `store` live inside resources with `key`.

### Key: Global Storage Access

The `key` ability marks types that can exist at the top level of global storage:

```rust
struct UserAccount has key {
    balance: u64,
    frozen: bool
}

public fun create_account(user: &signer) {
    let user_addr = signer::address_of(user);
    assert!(!exists<UserAccount>(user_addr), ERROR_ACCOUNT_EXISTS);
    
    move_to(user, UserAccount {
        balance: 0,
        frozen: false
    });
}
```

Only types with `key` can be published to addresses using `move_to`. They become globally accessible resources that can be read with `borrow_global` and modified with `borrow_global_mut`. Each address can hold at most one instance of each `key` type, creating natural uniqueness.

:::tip Ability Combinations
Common patterns for ability combinations:
- `has store`: Basic resources (tokens, items)
- `has key, store`: Flexible resources (NFTs that can be stored or exist independently)
- `has copy, drop`: Information/data types (prices, metadata)
- `has key`: Singletons (user accounts, global configs)
- No abilities: Hot potatoes (must be handled immediately)
:::

## Linear Types in Action

Move's linear type system ensures every resource is accounted for. Let's see how this works in practice. When you assign a resource to a new variable or pass it to a function, ownership moves:

```rust
public fun transfer_ownership() {
    let coin = Coin { value: 100 };
    let my_coin = coin;
    
    spend_coin(my_coin);
}

fun spend_coin(coin: Coin) {
    let Coin { value } = coin;
    emit_spent_event(value);
}
```

After `my_coin = coin`, the variable `coin` is no longer valid. The compiler tracks this movement and will error if you try to use `coin` again. This isn't a limitation – it's a guarantee that resources can't be duplicated.

The `spend_coin` function takes ownership of the coin. Inside the function, we destructure the coin with `let Coin { value } = coin`. This pattern extracts the value and destroys the coin in one operation. The coin no longer exists after this line.

### Explicit Resource Handling

Resources must be explicitly handled – you can't ignore them:

```rust
public fun bad_function() {
    let token = Token { amount: 50 };
}

public fun good_function() {
    let token = Token { amount: 50 };
    store_token(token);
}

fun store_token(token: Token) acquires TokenVault {
    let vault = borrow_global_mut<TokenVault>(@vault_address);
    vector::push_back(&mut vault.tokens, token);
}
```

The `bad_function` creates a token but doesn't do anything with it. This won't compile – Move detects the unused resource. Every resource must be moved somewhere: into storage, to another function, or explicitly destroyed.

The `good_function` properly handles the token by passing it to `store_token`, which stores it in a vault. This explicit handling ensures no assets are lost.

### Resource Destruction

Sometimes you need to destroy resources intentionally. Move requires explicit destruction through pattern matching:

```rust
struct RewardPoint has store {
    value: u64
}

public fun burn_points(points: RewardPoint): u64 {
    let RewardPoint { value } = points;
    emit_burn_event(value);
    value
}

public fun merge_points(points1: RewardPoint, points2: RewardPoint): RewardPoint {
    let RewardPoint { value: value1 } = points1;
    let RewardPoint { value: value2 } = points2;
    
    RewardPoint { value: value1 + value2 }
}
```

The destructuring pattern `let RewardPoint { value } = points` unpacks the struct and destroys it. After this line, `points` no longer exists, but we have its inner `value`. This makes resource destruction explicit and intentional.

In `merge_points`, we destroy two RewardPoint resources and create a new one with the combined value. The total number of points is preserved – we can't create or destroy value, only transform it.

:::warning Resource Conservation Law
Just like energy in physics, resources in Move follow a conservation law:
- Resources cannot be created from nothing (except by authorized minters)
- Resources cannot be destroyed into nothing (except by explicit burning)
- Resources can only be transformed or transferred
- The total amount is always conserved
:::

## Common Resource Patterns

Certain patterns emerge repeatedly when working with resources. Understanding these patterns helps you write safer, more efficient code.

### The Capability Pattern

Capabilities are resources that represent permissions or rights:

```rust
struct MintCapability has key, store {
    supply_limit: u64,
    minted_so_far: u64
}

struct BurnCapability has key, store {
    authorized_burner: address
}

public fun mint_tokens(
    cap: &mut MintCapability,
    amount: u64
): Token {
    assert!(
        cap.minted_so_far + amount <= cap.supply_limit,
        ERROR_EXCEEDS_SUPPLY
    );
    
    cap.minted_so_far = cap.minted_so_far + amount;
    Token { amount }
}

public fun burn_tokens(
    cap: &BurnCapability,
    token: Token,
    burner: address
): u64 {
    assert!(cap.authorized_burner == burner, ERROR_UNAUTHORIZED);
    
    let Token { amount } = token;
    emit_burn_event(amount);
    amount
}
```

The MintCapability is a resource that controls token creation. Having a reference to this capability proves you're authorized to mint. The capability tracks how many tokens have been minted, enforcing supply limits. Because it's a resource, the capability can't be forged or duplicated.

The BurnCapability works similarly but for destruction. Only the authorized burner can destroy tokens. This pattern separates permission (having the capability) from action (minting/burning), making systems more flexible and secure.

### The Hot Potato Pattern

A "hot potato" is a resource without any abilities – it must be handled immediately:

```rust
struct Receipt {
    amount: u64,
    payer: address
}

public fun start_payment(payer: &signer, amount: u64): Receipt {
    let payer_addr = signer::address_of(payer);
    withdraw_from_account(payer, amount);
    
    Receipt { amount, payer: payer_addr }
}

public fun complete_payment(receipt: Receipt, recipient: address) {
    let Receipt { amount, payer } = receipt;
    deposit_to_account(recipient, amount);
    emit_payment_event(payer, recipient, amount);
}
```

The Receipt has no abilities – it can't be stored, copied, or dropped. When `start_payment` returns a Receipt, the caller must immediately pass it to `complete_payment`. There's no way to "forget" about the payment or store the receipt for later.

This pattern ensures atomic operations. The payment must be completed in the same transaction where it started. It's impossible to leave the system in an inconsistent state.

### Resource Wrappers

Sometimes you need to temporarily give resources abilities they don't naturally have:

```rust
struct LockedCoin has key {
    coin: Coin,
    unlock_time: u64
}

public fun lock_coins(
    owner: &signer,
    coin: Coin,
    lock_duration: u64
) {
    let unlock_time = timestamp::now_seconds() + lock_duration;
    move_to(owner, LockedCoin { coin, unlock_time });
}

public fun unlock_coins(owner: &signer): Coin acquires LockedCoin {
    let owner_addr = signer::address_of(owner);
    let LockedCoin { coin, unlock_time } = move_from<LockedCoin>(owner_addr);
    
    assert!(
        timestamp::now_seconds() >= unlock_time,
        ERROR_STILL_LOCKED
    );
    
    coin
}
```

The Coin resource doesn't have the `key` ability, so it can't exist in global storage directly. By wrapping it in LockedCoin (which has `key`), we can store it at an address. The wrapper adds the time-lock functionality while preserving the underlying resource.

When unlocking, we unwrap the coin and return it. The LockedCoin wrapper is destroyed, but the inner Coin resource is preserved and returned to the caller.

<details>
<summary>📚 More Resource Patterns</summary>

**Flash Loan Pattern**: Borrow and return in same transaction
```rust
struct FlashLoan<phantom T> {
    amount: u64,
    borrowed_at: u64
}

public fun borrow<T>(amount: u64): (Coin<T>, FlashLoan<T>) {
    // Withdraw from pool and create loan receipt
}

public fun repay<T>(coin: Coin<T>, loan: FlashLoan<T>) {
    // Verify same transaction and amount matches
}
```

**Escrow Pattern**: Hold resources until conditions met
```rust
struct Escrow<phantom T> has key {
    seller: address,
    buyer: address,
    item: T,
    price: u64
}
```

</details>

## Best Practices for Resource Design

Resources should contain only essential data:

```rust
struct Token has store {
    amount: u64
}

struct TokenMetadata has copy, drop, store {
    name: vector<u8>,
    symbol: vector<u8>,
    decimals: u8
}
```

The Token resource contains only the value. Metadata is a separate, copyable struct. This separation keeps resources lightweight and allows metadata to be freely shared without risking the actual assets.

### Use Phantom Types for Safety

Phantom types prevent mixing incompatible resources:

```rust
struct Balance<phantom TokenType> has key {
    amount: u64
}

public fun transfer<TokenType>(
    from: address,
    to: address,
    amount: u64
) acquires Balance {
    let from_balance = borrow_global_mut<Balance<TokenType>>(from);
    assert!(from_balance.amount >= amount, ERROR_INSUFFICIENT);
    from_balance.amount = from_balance.amount - amount;
    
    let to_balance = borrow_global_mut<Balance<TokenType>>(to);
    to_balance.amount = to_balance.amount + amount;
}
```

Even though all balances store just a `u64`, the phantom type ensures you can't accidentally transfer USDC when you meant to transfer APT. The type system enforces this at compile time with zero runtime cost.

### Design for Composability

Make resources that work well together:

```rust
struct Coin<phantom TokenType> has store {
    amount: u64
}

struct Vault<phantom TokenType> has key {
    coins: Coin<TokenType>,
    withdraw_capability: Option<WithdrawCap>
}

struct WithdrawCap has store {
    vault_owner: address,
    max_amount: Option<u64>
}
```

These resources compose naturally. Coins go in Vaults, Vaults can issue WithdrawCaps, and the whole system maintains resource safety. Each piece has a clear purpose and combines predictably with others.

:::info Design Principle
Think of resources like LEGO blocks:
- Each piece has a specific shape (abilities)
- They connect in predictable ways (type compatibility)
- Complex structures emerge from simple pieces (composability)
- You can't force incompatible pieces together (type safety)
:::

## Common Pitfalls

### Attempting to Copy Resources

```rust
let token = Token { amount: 100 };
let token_copy = token;
let another_copy = token;
```

This won't compile. After `token_copy = token`, the original `token` is moved and no longer accessible. Design your code with movement in mind.

### Forgetting to Handle Resources

```rust
public fun broken_swap(input: Token<X>): Token<Y> {
    let output = get_output_amount(input);
    create_token<Y>(output)
}
```

This function takes an input token but never handles it. The compiler will reject this. You must explicitly store, transfer, or destroy every resource.

### Incorrect Ability Combinations

```rust
struct BrokenNFT has copy, key {
    id: u64
}
```

An NFT with `copy` defeats the purpose – anyone could duplicate it. Think carefully about which abilities make sense for your use case.

## Key Takeaways

Resource types are Move's superpower for blockchain development:

- **Linear types ensure conservation**: Resources can't be created or destroyed accidentally
- **Abilities provide fine control**: Choose exactly how your types can be used
- **Compiler enforcement**: Resource safety is guaranteed at compile time
- **Composable patterns**: Build complex systems from simple, safe components

Resources might feel restrictive at first, but they're actually liberating. They free you from worrying about duplication bugs, lost assets, or inconsistent state. The compiler has your back.

## What's Next?

In our next article, **"Move Ownership and Borrowing"**, we'll dive deep into Move's ownership system. You'll learn how references work, when to use mutable vs immutable borrows, and patterns for efficient resource access without taking ownership.