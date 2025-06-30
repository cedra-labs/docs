---
title: Basic Syntax and Data Types - Building Blocks of Move
sidebar_label: Basic Syntax and Data Types
description: Master Move's syntax fundamentals and type system. Learn about variables, data types, structs, and the unique ability system that makes Move perfect for blockchain development.
keywords: [move syntax, data types, structs, abilities, vectors, blockchain programming]
---

# Basic Syntax and Data Types: Building Blocks of Move

In Move, data immutability is the default, reflecting the blockchain's emphasis on predictable, secure state changes. This design choice prevents accidental modifications and makes code easier to reason about.

### Variable Declaration

Move uses the `let` keyword to declare variables. By default, all variables are immutable – once assigned, their values cannot change. This isn't a limitation; it's a feature that prevents entire classes of bugs.

```rust
let immutable_value = 42;
let another_value: u64 = 100;
```

In the first line, Move infers that `immutable_value` is of type `u64` because integer literals default to `u64`. This is Move's most common integer type, perfect for balances, counts, and most numeric operations you'll encounter in blockchain development.

The second line shows explicit type annotation using the colon syntax (`: u64`). While Move's type inference is excellent, explicit annotations are useful when you need a specific type that differs from the default, or when you want to make your intentions crystal clear to other developers.

When you do need mutability, Move requires explicit declaration using the `mut` keyword:

```rust
let mut counter = 0;
counter = counter + 1;

let mut balance = 1000;
balance = balance - 100;
```

The `mut` keyword serves as a bright warning sign: "This value will change!" This explicitness helps prevent bugs because you can immediately see which values might change during execution. In the counter example, we're incrementing a value – a common pattern for tracking iterations or counting events. The balance example shows a typical deduction operation, like you might use when processing a payment.

### Constants: Compile-Time Values

Constants in Move are values known at compile time. They're perfect for configuration values, error codes, and any value that shouldn't change during execution:

```rust
const MAX_SUPPLY: u64 = 1_000_000_000;
const FEE_PERCENTAGE: u8 = 3;
const ERROR_INSUFFICIENT_FUNDS: u64 = 1;
const MINIMUM_STAKE: u64 = 100_000;
```

Constants must follow strict rules:
- They require explicit type annotations (`:u64`, `:u8`, etc.)
- Their names must be in SCREAMING_SNAKE_CASE
- Their values must be computable at compile time
- They're inlined wherever used, not stored in memory

The `MAX_SUPPLY` constant might represent the total supply of a token – using a constant ensures this critical value can never be accidentally modified. `FEE_PERCENTAGE` as a `u8` (0-255) is perfect for percentages since you rarely need values above 100. Error codes like `ERROR_INSUFFICIENT_FUNDS` make your abort conditions self-documenting. When your code aborts with error code 1, developers can immediately see it's due to insufficient funds.

The underscores in large numbers (`1_000_000_000`) are purely for human readability – the compiler ignores them. This feature prevents errors when dealing with large numbers common in blockchain (wei, gwei, token amounts with many decimals).

## Primitive Data Types: The Foundation

Move's type system is deliberately simple yet powerful. Unlike general-purpose languages with dozens of types, Move focuses on what matters for blockchain development.

### Integer Types: Unsigned Only

Move exclusively uses unsigned integers – there are no negative numbers in Move. This design choice eliminates an entire class of underflow bugs and aligns with blockchain's typical use cases:

```rust
let tiny: u8 = 255;
let small: u16 = 65_535;
let medium: u32 = 4_294_967_295;
let large: u64 = 18_446_744_073_709_551_615;
let huge: u128 = 340_282_366_920_938_463_463_374_607_431_768_211_455;
let massive: u256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
```

Each integer type serves specific purposes:

**u8** (0 to 255): Perfect for percentages, small counters, or enum-like values. If you're representing a fee percentage, user level, or any value guaranteed to stay small, `u8` saves space.

**u16** (0 to 65,535): Rarely used in Move, but useful for larger counters or IDs that won't exceed 65k. You might use this for item IDs in a game with a limited catalog.

