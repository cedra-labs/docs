---
title: Conditionals, Loops, and Control Flow
description: Master control flow in Move - from if expressions to loops and pattern matching. Learn how to write efficient, safe control structures while maintaining resource safety.
keywords: [move control flow, conditionals, loops, pattern matching, if expressions, while loops, move programming]
---

# Conditionals, Loops, and Control Flow

Control flow in Move might look familiar if you've used other languages, but it has unique characteristics driven by blockchain requirements. Every conditional must be deterministic, loops must terminate, and pattern matching must be exhaustive. Let's explore how to direct program execution while maintaining Move's safety guarantees.

### Basic If Expressions

In Move, `if` is an expression, not a statement. This means it returns a value, making your code more functional and composable.

```rust
public fun calculate_fee(amount: u64, is_premium: bool): u64 {
    if (is_premium) {
        amount / 100  // 1% fee for premium users
    } else {
        amount / 50   // 2% fee for regular users
    }
}

public fun get_status_message(balance: u64): vector<u8> {
    if (balance == 0) {
        b"Empty account"
    } else if (balance < 100) {
        b"Low balance"
    } else if (balance < 1000) {
        b"Regular account"  
    } else {
        b"High value account"
    }
}
```

Notice the parentheses around conditions – they're required in Move. Also note that both branches of an if-else must return the same type. The compiler enforces this, preventing type mismatches.

Since `if` is an expression, you can use it anywhere a value is expected:

```rust
public fun process_transaction(amount: u64, is_urgent: bool) {
    let fee = if (is_urgent) { amount / 20 } else { amount / 100 };
    let priority = if (is_urgent) { 1 } else { 10 };
    
    // Using if in function arguments
    execute_transfer(
        amount,
        fee,
        if (is_urgent) { b"Urgent" } else { b"Standard" }
    );
}
```

### If Without Else

When an `if` expression doesn't have an `else` branch, it must return unit `()`:

```rust
public fun maybe_update_balance(account: &mut Account, condition: bool, amount: u64) {
    if (condition) {
        account.balance = account.balance + amount;
    };  // Note the semicolon - required when no else branch
}

public fun validate_and_proceed(value: u64) {
    if (value < MIN_VALUE) {
        abort ERROR_TOO_SMALL
    };
    
    if (value > MAX_VALUE) {
        abort ERROR_TOO_LARGE
    };
    
    // Proceed with valid value
    process_value(value);
}
```

The semicolon after the closing brace is crucial when there's no `else` branch and more code follows. This tells Move to treat the `if` as a statement that returns unit, rather than an expression that returns a value.

### Complex Conditions

Move supports standard boolean operators for building complex conditions:

```rust
public fun can_withdraw(account: &Account, amount: u64, is_admin: bool): bool {
    (account.balance >= amount && !account.locked) || is_admin
}

public fun validate_transfer(
    from: &Account,
    to: &Account,
    amount: u64
): bool {
    if (from.balance < amount) {
        false
    } else if (from.locked || to.locked) {
        false
    } else if (amount == 0) {
        false
    } else {
        true
    }
}
```

Move uses short-circuit evaluation for boolean operators. In `a && b`, if `a` is false, `b` is never evaluated. This is not just an optimization – it's a guarantee you can rely on:

```rust
public fun safe_division(numerator: u64, denominator: u64): u64 {
    if (denominator != 0 && numerator / denominator > 10) {
        numerator / denominator
    } else {
        0
    }
}
```

The division `numerator / denominator` only executes if `denominator != 0`, preventing a division-by-zero error.

## Loops: Repetition with Purpose

Let's dive into two loop constructs: `while` for condition-based loops and `loop` for infinite loops with explicit breaks. Both must provably terminate to prevent infinite execution on-chain.

### While Loops

While loops execute as long as their condition is true:

:::tip Real-World Loop Examples
See loops in action:
- [Fee Splitter Distribution](/guides/fee-splitter#35-distribute-fees) - Iterating through recipients to distribute payments
- [Escrow Time Checks](/guides/escrow#remaining_escrow_time) - Calculating remaining lock time
:::

```rust
public fun find_first_empty_slot(slots: &vector<Option<u64>>): u64 {
    let i = 0;
    let len = vector::length(slots);
    
    while (i < len) {
        if (option::is_none(vector::borrow(slots, i))) {
            return i
        };
        i = i + 1;
    };
    
    len  // Return length if no empty slot found
}

public fun calculate_compound_interest(
    principal: u64,
    rate: u64,
    years: u64
): u64 {
    let result = principal;
    let i = 0;
    
    while (i < years) {
        result = (result * (100 + rate)) / 100;
        i = i + 1;
    };
    
    result
}
```

While loops are perfect for counted iterations or searching through collections. The loop condition is checked before each iteration, so if the condition is false initially, the body never executes.

### Loop with Break

The `loop` construct creates an infinite loop that must be exited with `break`:

```rust
public fun find_target_value(values: &vector<u64>, target: u64): Option<u64> {
    let i = 0;
    let len = vector::length(values);
    
    loop {
        if (i >= len) {
            break option::none()
        };
        
        if (*vector::borrow(values, i) == target) {
            break option::some(i)
        };
        
        i = i + 1;
    }
}

```

The `loop` construct is useful when the exit condition is complex or appears in the middle of the loop logic. The `break` expression can return a value, which becomes the value of the entire loop expression.

### Continue in Loops

Move supports `continue` to skip to the next iteration:

```rust
public fun process_valid_items(items: &vector<Item>): u64 {
    let processed = 0;
    let i = 0;
    let len = vector::length(items);
    
    while (i < len) {
        let item = vector::borrow(items, i);
        
        if (!is_valid(item)) {
            i = i + 1;
            continue
        };
        
        if (item.value < MIN_VALUE) {
            i = i + 1;
            continue
        };
        
        // Process valid item
        process_item(item);
        processed = processed + 1;
        
        i = i + 1;
    };
    
    processed
}
```

The `continue` expression jumps to the loop condition check (in `while`) or the beginning (in `loop`). It's useful for skipping iterations based on conditions without deeply nesting your code.

:::warning Loop Termination
Move requires that all loops must provably terminate. This means:
- No truly infinite loops
- Loop bounds must be deterministic
- The compiler must be able to verify termination

This prevents infinite execution that would consume unlimited gas.
:::

## Pattern Matching and Destructuring

Pattern matching in Move allows you to extract values from structs and handle different cases elegantly.

### Struct Destructuring

```rust
struct Point has drop {
    x: u64,
    y: u64
}

public fun distance_from_origin(point: Point): u64 {
    let Point { x, y } = point;
    // Simple approximation for example
    x + y
}

public fun process_point(point: Point) {
    let Point { x: x_coord, y: y_coord } = point;
    // Renamed during destructuring
    if (x_coord > y_coord) {
        handle_x_dominant(x_coord, y_coord);
    } else {
        handle_y_dominant(x_coord, y_coord);
    }
}
```

Destructuring extracts all fields at once. You can rename fields during destructuring using the `field: new_name` syntax. This is particularly useful when field names would conflict with existing variables.

### Destructuring with Resources

Resource destructuring requires special care because resources can't be dropped:

```rust
struct Wallet has store {
    coins: u64,
    locked: bool
}

public fun extract_coins(wallet: Wallet): u64 {
    let Wallet { coins, locked } = wallet;
    assert!(!locked, ERROR_WALLET_LOCKED);
    coins
}

public fun split_wallet(wallet: Wallet): (Wallet, Wallet) {
    let Wallet { coins, locked } = wallet;
    let half = coins / 2;
    
    (
        Wallet { coins: half, locked },
        Wallet { coins: coins - half, locked }
    )
}
```

When you destructure a resource, you must use all its fields to create new resources or explicitly handle them. The original resource is destroyed in the process.

### Nested Destructuring

You can destructure nested structures in a single pattern:

```rust
struct Inner has drop {
    value: u64
}

struct Outer has drop {
    inner: Inner,
    multiplier: u64
}

public fun calculate_total(outer: Outer): u64 {
    let Outer { 
        inner: Inner { value }, 
        multiplier 
    } = outer;
    
    value * multiplier
}
```

This extracts both the outer struct's fields and the inner struct's fields in one expression. It's more concise than multiple destructuring steps.

## Control Flow Patterns

Certain control flow patterns appear frequently in Move programs. Understanding these helps you write cleaner, more maintainable code.

### Early Return Pattern

Use early returns to handle edge cases and reduce nesting:

:::success Pattern in Practice
The [Escrow Contract](/guides/escrow#step-3-releasing-funds) uses early returns extensively in its validation logic. The [NFT minting function](/guides/first-nft#3-creator-gated-mint) also demonstrates this pattern with its creator check.
:::

```rust
public fun complex_validation(account: &Account, amount: u64, recipient: address): bool {
    // Check each condition and return early if invalid
    if (account.locked) {
        return false
    };
    
    if (account.balance < amount) {
        return false
    };
    
    if (amount < MIN_TRANSFER_AMOUNT) {
        return false
    };
    
    if (is_blacklisted(recipient)) {
        return false
    };
    
    // All validations passed
    true
}
```

Instead of deeply nested if-else chains, each condition that would make the operation invalid causes an early return. This keeps the code flat and makes the logic easier to follow.

### Guard Clause Pattern

Similar to early returns but typically used with `abort`:

```rust
public fun execute_privileged_action(
    account: &signer,
    action: u64,
    target: address
) {
    // Guards first
    assert!(signer::address_of(account) == @admin, ERROR_NOT_ADMIN);
    assert!(action < MAX_ACTION_ID, ERROR_INVALID_ACTION);
    assert!(exists<Account>(target), ERROR_ACCOUNT_NOT_FOUND);
    
    // Main logic with all preconditions met
    match (action) {
        0 => freeze_account(target),
        1 => unfreeze_account(target),
        2 => reset_account(target),
        _ => abort ERROR_UNKNOWN_ACTION
    }
}
```

Guards establish preconditions at the function's start. If any condition fails, the function aborts immediately. This pattern makes preconditions explicit and keeps the main logic uncluttered.

### State Machine Pattern

Use control flow to implement state transitions:

```rust
module order::state_machine {
    const STATE_PENDING: u8 = 0;
    const STATE_CONFIRMED: u8 = 1;
    const STATE_SHIPPED: u8 = 2;
    const STATE_DELIVERED: u8 = 3;
    const STATE_CANCELLED: u8 = 4;
    
    struct Order has key {
        state: u8,
        value: u64,
        customer: address
    }
    
    public fun transition_order(order: &mut Order, new_state: u8) {
        let current = order.state;
        
        // Validate state transition
        if (current == STATE_PENDING) {
            assert!(
                new_state == STATE_CONFIRMED || new_state == STATE_CANCELLED,
                ERROR_INVALID_TRANSITION
            );
        } else if (current == STATE_CONFIRMED) {
            assert!(
                new_state == STATE_SHIPPED || new_state == STATE_CANCELLED,
                ERROR_INVALID_TRANSITION
            );
        } else if (current == STATE_SHIPPED) {
            assert!(new_state == STATE_DELIVERED, ERROR_INVALID_TRANSITION);
        } else {
            abort ERROR_TERMINAL_STATE
        };
        
        order.state = new_state;
        emit_state_change_event(current, new_state);
    }
}
```

This pattern ensures only valid state transitions occur. The control flow explicitly encodes the state machine's rules, making invalid transitions impossible.

<details>
<summary>📚 Advanced Control Flow Patterns</summary>

**Retry Pattern with Exponential Backoff**
```rust
public fun retry_with_backoff(max_attempts: u64): bool {
    let attempt = 0;
    let delay = 1;
    
    loop {
        if (attempt >= max_attempts) {
            break false
        };
        
        if (try_operation()) {
            break true
        };
        
        wait(delay);
        delay = delay * 2;
        attempt = attempt + 1;
    }
}
```

**Circuit Breaker Pattern**
```rust
struct CircuitBreaker has key {
    failures: u64,
    last_failure_time: u64,
    state: u8,  // 0: closed, 1: open, 2: half-open
}

public fun call_with_breaker(breaker: &mut CircuitBreaker): bool {
    if (breaker.state == 1) {  // Open
        if (timestamp::now_seconds() - breaker.last_failure_time > RECOVERY_TIME) {
            breaker.state = 2;  // Try half-open
        } else {
            return false
        }
    };
    
    let success = try_operation();
    
    if (success) {
        breaker.failures = 0;
        breaker.state = 0;  // Close
    } else {
        breaker.failures = breaker.failures + 1;
        breaker.last_failure_time = timestamp::now_seconds();
        
        if (breaker.failures >= FAILURE_THRESHOLD) {
            breaker.state = 1;  // Open
        }
    };
    
    success
}
```

</details>

## Best Practices for Control Flow

### Keep Conditions Simple

Break complex conditions into named variables:

```rust
// ❌ Hard to read
if ((balance >= amount && !locked) || (is_admin && override_enabled) || emergency_mode) {
    // ...
}

// ✅ Clear and maintainable
let has_sufficient_balance = balance >= amount && !locked;
let has_admin_override = is_admin && override_enabled;
let can_proceed = has_sufficient_balance || has_admin_override || emergency_mode;

if (can_proceed) {
    // ...
}
```

Named conditions make your code self-documenting and easier to debug.

### Avoid Deep Nesting

Flatten your control flow when possible:

```rust
// ❌ Deeply nested
public fun process_request(request: &Request): u64 {
    if (is_valid(request)) {
        if (has_permission(request.sender)) {
            if (check_limits(request.amount)) {
                if (!is_duplicate(request)) {
                    return execute(request)
                } else {
                    abort ERROR_DUPLICATE
                }
            } else {
                abort ERROR_EXCEEDS_LIMITS
            }
        } else {
            abort ERROR_NO_PERMISSION
        }
    } else {
        abort ERROR_INVALID_REQUEST
    }
}

// ✅ Flat with early exits
public fun process_request(request: &Request): u64 {
    assert!(is_valid(request), ERROR_INVALID_REQUEST);
    assert!(has_permission(request.sender), ERROR_NO_PERMISSION);
    assert!(check_limits(request.amount), ERROR_EXCEEDS_LIMITS);
    assert!(!is_duplicate(request), ERROR_DUPLICATE);
    
    execute(request)
}
```

### Loop Invariants

Design loops with clear invariants:

```rust
public fun binary_search(sorted_vec: &vector<u64>, target: u64): Option<u64> {
    let left = 0;
    let right = vector::length(sorted_vec);
    
    while (left < right) {
        // Invariant: target, if present, is in [left, right)
        let mid = (left + right) / 2;
        let mid_val = *vector::borrow(sorted_vec, mid);
        
        if (mid_val == target) {
            return option::some(mid)
        } else if (mid_val < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    };
    
    option::none()
}
```

Clear invariants make loops easier to understand and verify correct.

:::tip Control Flow Guidelines
1. **Prefer expressions over statements**: Use if-else as expressions when possible
2. **Exit early**: Handle error cases first with early returns or aborts
3. **Keep loops simple**: Complex loop logic often indicates a need for helper functions
4. **Make state transitions explicit**: Use clear patterns for state machines
5. **Document non-obvious flow**: Comment why, not what
:::

## Key Takeaways

Control flow in Move balances familiar constructs with blockchain-specific requirements:

- **Everything is deterministic**: No randomness or external inputs in conditions
- **Loops must terminate**: The compiler verifies this to prevent infinite execution
- **Pattern matching is exhaustive**: All cases must be handled
- **Early exits are idiomatic**: Guard clauses and early returns improve readability
- **Resource safety is maintained**: Control flow respects Move's ownership rules

Understanding these patterns helps you write efficient, safe code that clearly expresses your intent.

## What's Next?

In our next article, **[Error Handling and Assertions in Move](/move/errors)**, we'll explore how to handle failures gracefully. You'll learn about Move's abort codes, assertion patterns, and strategies for building robust error handling into your modules.