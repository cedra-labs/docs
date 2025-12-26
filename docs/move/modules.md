---
title: Move Modules - Understanding Modular Programming
sidebar_label: Move Modules
description: Learn how to organize Move code into modules, control visibility with public and friend functions, and build scalable blockchain applications with proper separation of concerns.
keywords: [move modules, modular programming, visibility control, friend functions, code organization, blockchain architecture]
---

# Move Modules: Understanding Modular Programming

Modules in Move are the fundamental unit of code organization. Think of them as containers that group related functionality, similar to classes in object-oriented languages or modules in Rust. However, Move modules have some unique characteristics designed specifically for blockchain development.

The key difference? Once deployed to the blockchain, modules become immutable code libraries. This immutability is a feature, not a limitation – it ensures that the rules governing digital assets can't be changed after deployment.

Here's the simplest possible module:

```rust
module 0x42::hello {
    public fun say_hello(): vector<u8> {
        b"Hello, Move!"
    }
}
```

This module lives at address `0x42`, is named `hello`, and contains a single function. Once deployed, anyone can call `0x42::hello::say_hello()` and it will always return the same greeting. The code can't be modified, deleted, or censored.

## Understanding Module Addresses

Every module in Move has an address – a permanent home on the blockchain. This address system serves multiple purposes that are crucial to understanding Move development.

### The Address System

When you write `module 0x42::bank`, you're declaring that this module will live at address `0x42` with the name `bank`. This creates a globally unique identifier: `0x42::bank`.

```rust
module 0x42::bank {
    // Module contents
}
```

But why do modules need addresses? Three key reasons:

1. **Namespace Isolation**: Two different addresses can have modules with the same name without conflict
2. **Access Control**: The address owner controls what gets deployed there
3. **Permanent Identity**: Once deployed, the module is forever associated with that address

### Named Addresses for Development

During development, you'll use named addresses for flexibility:

```toml
# In Move.toml
[addresses]
marketplace = "0x123"
tokens = "0x456"
```

Now you can write more readable code:

```rust
module marketplace::trading {
    use tokens::nft::NFT;
    // Your code here
}
```

When you deploy, these named addresses get replaced with actual blockchain addresses. This system lets you develop locally with one set of addresses and deploy to mainnet with another, without changing your code.

:::info Deployment Tip
Always use named addresses during development. It makes your code portable across different networks (testnet, mainnet) and easier to read. The actual addresses are configured in Move.toml, not hardcoded in your modules.
:::

## Module Anatomy: Structure and Organization

A well-organized module follows a consistent structure that makes it easy to understand and maintain. Let's explore each section and why it matters.

### Imports: Building on Other Modules

Modules rarely exist in isolation. The `use` statement lets you access functionality from other modules:

```rust
module marketplace::auction {
    use std::vector;
    use std::signer;
}
```

Each import serves a specific purpose:
- `std::vector` - For working with dynamic arrays
- `std::signer` - For handling transaction authorization

Move's import system is explicit – you only get access to what you specifically import. This makes dependencies clear and prevents namespace pollution.

### Constants: Configuration at Compile Time

Constants define values that never change. They're perfect for configuration and error codes:

```rust
module marketplace::config {
    const MAX_FEE_PERCENTAGE: u8 = 10;
    const MIN_LISTING_PRICE: u64 = 100;
    
    const ERROR_PRICE_TOO_LOW: u64 = 1;
    const ERROR_FEE_TOO_HIGH: u64 = 2;
}
```

Why use constants instead of hard-coding values? Three reasons:

1. **Self-documenting**: `MAX_FEE_PERCENTAGE` is clearer than `10`
2. **Easy to change**: Update one place instead of hunting through code
3. **Consistency**: No risk of using different values in different places

Error constants are especially important. When your code aborts with `ERROR_PRICE_TOO_LOW`, developers immediately understand what went wrong.

### Structs: Defining Your Data

Structs define the shape of your data. In a module context, they represent the core concepts your module works with:

```rust
module marketplace::auction {
    struct Auction has key {
        seller: address,
        item_id: u64,
        current_bid: u64,
        end_time: u64,
    }
}
```

This struct represents an auction. The `has key` ability means it can be stored in global storage – each auction exists at a specific address on the blockchain. The fields capture everything needed to run an auction: who's selling, what they're selling, the current price, and when it ends.