**u32** (0 to ~4.3 billion): Good for timestamps in seconds (works until year 2106), large counters, or database-style IDs. However, `u64` is usually preferred for future-proofing.

**u64** (0 to ~18.4 quintillion): The workhorse of Move. This is the default type for integer literals and perfect for token amounts, timestamps in milliseconds, and any value that might grow large. Most Aptos framework functions expect `u64`.

**u128** (0 to ~340 undecillion): Essential for intermediate calculations to prevent overflow. When multiplying large `u64` values (like calculating rewards or interest), use `u128` for the intermediate result, then convert back to `u64`.

**u256**: Primarily for cryptographic operations and compatibility with Ethereum-style numbers. Unless you're doing cryptography or bridging from Ethereum, you probably don't need this.

:::tip Choosing the Right Integer Type
- **u8**: Percentages, levels, small enums (0-255)
- **u64**: Token amounts, timestamps, IDs (default choice)
- **u128**: Intermediate calculations to prevent overflow
- **Others**: Rarely needed unless interfacing with external systems
:::

### Boolean Type: True or False

Booleans in Move work exactly as you'd expect, supporting standard logical operations:

```rust
let is_active: bool = true;
let is_paused = false;

let can_withdraw = is_active && !is_paused;
let needs_action = has_expired || is_emergency;
let is_valid = amount > 0 && amount <= max_amount;
```

Boolean logic in Move follows short-circuit evaluation:
- In `&&` (AND) operations, if the first condition is false, the second isn't evaluated
- In `||` (OR) operations, if the first condition is true, the second isn't evaluated

This behavior is crucial for gas efficiency and allows patterns like:
```rust
let safe_check = divisor != 0 && (total / divisor) > threshold;
```

Here, the division only executes if `divisor` is non-zero, preventing a division-by-zero error. The `is_valid` example shows a common pattern for range checking – ensuring a value is positive but within bounds, essential for preventing overflow in financial operations.

### Address Type: Unique to Blockchain

The `address` type is Move's special type for blockchain addresses. Addresses are 32-byte values that identify accounts and modules:

```rust
let fixed_address: address = @0x1;
let marketplace_address = @marketplace;
let user_address = @0x1234567890ABCDEF;

use std::signer;
let sender_address = signer::address_of(account);
```

Address literals (prefixed with `@`) can be written in several forms:
- `@0x1` - Hexadecimal form (0x followed by up to 64 hex characters)
- `@marketplace` - Named address (defined in Move.toml)
- `@0x0000000000000000000000000000000000000000000000000000000000000001` - Full 32-byte form

The `@0x1` address is special – it's where the standard library and framework modules live. When you use `std::vector`, you're actually accessing `0x1::vector`.

Named addresses like `@marketplace` improve code readability and maintainability. They're resolved from your Move.toml file:
```toml
[addresses]
marketplace = "0x5678"
staking = "0x9ABC"
```

## Vectors: Dynamic Collections

Vectors are Move's only built-in collection type – a dynamic array that can grow or shrink. Understanding vectors is crucial because they're everywhere in Move code.

:::info Real-World Usage
See vectors in action in our [Fee Splitter Guide](/guides/fee-splitter) where `vector<Recipient>` stores payment recipients, or in the [Escrow Contract](/guides/escrow) where vectors manage multiple locked funds.
:::

### Creating Vectors

Move provides multiple ways to create vectors, each suited to different scenarios:

```rust
use std::vector;

let empty = vector::empty<u64>();
let with_values = vector[1, 2, 3, 4, 5];
let single_item = vector::singleton(42);
```

The `vector::empty<u64>()` function creates an empty vector that will hold `u64` values. The type parameter `<u64>` is mandatory – Move needs to know what type of elements the vector will contain, even when empty. This is commonly used when you'll be adding elements dynamically.

The vector literal syntax `vector[1, 2, 3, 4, 5]` is syntactic sugar that makes code more readable. Under the hood, Move creates an empty vector and pushes each element. This is perfect for small, known collections like initial configuration values or test data.

