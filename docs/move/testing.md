# Move Unit Testing

Unit testing is essential for Move smart contracts where bugs can lead to significant financial losses. Move provides three test annotations that are excluded from compiled bytecode unless compiled for testing.

:::tip Prerequisites
Before writing tests, ensure you have:
- ✅ [Cedra CLI installed](/getting-started/cli)
- ✅ [Basic Move knowledge](/move/basics)
- ✅ [Understanding of modules](/move/modules)
:::

The simplest way to create a test is with the `#[test]` annotation. Any function marked with this attribute becomes a test case that runs when you execute `cedra move test`:

```rust
module 0x42::example {
    #[test]
    fun this_is_a_test() {
        // Test logic here
    }
}
```

Often you'll need code that only exists for testing purposes - helper functions, mock data structures, or debug imports. The `#[test_only]` annotation marks code that should be excluded from production bytecode. You can apply it to entire modules, individual functions, structs, or even use statements:

```rust
#[test_only]
module 0x42::test_helpers {
    // This entire module only exists during testing
}

module 0x42::my_module {
    #[test_only]
    use std::debug;

    #[test_only]
    struct TestStruct { value: u64 }

    #[test_only]
    fun helper_function(): u64 { 42 }
}
```

## Testing Expected Failures

Sometimes you need to verify that your code fails correctly. The `#[expected_failure]` annotation lets you test that a function aborts under specific conditions:

```rust
#[test]
#[expected_failure(abort_code = 0, location = Self)]
fun test_zero_coin_fails() {
    let coin = MyCoin { value: 0 };
    make_sure_non_zero_coin(coin);
}
```

This test passes only if the function aborts with code `0` from the current module (`Self`). You can also test for failures from other modules using `location = other::module`, or test for specific error types like `arithmetic_error` for overflow/underflow, `vector_error` with `minor_status = 1` for index out of bounds, or `out_of_gas` for gas exhaustion.

## Working with Signers

Most Move functions that modify state require a `signer` argument. You can inject test signers directly in the test annotation:

```rust
#[test(a = @0x1, b = @0x2)]
fun test_with_signers(a: signer, b: signer) {
    publish_coin(&a);
    assert!(has_coin(@0x1), 0);
}
```

The annotation creates signer values for each specified address, which are then passed to the test function as arguments. Named addresses from your `Move.toml` work too:

```rust
#[test(admin = @admin)]
fun test_admin_only(admin: signer) {
    // admin signer is bound to the 'admin' named address
}
```

## Running Tests

Run all tests in your package with:

```bash
cedra move test
```

You'll see output showing which tests passed or failed:

```
Running Move unit tests
[ PASS    ] 0x42::my_module::make_sure_non_zero_coin_passes
[ PASS    ] 0x42::my_module::make_sure_zero_coin_fails
[ PASS    ] 0x42::my_module::test_has_coin
Test result: OK. Total tests: 3; passed: 3; failed: 0
```

To run only specific tests, use the filter flag. This runs any test containing "zero_coin" in its name:

```bash
cedra move test -f zero_coin
```

For code coverage information, add the `--coverage` flag and then run `cedra move coverage` for a detailed breakdown. Other useful flags include `--gas-limit` to set gas limits per test and `-v` for verbose output.

## Complete Example

Here's a full module demonstrating all the testing concepts together:

```rust
module 0x1::my_module {
    struct MyCoin has key { value: u64 }

    const E_ZERO_COIN: u64 = 0;

    public fun make_sure_non_zero_coin(coin: MyCoin): MyCoin {
        assert!(coin.value > 0, E_ZERO_COIN);
        coin
    }

    public fun has_coin(addr: address): bool {
        exists<MyCoin>(addr)
    }

    // ========== Tests ==========

    #[test]
    fun make_sure_non_zero_coin_passes() {
        let coin = MyCoin { value: 1 };
        let MyCoin { value: _ } = make_sure_non_zero_coin(coin);
    }

    #[test]
    #[expected_failure(abort_code = E_ZERO_COIN, location = Self)]
    fun make_sure_zero_coin_fails() {
        let coin = MyCoin { value: 0 };
        let MyCoin { value: _ } = make_sure_non_zero_coin(coin);
    }

    #[test_only]
    fun publish_coin(account: &signer) {
        move_to(account, MyCoin { value: 1 })
    }

    #[test(a = @0x1, b = @0x2)]
    fun test_has_coin(a: signer, b: signer) {
        publish_coin(&a);
        publish_coin(&b);
        assert!(has_coin(@0x1), 0);
        assert!(has_coin(@0x2), 1);
        assert!(!has_coin(@0x3), 1);
    }
}
```

## Organizing Your Tests

Tests can live in the same file as your production code (convenient for small modules) or in a separate `tests/` directory (better for larger projects):

```
my_project/
├── Move.toml
├── sources/
│   └── my_module.move      # Can include inline tests
└── tests/
    └── my_module_tests.move  # Or separate test files
```

For naming, use `test_` prefix for test functions (like `test_increment`), add `_fails` suffix for expected failures (like `test_zero_balance_fails`), and name test files as `<module>_tests.move`.

## Best Practices

Structure your tests using the **Arrange → Act → Assert** pattern. First set up the test state, then perform the action you're testing, and finally verify the results:

```rust
#[test(account = @0x1)]
fun test_counter_increment(account: signer) {
    // Arrange
    initialize(&account);

    // Act
    increment(&account);
    increment(&account);

    // Assert
    assert!(get_count(@0x1) == 2, 0);
}
```

Each test should focus on one behavior. When a test fails, you want to know exactly what broke. Instead of a single `test_everything` function, write separate tests like `test_increment_from_zero` and `test_increment_from_nonzero`.

Tests should be independent - each one sets up its own state rather than relying on side effects from other tests. This makes tests reliable and order-independent.

Cover all paths through your code: the happy path where everything works, error cases where things fail correctly, and edge cases like zero values or maximum limits. Use descriptive names that explain both what's being tested and what should happen, like `test_transfer_insufficient_balance_fails` or `test_mint_updates_total_supply`.

Finally, keep test setup DRY by extracting common setup logic into `#[test_only]` helper functions that multiple tests can share.

## Next Steps

- [Error Handling](/move/errors) - Define and test abort codes
- [Counter Tutorial](/getting-started/counter) - Complete example with tests
- [CLI Usage](/cli/usage) - More testing commands