## Visibility Control: The Heart of Module Security

Move's visibility system is what makes modules secure. Unlike traditional programming where everything is often accessible by default, Move makes you explicitly declare what's public.

### Private by Default

Functions in Move are private by default – they can only be called within the same module. This is a security feature:

```rust
module 0x42::bank {
    // Private - only this module can call it
    fun calculate_interest(principal: u64, rate: u8): u64 {
        (principal * (rate as u64)) / 100
    }
    
    // Public - anyone can call this
    public fun get_loan_amount(principal: u64): u64 {
        let interest = calculate_interest(principal, 5);
        principal + interest
    }
}
```

The `calculate_interest` function is an implementation detail. By keeping it private, you can change how interest is calculated without breaking other modules that depend on your code. The public `get_loan_amount` function provides a stable interface while hiding the complexity.

### Public Functions: Your Module's API

Public functions are promises to the outside world. Once you make a function public, other modules will depend on it:

```rust
public fun transfer(from: &mut Account, to: &mut Account, amount: u64) {
    assert!(from.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
    from.balance = from.balance - amount;
    to.balance = to.balance + amount;
}
```

This function is public because other modules need to transfer funds. The function signature – its name, parameters, and return type – becomes a contract you shouldn't break.

### Entry Functions: Transaction Entry Points

Some public functions need to be called directly by users through transactions. These are marked as `entry`:

```rust
public entry fun create_auction(
    seller: &signer,
    item_id: u64,
    starting_price: u64
) {
    let seller_addr = signer::address_of(seller);
    // Create the auction
}
```

Entry functions have special rules:
- They can only take primitive types and references as parameters
- They cannot return values
- They're the bridge between users and your module

### Friend Functions: Trusted Partnerships

Sometimes you need to share functionality with specific modules without making it fully public. Friend functions solve this:

:::info Real-World Example
See friend functions in action in complex multi-module systems. While our example guides use simpler patterns, the [Escrow Contract](/guides/escrow) shows how modules can work together with clear boundaries using similar access control principles.
:::

```rust
module 0x42::vault {
    friend 0x42::vault_manager;
    
    // Only vault_manager can call this
    public(friend) fun emergency_withdraw(amount: u64): Coin {
        // Withdrawal logic
    }
}
```

Friend relationships must be declared explicitly. This creates a web of trust between modules while maintaining security. Common uses include:
- Administrative functions
- Cross-module protocols
- Privileged operations

:::tip Visibility Best Practices
- Start with everything private
- Only make functions public when other modules need them
- Use entry functions for user-facing operations
- Reserve friend functions for trusted module interactions
:::

## Building Modular Applications

As applications grow, proper module organization becomes crucial. The key is separation of concerns – each module should have one clear purpose.

### Single Responsibility Principle

Consider a marketplace application. Instead of one giant module, you'd separate concerns:

```rust
module marketplace::token {
    struct Token has key, store {
        id: u64,
        uri: vector<u8>,
    }
    
    public fun mint(creator: &signer, uri: vector<u8>): Token {
        // Minting logic
    }
}

module marketplace::trading {
    use marketplace::token::Token;
    
    struct Listing has key {
        token: Token,
        price: u64,
    }
    
    public fun list_token(seller: &signer, token: Token, price: u64) {
        // Listing logic
    }
}
```

The `token` module handles token creation and management. The `trading` module handles the marketplace logic. Each has a clear, focused purpose. This separation makes the code easier to understand, test, and maintain.

### Interface Design Between Modules

When modules need to communicate, design clear interfaces. Think of interfaces as contracts between modules:

```rust
module defi::price_oracle {
    struct PriceData has copy, drop {
        token_pair: vector<u8>,
        price: u64,
        timestamp: u64,
    }
    
    public fun get_price(token_a: vector<u8>, token_b: vector<u8>): PriceData {
        // Return current price
    }
}
```

Any module can use this price oracle by calling `get_price`. The `PriceData` struct with `copy, drop` abilities acts as a simple data transfer object – it can be freely copied and discarded, making it perfect for passing information between modules.

## Common Module Patterns

Certain patterns appear repeatedly in Move development. Understanding these patterns helps you write better modules.

### The Registry Pattern