`vector::singleton(42)` creates a vector with exactly one element. This is more efficient than `vector[42]` and clearly communicates intent – you want a vector with just one item.

### Vector Operations

Vectors support a rich set of operations for manipulation and querying:

```rust
public fun vector_operations_demo() {
    let mut numbers = vector[10, 20, 30];
    
    vector::push_back(&mut numbers, 40);
    
    let length = vector::length(&numbers);
    
    let first = *vector::borrow(&numbers, 0);
    let last = *vector::borrow(&numbers, length - 1);
    
    let removed = vector::pop_back(&mut numbers);
    
    let contains_20 = vector::contains(&numbers, &20);
}
```

Let's break down each operation:

**push_back**: Adds an element to the end of the vector. This is O(1) amortized time complexity. The `&mut numbers` syntax passes a mutable reference, allowing the function to modify the vector. After this operation, `numbers` is `[10, 20, 30, 40]`.

**length**: Returns the number of elements as a `u64`. This is O(1) – vectors track their length, so this doesn't count elements. Essential for bounds checking and iteration.

**borrow**: Returns an immutable reference to an element at the given index. The `*` dereferences the returned reference to get the actual value. If the index is out of bounds, the transaction aborts. Note that indexing is 0-based, just like most programming languages.

**pop_back**: Removes and returns the last element. This is O(1) and commonly used in stack-like patterns. If the vector is empty, this operation aborts. After popping, `numbers` becomes `[10, 20, 30]`.

**contains**: Searches the vector for a value, returning `true` if found. This is O(n) – it checks each element sequentially. The `&20` syntax creates a reference to the value 20 for comparison.

### Safe Vector Access

Move prevents out-of-bounds access at runtime. This function shows a safe access pattern:

```rust
public fun safe_access(vec: &vector<u64>, index: u64): u64 {
    if (index < vector::length(vec)) {
        *vector::borrow(vec, index)
    } else {
        0
    }
}
```

This pattern is crucial for user-provided indices. Instead of aborting the transaction (and wasting gas), we check bounds first and return a default value for invalid indices. This is especially important in view functions that shouldn't fail.

## Structs and Abilities: Custom Types with Superpowers

Structs are how you define custom data types in Move. What makes Move's structs unique is the ability system – a way to precisely control what operations are allowed on your types.

### Defining Structs

A basic struct definition looks familiar if you've used other languages:

```rust
struct Point {
    x: u64,
    y: u64
}

struct User {
    name: vector<u8>,
    age: u8,
    address: address
}
```

These struct definitions create new types. `Point` might represent a location in a game, with `x` and `y` coordinates. The `User` struct shows a more complex type with mixed field types. Note that `name` is `vector<u8>` – Move doesn't have a built-in string type, so we use byte vectors for text.

Without any abilities, these structs are very limited:
- They can be created within their declaring module
- They can be moved (ownership transfer)
- They cannot be copied
- They cannot be dropped (must be explicitly handled)
- They cannot be stored in global storage

This restrictiveness is a feature! It makes these structs perfect for representing scarce resources.

### The Ability System

Move's abilities are like superpowers you grant to your structs. There are four abilities, each enabling specific operations:

:::tip See Abilities in Action
Our [Fungible Asset Guide](/guides/first-fa) shows how `has store` enables tokens to be stored in wallets, while our [NFT Guide](/guides/first-nft) demonstrates `has key, store` for unique collectibles that can exist independently or in collections.
:::

**copy** - Allows the type to be copied:
```rust
struct Config has copy {
    fee_rate: u8,
    is_paused: bool
}

let config1 = Config { fee_rate: 5, is_paused: false };
let config2 = config1;
```

With the `copy` ability, `config2 = config1` creates a full copy. Both variables now have independent copies of the data. This is perfect for configuration data, settings, or any value that should be freely duplicated.

**drop** - Allows the type to be discarded:
```rust
struct TempData has drop {
    cache: vector<u8>
}

fun use_temp_data() {
    let temp = TempData { cache: vector[] };
}
```

