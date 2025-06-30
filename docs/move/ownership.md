---
title: Move Ownership and Borrowing
description: Master Move's ownership system and borrowing rules. Learn how references enable efficient access to resources without taking ownership, and discover patterns for safe resource manipulation.
keywords: [move ownership, borrowing, references, mutable references, resource access, move programming]
---

# Move Ownership and Borrowing

In Move, every value has exactly one owner at any given time. When you create a value, you own it. When you pass it to a function or assign it to another variable, ownership transfers. This isn't just a convention – it's enforced by the compiler.

```rust
struct Token has store {
    amount: u64
}

public fun demonstrate_ownership() {
    let token = Token { amount: 100 };  // 'token' owns the Token
    let my_token = token;               // Ownership moves to 'my_token'
    // Can't use 'token' anymore - it no longer owns anything
}
```

After the assignment `my_token = token`, the original `token` variable is no longer valid. This isn't a copy – it's a move. The Token resource physically moves from one owner to another. If you try to use `token` after the move, the compiler will stop you with an error like "use of moved value".

This ownership model solves a fundamental problem in resource management: how do you ensure a resource exists in exactly one place? By making ownership exclusive and transfers explicit, Move eliminates entire categories of bugs like double-spending or resource leaks.

## References: Borrowing Without Taking

While ownership transfer is powerful, sometimes you need to access data without taking ownership. This is where references come in. References let you borrow access to a value without becoming its owner.

### Immutable References (&T)

An immutable reference gives you read-only access to a value. You can look but not touch:

```rust
struct Account has key {
    balance: u64,
    locked: bool
}

public fun check_account_status(account: &Account): (u64, bool) {
    (account.balance, account.locked)
}

public fun is_account_valid(account: &Account): bool {
    account.balance >= 100 && !account.locked
}
```

The `&Account` parameter type means the function borrows the account for reading. The function can access all fields of the account but cannot modify them. When the function returns, the borrow ends and the original owner still has their account.

Multiple functions can hold immutable references to the same value simultaneously. This is safe because no one can modify the data – there's no risk of one function seeing inconsistent state caused by another.

### Creating References

You create references using the `&` operator:

```rust
public fun reference_examples() {
    let account = Account { balance: 1000, locked: false };
    
    let balance_ref = &account.balance;     // Reference to a field
    let account_ref = &account;             // Reference to the whole struct
    
    let balance_copy = *balance_ref;        // Dereference to get the value
    let is_valid = check_validity(account_ref);
}
```

The `&` operator creates a reference without transferring ownership. The original `account` variable remains valid and owns the Account. References are lightweight – they're just pointers to the original data, not copies.

To get the value from a reference, you use the dereference operator `*`. However, Move often does this automatically for field access, so `account_ref.balance` works without explicit dereferencing.

### Mutable References (&mut T)

Mutable references allow you to modify borrowed values:

```rust
public fun deposit(account: &mut Account, amount: u64) {
    account.balance = account.balance + amount;
}

public fun lock_account(account: &mut Account) {
    account.locked = true;
}

public fun process_transaction(account: &mut Account, amount: u64) {
    assert!(!account.locked, ERROR_ACCOUNT_LOCKED);
    assert!(account.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
    
    account.balance = account.balance - amount;
}
```

The `&mut Account` parameter type creates a mutable borrow. The function can read and modify the account. Changes made through the reference affect the original value – there's no copying involved.

Mutable references are exclusive. While a mutable reference exists, no other references (mutable or immutable) can exist to the same value. This exclusivity prevents data races and ensures consistency.

## Borrowing Rules: Safety Through Restrictions

Move enforces strict rules about references to ensure memory safety and prevent data races. These rules are checked at compile time – if your code compiles, it's safe.

### Rule 1: Exclusive Mutable Access

You can have either one mutable reference OR any number of immutable references, never both:

```rust
public fun invalid_borrows() {
    let mut account = Account { balance: 1000, locked: false };
    
    let ref1 = &account;           // OK: First immutable reference
    let ref2 = &account;           // OK: Multiple immutable references
    
    let mut_ref = &mut account;    // ERROR: Can't create mutable while immutable exist
}

public fun valid_borrows() {
    let mut account = Account { balance: 1000, locked: false };
    
    let balance = {
        let account_ref = &account;
        account_ref.balance         // Immutable borrow ends here
    };
    
    let mut_ref = &mut account;    // OK: No other references exist
    mut_ref.balance = 2000;
}
```

This rule prevents confusion about what value a reference sees. If both mutable and immutable references existed simultaneously, immutable references might see values change unexpectedly, breaking assumptions and causing bugs.

### Rule 2: References Cannot Outlive Their Data

