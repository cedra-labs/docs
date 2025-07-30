# Building Your First Counter Smart Contract

Welcome to your first Move smart contract on Cedra! In this tutorial, you'll learn how to create, compile, test, and deploy a simple counter contract that demonstrates the fundamental concepts of Move programming.

## 📋 Prerequisites

Before we start, make sure you have:
- [Cedra CLI installed](/getting-started/cli)
- [A configured Cedra account](/cli/usage#1-initial-configuration)
- [Basic understanding of blockchain concepts](/handbook-for-newcomers.md)

## 🚀 Step 1: Create a New Move Project

First, let's create a new Move project for our counter contract:

```bash
mkdir counter-project
cd counter-project
cedra move init --name counter
```

This creates a new Move package with the following structure:
```
counter-project/
├── Move.toml
└── sources/
```

### Update Move.toml

Before writing our contract, we need to setup counter address in the `Move.toml`:

```toml
...

[addresses]
counter = "YOUR_ACCOUNT_ADDRESS"

...
```

## 📝 Step 2: Write the Counter Contract

Create a new file `sources/counter.move` with the following content:

```rust
module counter::simple_counter {
    use std::signer;
    
    /// The counter resource that will be stored in each account
    struct Counter has key {
        value: u64,
    }
    
    /// Error codes
    const E_COUNTER_NOT_EXISTS: u64 = 1;
    
    /// Initialize a counter for the given account with value 0
    public entry fun initialize(account: &signer) {
        let counter = Counter { value: 0 };
        move_to(account, counter);
    }
    
    /// Increment the counter by 1
    public entry fun increment(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(account_addr);
        counter.value = counter.value + 1;
    }
    
    /// Decrement the counter by 1 (with underflow protection)
    public entry fun decrement(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(account_addr);
        if (counter.value > 0) {
            counter.value = counter.value - 1;
        };
    }
    
    #[view]
    /// Get the current counter value (read-only)
    public fun get_count(account_addr: address): u64 acquires Counter {
        assert!(exists<Counter>(account_addr), E_COUNTER_NOT_EXISTS);
        let counter = borrow_global<Counter>(account_addr);
        counter.value
    }
    
    /// Reset the counter to 0
    public entry fun reset(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), E_COUNTER_NOT_EXISTS);
        
        let counter = borrow_global_mut<Counter>(account_addr);
        counter.value = 0;
    }
}
```

## 🧪 Step 3: Add Tests

Let's add comprehensive tests to our contract. Add the following test functions to your `tests/counter.move` file:

```rust
#[test_only]
module counter::counter_tests {
    use std::signer;
    use counter::simple_counter;
    
    #[test(account = @0x1)]
    public fun test_initialize_and_get_count(account: &signer) {
        simple_counter::initialize(account);
        let count = simple_counter::get_count(signer::address_of(account));
        assert!(count == 0, 1);
    }
    
    #[test(account = @0x1)]
    public fun test_increment(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::increment(account);
        simple_counter::increment(account);
        
        let count = simple_counter::get_count(signer::address_of(account));
        assert!(count == 2, 2);
    }
    
    #[test(account = @0x1)]
    public fun test_decrement(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::increment(account);
        simple_counter::increment(account);
        simple_counter::decrement(account);
        
        let count = simple_counter::get_count(signer::address_of(account));
        assert!(count == 1, 3);
    }
    
    #[test(account = @0x1)]
    public fun test_reset(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::increment(account);
        simple_counter::reset(account);
        
        let count = simple_counter::get_count(signer::address_of(account));
        assert!(count == 0, 4);
    }
    
    #[test(account = @0x1)]
    public fun test_decrement_underflow_protection(account: &signer) {
        simple_counter::initialize(account);
        simple_counter::decrement(account); // Should not panic, just stay at 0
        
        let count = simple_counter::get_count(signer::address_of(account));
        assert!(count == 0, 5);
    }
}
```

## 🔨 Step 4: Compile and Test

Now let's compile and test our contract:

```bash
# Navigate to the counter directory
cd counter-project

# Compile the contract
cedra move compile

# Run the tests
cedra move test
```

You should see output indicating that all tests passed! ✅

## 🚀 Step 5: Deploy to Testnet

Time to deploy our counter to Cedra testnet:

```bash
cedra move publish
```

When prompted, type `yes` to confirm the transaction.

## 🎮 Step 6: Interact with Your Contract

Once deployed, let's interact with our counter, and don't forget to use *module address* instead of *default*:

### Initialize the Counter

```bash
cedra move run --function-id default::simple_counter::initialize
```

### Increment the Counter

```bash
cedra move run --function-id default::simple_counter::increment
```

### Check the Current Value

```bash
cedra move view --function-id default::simple_counter::get_count --args address:default
```

### Increment a Few More Times

```bash
cedra move run --function-id default::simple_counter::increment
cedra move run --function-id default::simple_counter::increment
```

### Check the Value Again

```bash
cedra move view --function-id default::simple_counter::get_count --args address:default
```

You should see the counter value increasing! 🎉

## 🧠 Understanding the Code

Let's break down the key concepts:

### Resources (`struct Counter has key`)
- Resources are Move's way of representing digital assets
- The `key` ability allows the struct to be stored at the top level of an account
- Our `Counter` resource holds a single `u64` value

### Entry Functions (`public entry fun`)
- Entry functions can be called directly from transactions
- They're the public interface of your smart contract

### Acquires (`acquires Counter`)
- Functions that read from or modify global storage must declare what they access
- This helps Move's type system prevent many common bugs

### Global Storage Operations
- `move_to()`: Store a resource in an account
- `borrow_global()`: Read from global storage
- `borrow_global_mut()`: Modify global storage
- `exists<T>()`: Check if a resource exists

### View Functions (`#[view]`)
- View functions are read-only and don't modify state
- They can be called without creating a transaction

## 🎨 Next Steps

Congratulations! You've built your first Move smart contract on Cedra. Here are some ideas to extend your counter:

1. **Add a step parameter** - Allow incrementing/decrementing by custom amounts
2. **Multiple counters** - Store multiple named counters in one resource  
3. **Access controls** - Add admin functions or ownership features
4. **Events** - Emit events when the counter changes
5. **Counter factory** - Create a system for multiple independent counters

## 📚 Additional Resources

- [Real World Guides](/real-world-guides)
- [Cedra CLI Usage Guide](/cli/usage)
- [Move Language Documentation](https://move-language.github.io/move/)



:::tip What's Next?
Ready to build something more complex? Check out our [Fungible Asset Guide](/guides/first-fa) to learn about creating tokens on Cedra! 🪙
::: 