Without `drop`, you'd get a compiler error: "unused value without drop". The `drop` ability tells Move it's safe to discard this value when it goes out of scope. This is essential for temporary values, caches, or any data that doesn't represent a scarce resource.

**store** - Allows the type to be stored in other structs:
```rust
struct Token has store {
    amount: u64
}

struct Wallet has key {
    tokens: vector<Token>
}
```

The `store` ability is required for any type you want to put inside containers (vectors, other structs, or global storage). Without `store`, `Token` couldn't be placed in the `tokens` vector.

**key** - Allows the type to exist in global storage:
```rust
struct Account has key {
    balance: u64,
    sequence_number: u64
}
```

The `key` ability is special – it allows a struct to be a top-level resource in global storage. These structs can be:
- Published to an address with `move_to`
- Read with `borrow_global` or `borrow_global_mut`
- Removed with `move_from`

Only one instance of each `key` struct can exist at each address, making them perfect for representing accounts, profiles, or unique game state.

### Combining Abilities

Real-world structs often need multiple abilities. The combination you choose depends on your use case:

```rust
struct Message has copy, drop {
    text: vector<u8>,
    timestamp: u64
}

struct NFT has key, store {
    id: u64,
    uri: vector<u8>,
    creator: address
}

struct Coin has store {
    value: u64
}
```

**Message** with `copy, drop` is perfect for events or notifications. It can be freely copied (sending the same message to multiple recipients) and dropped (no cleanup needed).

**NFT** with `key, store` can exist as a top-level resource (a standalone NFT at an address) OR be stored in collections (like a vector of NFTs in a gallery).

**Coin** with only `store` is the classic resource pattern. It can't be copied (no duplication of money), can't be dropped (no destroying value), but can be stored in wallets or other containers.

:::success Try It Yourself
Ready to see these patterns in action? Our [NFT Guide](/guides/first-nft) shows exactly how `NFT has key, store` works in practice, while our [Fungible Asset Guide](/guides/first-fa) demonstrates the `Coin has store` pattern for creating your own cryptocurrency.
:::

## References: Borrowing Without Taking

References in Move allow you to access data without taking ownership. This is crucial for reading values or making modifications while keeping the original owner intact.

### Immutable References

Immutable references (using `&`) allow read-only access:

```rust
struct Balance has key {
    amount: u64
}

public fun check_balance(account_addr: address): u64 acquires Balance {
    let balance_ref = borrow_global<Balance>(account_addr);
    balance_ref.amount
}
```

The `borrow_global<Balance>` function returns a reference to the `Balance` stored at `account_addr`. This reference allows us to read the data without removing it from storage. The `acquires Balance` annotation tells Move that this function will access `Balance` resources – this is required for global storage operations and helps prevent reentrancy.

### Mutable References

Mutable references (using `&mut`) allow modification:

```rust
public fun increase_balance(balance: &mut Balance, amount: u64) {
    balance.amount = balance.amount + amount;
}

public fun transfer_between(from: &mut Balance, to: &mut Balance, amount: u64) {
    assert!(from.amount >= amount, ERROR_INSUFFICIENT_FUNDS);
    from.amount = from.amount - amount;
    to.amount = to.amount + amount;
}
```

The `&mut Balance` parameter type indicates this function will modify the balance. Inside the function, we can assign to fields through the reference. This modification affects the original data – there's no copying involved.

:::warning Reference Safety Rules
Move enforces strict rules to prevent data races:
1. You can have either one mutable reference OR any number of immutable references
2. References cannot outlive the data they point to
3. References cannot be stored in structs (unless the struct is never stored)
:::

## Working with Strings and Bytes

Move doesn't have a built-in string type. Instead, it uses byte vectors (`vector<u8>`) with UTF-8 encoding. The standard library provides a String module for convenience:

```rust
use std::string::{Self, String};

public fun string_examples() {
    let hello = string::utf8(b"Hello, Move!");
    
    let mut greeting = string::utf8(b"Hello");
    string::append(&mut greeting, string::utf8(b" World"));
    
    let bytes = string::bytes(&greeting);
    let length = string::length(&greeting);
}
```

