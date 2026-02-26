# Upgradeability Patterns in Move

Guide for managing module upgrades, data migration, and versioning strategies in Move contracts on Cedra.

## Understanding Module Immutability

**Move modules are immutable once published.** You cannot modify an existing module at the same address. This requires strategic approaches for upgrades.

## Module Upgrade Strategies

### Strategy 1: New Module Name

Publish a new version with a different module name:

```move
// Version 1
module my_module::token_v1 {
    // Original implementation
}

// Version 2
module my_module::token_v2 {
    use my_module::token_v1;
    // Enhanced implementation
}
```

### Strategy 2: New Account Address

Publish to a different account address:

```bash
cedra account create --account v2
cedra move publish --named-addresses MyModule=v2 --account v2
```

### Strategy 3: Wrapper Pattern

Create a wrapper module that delegates to versioned implementations:

```move
module my_module::token_proxy {
    use my_module::token_v2;
    
    public entry fun transfer(sender: &signer, to: address, amount: u64) {
        token_v2::transfer(sender, to, amount);
    }
}
```

## Data Migration Patterns

### Forward-Compatible Storage

Design resources to support future fields:

```move
struct TokenConfig has key {
    version: u64,
    total_supply: u64,
    new_feature_enabled: bool, // Added in v2
}
```

### Migration Function

Create explicit migration functions:

```move
module my_module::token_v2 {
    use my_module::token_v1;
    
    public entry fun migrate_v1_to_v2(
        admin: &signer,
        v1_config_addr: address
    ) acquires TokenConfig {
        let v1_data = token_v1::get_config(v1_config_addr);
        move_to(admin, TokenConfig {
            version: 2,
            total_supply: v1_data.total_supply,
            new_feature_enabled: false,
        });
    }
}
```

## Version Management

### Semantic Versioning

Follow SemVer: `MAJOR.MINOR.PATCH`

```toml
[package]
version = "2.1.0"  # Major.Minor.Patch
```

- **MAJOR**: Breaking changes (new module name/address)
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Version Tracking

```move
struct Config has key {
    version: u64,  // Track version in state
}
```

## Breaking vs Non-Breaking Changes

### Non-Breaking Changes (Safe)

✅ **Adding new functions** - Existing code continues working  
✅ **Adding optional parameters** - Use default values  
✅ **Adding new events** - Doesn't affect existing code  
✅ **Internal optimizations** - No API changes

### Breaking Changes (Require New Version)

❌ **Removing functions** - Breaks existing integrations  
❌ **Changing function signatures** - Callers must update  
❌ **Modifying resource structure** - Breaks storage compatibility

### Example

```move
// ❌ BREAKING: Changed signature
// v1: public fun transfer(amount: u64)
// v2: public fun transfer(amount: u64, fee: u64)

// ✅ NON-BREAKING: Add new function
// v1: public fun transfer(amount: u64)
// v2: public fun transfer(amount: u64)
//     public fun transfer_with_fee(amount: u64, fee: u64)
```

## Best Practices

1. **Plan for upgrades**: Design resources with version fields
2. **Maintain backward compatibility**: Add new features without removing old ones
3. **Test migrations**: Thoroughly test data migration paths
4. **Version your modules**: Use clear naming (v1, v2) or semantic versions
5. **Document breaking changes**: Clearly mark incompatible changes

## Common Pitfalls

### 1. Assuming Modules Can Be Updated

```move
// ❌ BAD: Modules are immutable - can't update existing
// ✅ GOOD: Publish new version
module my_module::token_v2 { ... }
```

### 2. Breaking Storage Layout

```move
// ❌ BAD: Changing field order/types breaks compatibility
// ✅ GOOD: Add new fields at end, keep original structure
```

### 3. Not Planning Migration Path

```move
// ❌ BAD: No way to migrate data
// ✅ GOOD: Provide migration function
public entry fun migrate(...) { ... }
```

## Summary

1. **Modules are immutable** - Plan upgrade strategies upfront
2. **Use version suffixes** - `token_v1`, `token_v2` for clarity
3. **Design forward-compatible** - Add version fields, append new fields
4. **Provide migration paths** - Create explicit migration functions
5. **Document changes** - Clearly mark breaking vs non-breaking

---

## Additional Resources

- [Cedra Documentation](https://docs.cedra.network)
- [Module Publishing Guide](./module-publishing.md)