When you need to manage a collection of items, the registry pattern provides a clean solution:

:::tip Pattern in Practice
The [Escrow Contract](/guides/escrow) uses a similar pattern with its `LockupRef` and `Lockup` structures to manage multiple escrow entries. The [Fee Splitter](/guides/fee-splitter) also demonstrates registry-like storage for managing multiple recipients.
:::

```rust
module 0x42::user_registry {
    use std::table::{Self, Table};
    
    struct Registry has key {
        users: Table<address, UserInfo>,
    }
    
    struct UserInfo has store {
        username: vector<u8>,
        reputation: u64,
    }
    
    public fun register(user: &signer, username: vector<u8>) {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<Registry>(@0x42);
        
        table::add(&mut registry.users, user_addr, UserInfo {
            username,
            reputation: 0,
        });
    }
}
```

This pattern centralizes data management. All user information lives in one place, making it easy to query and update. The `Table` provides efficient key-value storage for large collections.

### The Capability Pattern

Capabilities are a powerful way to manage permissions:

:::success See It Live
Our [Fungible Asset Guide](/guides/first-fa) demonstrates this pattern with `MintRef` and `BurnRef` capabilities that control who can create or destroy tokens. The pattern makes permission management explicit and transferable.
:::

```rust
module 0x42::admin {
    struct AdminCap has key, store {}
    
    public fun grant_admin(admin: &signer, recipient: address) {
        // Only the module deployer can grant admin
        assert!(signer::address_of(admin) == @0x42, ERROR_NOT_AUTHORIZED);
        transfer::public_transfer(AdminCap {}, recipient);
    }
    
    public fun admin_action(_cap: &AdminCap) {
        // Having AdminCap proves you're an admin
        // Perform privileged action
    }
}
```

Instead of checking addresses or maintaining lists, capabilities are tokens that prove authorization. If you have an `AdminCap`, you're an admin. This pattern is composable, transferable, and secure.

<details>
<summary>📖 More Module Patterns</summary>

**Witness Pattern**: For one-time initialization
```rust
struct INIT has drop {}

fun init(witness: INIT) {
    // Can only be called once with the witness
}
```

**Hot Potato Pattern**: Forces immediate handling
```rust
struct Receipt {
    // No abilities - must be consumed
}

public fun start_process(): Receipt {
    Receipt {}
}

public fun complete_process(receipt: Receipt) {
    let Receipt {} = receipt;
}
```

</details>

## Testing Your Modules

Testing is crucial for confidence in your code. For comprehensive testing documentation, see [Move Unit Testing](/move/testing).

```rust
#[test_only]
module 0x42::auction_tests {
    use 0x42::auction;

    #[test]
    fun test_auction_lifecycle() {
        // Setup
        let seller = @0x123;
        let seller_signer = create_signer_for_test(seller);

        // Create auction
        auction::create(seller_signer, item_id, starting_price);

        // Verify state
        let (current_bid, leader) = auction::get_status(seller, item_id);
        assert!(current_bid == starting_price, 0);
    }
}
```

Tests live in separate test-only modules. They can access private functions and create test scenarios that would be impossible in production. Write tests for both success cases and failure modes.

:::note Testing Checklist
- ✅ Test happy paths (everything works)
- ✅ Test error conditions (things fail correctly)
- ✅ Test edge cases (boundary conditions)
- ✅ Test access control (permissions work)
- ✅ Test state transitions (data changes correctly)
:::

## Key Takeaways

Modules are Move's answer to code organization, and they're designed with blockchain's unique requirements in mind:

- **Immutability as a Feature**: Deployed code can't change, providing strong guarantees
- **Explicit Visibility**: Security by default with fine-grained access control
- **Clear Dependencies**: Import system makes module relationships explicit
- **Flexible Patterns**: Capabilities, registries, and interfaces enable complex applications

The module system might feel restrictive at first, but these constraints guide you toward secure, maintainable code.

## What's Next?

In our next article, **[Functions in Move: Declaration and Usage](/move/functions)**, we'll dive deep into function design, parameters, return values, and advanced patterns for building robust APIs.

Start practicing by creating a simple module – perhaps a todo list or basic token. As you get comfortable, try implementing patterns like registries or capabilities. Remember: good modules are focused, well-documented, and designed with security in mind.