The `string::utf8()` function creates a `String` from a byte literal. The `b"Hello, Move!"` syntax creates a byte vector from ASCII text. The function validates that the bytes are valid UTF-8 – if you pass invalid UTF-8, the transaction aborts.

### Byte Vectors and Hex Literals

Move supports several ways to create byte vectors:

```rust
let byte_string = b"Hello";
let hex_data = x"48656C6C6F";
let empty_bytes = vector::empty<u8>();

let address_bytes = x"0000000000000000000000000000000000000000000000000000000000000001";
```

`b"Hello"` creates a byte vector from ASCII text. Each character becomes one byte. This is the most readable format for text data.

`x"48656C6C6F"` creates the same byte vector using hexadecimal. Each pair of hex digits becomes one byte. `48` is 'H', `65` is 'e', etc. This format is perfect for binary data or when you need exact byte values.

## Type Inference: Let Move Figure It Out

Move's type inference is smart enough to figure out types in most situations, making code cleaner and easier to write:

```rust
let inferred = 42;
let also_inferred = vector[1, 2, 3];
let struct_inferred = Point { x: 10, y: 20 };

let explicit: u8 = 42;
let small_number = 42u8;
```

For `inferred`, Move sees the integer literal 42 and assigns it type `u64` (the default). For `also_inferred`, it sees a vector of integer literals and infers `vector<u64>`. For `struct_inferred`, it knows from the field names that this must be a `Point` struct.

Type inference works through function calls too:

```rust
public fun create_pair<T>(first: T, second: T): vector<T> {
    vector[first, second]
}

let numbers = create_pair(10, 20);
let addresses = create_pair(@0x1, @0x2);
```

The generic function `create_pair<T>` works with any type `T`. When called with integers, Move infers `T = u64`. When called with addresses, it infers `T = address`.

## Common Patterns and Best Practices

### Naming Conventions

Move follows Rust-style naming conventions:

```rust
const MAX_SUPPLY: u64 = 1_000_000;
let user_balance = 1000;
struct UserAccount has key { }
fun calculate_fee() { }
```

- Constants: SCREAMING_SNAKE_CASE
- Variables and functions: snake_case  
- Types (structs): PascalCase
- Module names: snake_case

### Early Returns for Cleaner Code

Use early returns to handle edge cases and keep the main logic unindented:

```rust
public fun safe_divide(numerator: u64, denominator: u64): u64 {
    if (denominator == 0) {
        abort ERROR_DIVISION_BY_ZERO
    };
    
    numerator / denominator
}
```

This pattern, called "guard clauses", handles exceptional cases first. The main logic isn't nested in an else block, each condition is independent and clear, and it's easier to add new conditions without restructuring.

### Destructuring for Clarity

Move supports pattern matching and destructuring:

```rust
struct Pair has drop {
    first: u64,
    second: u64
}

public fun sum_pair(pair: Pair): u64 {
    let Pair { first, second } = pair;
    first + second
}
```

Destructuring extracts field values in one statement. The pattern `Pair { first, second }` must match the struct's fields exactly.

## Practice Exercise

:::note Try This: Design a Token System
Create a simple token system with these requirements:
1. A Token struct that represents fungible tokens
2. A Wallet struct that can hold tokens
3. Functions to create, transfer, and check balance

Think about:
- Which abilities does each struct need?
- How to prevent token duplication?
- How to ensure safe transfers?
:::

## Key Takeaways

You now have a solid foundation in Move's syntax and type system. Every concept we've covered serves Move's goal of safe, predictable asset management:

- **Immutability by default** prevents accidental state changes
- **Unsigned integers only** eliminates underflow vulnerabilities  
- **The ability system** gives precise control over resource behavior
- **References** enable efficient access without ownership transfer
- **Type inference** reduces boilerplate while maintaining safety

## What's Next?

In our next article, **[Move Modules: Understanding Modular Programming](/move/modules)**, we'll explore how to organize code into modules, control visibility with public and friend functions, and build larger applications with proper separation of concerns.