References must not exist longer than the values they reference:

```rust
struct Container has drop {
    value: u64
}

// This won't compile
public fun invalid_lifetime(): &u64 {
    let container = Container { value: 42 };
    &container.value  // ERROR: Reference would outlive container
}

// This is valid
public fun valid_lifetime(container: &Container): &u64 {
    &container.value  // OK: Reference lifetime tied to parameter
}
```

This rule prevents dangling references – pointers to memory that has been freed. In the invalid example, `container` would be dropped at the end of the function, but we're trying to return a reference to its field. The compiler catches this and prevents undefined behavior.

### Rule 3: Reference Restrictions in Structs

Structs can only store references if they will never be stored themselves:

```rust
// This won't compile
struct Invalid has store {
    reference: &u64  // ERROR: Can't store references in storable structs
}

// This is valid during execution but can't be stored
struct Temporary {
    reference: &u64  // OK: Struct has no abilities
}
```

This restriction ensures that references don't escape their intended lifetime. Since structs with `store` or `key` abilities can be saved to global storage or put in containers, allowing them to contain references would violate lifetime rules.

:::warning Reference Safety
Move's reference rules might seem restrictive, but they eliminate entire categories of bugs:
- No null pointer dereferences
- No use-after-free errors  
- No data races
- No dangling references

These guarantees come at compile time with zero runtime cost!
:::

## Global Storage Borrowing

Move provides special functions for borrowing from global storage, where resources live at addresses:

:::tip See It in Practice
Our guides use global storage extensively:
- [FA Token Storage](/guides/first-fa#211-init_module---bootstrap) - How tokens are stored using `move_to`
- [Escrow Lockup Management](/guides/escrow#step-1-creating-a-lockup) - Complex borrowing patterns with `borrow_global_mut`
- [NFT Collection Access](/guides/first-nft#63-get-collection-metadata) - Safe reading with `borrow_global`
:::

```rust
struct Vault has key {
    coins: u64,
    admin: address
}

public fun read_vault(vault_address: address): u64 acquires Vault {
    let vault = borrow_global<Vault>(vault_address);
    vault.coins
}

public fun add_to_vault(vault_address: address, amount: u64) acquires Vault {
    let vault = borrow_global_mut<Vault>(vault_address);
    vault.coins = vault.coins + amount;
}

public fun complex_vault_operation(
    vault_address: address,
    new_admin: address
) acquires Vault {
    let vault = borrow_global_mut<Vault>(vault_address);
    
    // Multiple operations on the same borrow
    assert!(vault.admin == @admin, ERROR_NOT_ADMIN);
    vault.admin = new_admin;
    vault.coins = vault.coins + 100; // Admin change bonus
}
```

The `borrow_global<T>` function returns an immutable reference to the T resource stored at the given address. Similarly, `borrow_global_mut<T>` returns a mutable reference. These borrows last for the current function scope.

The `acquires` annotation is crucial here. It tells Move which resources this function might access from global storage. This information helps prevent reentrancy and makes resource access explicit. If you forget the `acquires` annotation, the compiler will remind you.

## Borrowing Patterns and Best Practices

Understanding common patterns helps you write efficient, safe code that makes the most of Move's borrowing system. Structure your code to minimize borrow conflicts:

```rust
public fun update_multiple_fields(account: &mut Account, new_balance: u64) {
    // Don't do this - multiple borrows of same struct
    let balance_ref = &mut account.balance;
    let locked_ref = &mut account.locked;
    
    // Do this - single borrow, multiple updates
    account.balance = new_balance;
    account.locked = new_balance < 100;
}

public fun process_accounts(account1: &mut Account, account2: &mut Account) {
    // Can borrow multiple different values mutably
    account1.balance = account1.balance - 100;
    account2.balance = account2.balance + 100;
}
```

Instead of creating multiple references to fields of the same struct, use a single reference to the struct and access fields through it. This avoids borrow checker conflicts and is often more efficient.

### The Read-Then-Write Pattern

When you need to read a value before modifying it, structure the borrows carefully:

```rust
public fun double_if_greater(
    account: &mut Account,
    threshold: u64
) {
    let should_double = {
        let balance = &account.balance;  // Immutable borrow
        *balance > threshold
    };  // Immutable borrow ends here
    
    if (should_double) {
        account.balance = account.balance * 2;  // Mutable borrow
    }
}
```

By using a block expression, we limit the scope of the immutable borrow. Once the block ends, we can create a mutable borrow. This pattern is useful when you need to make decisions based on current state before modifying it.

### The Helper Function Pattern

Break complex operations into smaller functions that take references:

```rust
fun validate_transfer(from: &Account, to: &Account, amount: u64) {
    assert!(!from.locked, ERROR_SENDER_LOCKED);
    assert!(!to.locked, ERROR_RECIPIENT_LOCKED);
    assert!(from.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
}

fun execute_transfer(from: &mut Account, to: &mut Account, amount: u64) {
    from.balance = from.balance - amount;
    to.balance = to.balance + amount;
}

public fun safe_transfer(
    from: &mut Account,
    to: &mut Account,
    amount: u64
) {
    // First validate with immutable borrows
    validate_transfer(from, to, amount);
    
    // Then execute with mutable borrows
    execute_transfer(from, to, amount);
}
```

This pattern separates validation (needs only immutable references) from mutation (needs mutable references). It makes code more modular and easier to test.

### The Field Extraction Pattern

Sometimes it's cleaner to extract fields rather than passing references:

:::info Pattern Usage
The [Fee Splitter](/guides/fee-splitter#35-distribute-fees) shows this pattern when iterating through recipients - it extracts values from the struct rather than passing multiple references around.
:::

```rust
struct ComplexData has drop {
    values: vector<u64>,
    metadata: vector<u8>
}

// Instead of passing references to internal fields
fun process_with_refs(values: &vector<u64>, metadata: &vector<u8>) {
    // Process...
}

// Consider extracting if ownership allows
fun process_with_values(data: ComplexData) {
    let ComplexData { values, metadata } = data;
    // Now you own values and metadata directly
}
```

If you're going to consume the data anyway, taking ownership and destructuring can be cleaner than managing multiple references.

<details>
<summary>📘 Advanced Borrowing Patterns</summary>

**Conditional Borrowing**: Borrow only when needed
```rust
public fun maybe_update(account: &mut Account, should_update: bool, amount: u64) {
    if (should_update) {
        account.balance = account.balance + amount;
    }
    // No borrow conflict when should_update is false
}
```

**Scoped Borrowing**: Use blocks to limit borrow scope
```rust
public fun complex_operation(account: &mut Account) {
    let old_balance = account.balance;
    
    {
        let temp_ref = &account.locked;
        // Use temp_ref here
    }  // Borrow ends
    
    account.balance = calculate_new_balance(old_balance);
}
```

</details>
## Common Pitfalls and Solutions

### Attempting to Return References

```rust
// ❌ Wrong - trying to return a reference
public fun get_balance_ref(addr: address): &u64 acquires Account {
    let account = borrow_global<Account>(addr);
    &account.balance  // ERROR: Reference would outlive borrow
}

// ✅ Correct - return the value
public fun get_balance(addr: address): u64 acquires Account {
    let account = borrow_global<Account>(addr);
    account.balance  // Copy the value
}
```

References cannot escape the function where they're created. If you need to return data, return a copy of the value, not a reference to it.

### Conflicting Borrows

```rust
// ❌ Wrong - conflicting borrows
public fun transfer_bad(from: &mut Account, to: &mut Account, amount: u64) {
    let from_ref = &from.balance;  // Immutable borrow of from
    to.balance = to.balance + amount;
    
    if (*from_ref >= amount) {  // Still using immutable borrow
        from.balance = from.balance - amount;  // ERROR: Can't mutably borrow
    }
}

// ✅ Correct - complete operations sequentially  
public fun transfer_good(from: &mut Account, to: &mut Account, amount: u64) {
    assert!(from.balance >= amount, ERROR_INSUFFICIENT_FUNDS);
    from.balance = from.balance - amount;
    to.balance = to.balance + amount;
}
```

Avoid creating references that you'll need to violate later. Structure your code to complete operations with one type of borrow before needing another.

:::tip Borrow Checker Wisdom
When fighting the borrow checker, ask yourself:
1. Do I really need this reference, or can I copy the value?
2. Can I restructure to avoid overlapping borrows?
3. Would smaller functions with clearer borrowing patterns help?
4. Am I trying to do too much in one function?
:::

## Key Takeaways

Move's ownership and borrowing system provides safety without sacrificing performance:

- **Single ownership**: Each value has exactly one owner
- **Explicit transfers**: Ownership moves are visible in code
- **Safe borrowing**: References allow access without ownership
- **Compile-time safety**: No runtime overhead for these guarantees
- **Clear patterns**: Consistent approaches to common scenarios

The borrow checker might seem strict at first, but it's catching real bugs. Every error it reports represents a potential runtime failure in other languages.

## What's Next?

In our next article, **[Conditionals, Loops, and Control Flow](/move/flow)**, we'll explore how to control program execution in Move. You'll learn about if expressions, loops, pattern matching, and how to write efficient control flow while maintaining resource safety.