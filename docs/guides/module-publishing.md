# How to Publish Modules on Cedra

> **Builders Forge Issue #69** - A comprehensive guide to publishing Move modules on the Cedra blockchain

Publishing Move modules on Cedra is a critical skill for blockchain developers. This guide walks you through the entire process, from project setup to successful deployment, including dependency management, versioning strategies, and troubleshooting common issues.

:::tip Prerequisites
Before publishing your first module, ensure you have:
- **Cedra CLI** installed and configured
- **Move compiler** knowledge (basic syntax and concepts)
- **Testnet account** with sufficient funds for gas fees
- **Git** for version control (recommended)
:::

## Table of Contents

1. [Publishing Workflow Overview](#publishing-workflow-overview)
2. [Step-by-Step Publishing](#step-by-step-publishing)
3. [Dependencies Management](#dependencies-management)
4. [Versioning Strategies](#versioning-strategies)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Best Practices](#best-practices)
7. [Next Steps](#next-steps)

---

## Publishing Workflow Overview

Publishing a Move module on Cedra follows this high-level workflow:

```
Project Setup → Write Code → Local Testing → Compile → Publish → Verify
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Module** | A collection of types, functions, and resources published at a specific address |
| **Named Address** | A human-readable alias for blockchain addresses (e.g., `my_module = "_"`) |
| **Dependencies** | External packages your module imports (CedraFramework, other modules) |
| **Publishing Address** | The on-chain address where your module will be deployed |

---

## Step-by-Step Publishing

### Step 1: Initialize Your Project

Create a new Move project using the Cedra CLI:

```bash
# Create and enter project directory
mkdir my_first_module
cd my_first_module

# Initialize Move project in current directory
# IMPORTANT: cedra move init creates files HERE, not in a subdirectory
cedra move init --name my_first_module
```

This creates the following structure **in your current directory**:

```
my_first_module/
├── Move.toml          # Project configuration
├── sources/           # Move source code directory
├── scripts/           # Deployment scripts
└── tests/             # Test files
```

### Step 2: Configure Move.toml

The `Move.toml` file defines your project's metadata, addresses, and dependencies.

**Example Move.toml:**

```toml
[package]
name = "MyFirstModule"
version = "1.0.0"
authors = []

[addresses]
my_module = "_"  # Placeholder, replaced at publish time

[dev-addresses]
my_module = "0xcafe"  # Address used during local testing

[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-framework.git", subdir = "cedra-framework", rev = "main" }

[dev-dependencies]
```

:::tip Framework Branch Selection
While the Cedra CLI generates `rev = "mainnet"` by default, **in practice `rev = "main"` is most commonly used** and works reliably across all networks (testnet, mainnet, devnet).

Available branches:
- `rev = "main"` - **Recommended** - Works across all networks, actively maintained
- `rev = "mainnet"` - Mainnet-specific (may have compatibility issues)
- `rev = "testnet"` - Testnet-specific framework
- `rev = "devnet"` - Development network (currently same as main)

**All Builders Forge projects use `rev = "main"`** and deploy successfully to testnet.
:::

**Key Configuration Options:**

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Package name | `"MyFirstModule"` |
| `version` | Semantic version | `"1.0.0"` |
| `[addresses]` | Named addresses for deployment | `my_module = "_"` |
| `[dev-addresses]` | Addresses for local testing | `my_module = "0xcafe"` |
| `[dependencies]` | Required external packages | CedraFramework, custom modules |

:::tip Named Addresses
The underscore `"_"` in `[addresses]` is a placeholder that gets replaced with your actual account address during publishing. This allows your code to be published to any address without modification.
:::

### Step 3: Write Your Module

Create your Move source file in the `sources/` directory:

**sources/hello_world.move:**

```move
module my_module::hello_world {
    use std::string::{Self, String};

    /// Simple message resource
    struct Message has key {
        text: String,
    }

    /// Initialize message for account
    public entry fun set_message(
        account: &signer,
        message_text: vector<u8>
    ) {
        let message = Message {
            text: string::utf8(message_text),
        };
        move_to(account, message);
    }

    #[view]
    /// Read message from account
    public fun get_message(addr: address): String acquires Message {
        borrow_global<Message>(addr).text
    }

    #[test(account = @0x1)]
    public fun test_message(account: &signer) acquires Message {
        set_message(account, b"Hello Cedra!");
        let msg = get_message(@0x1);
        assert!(msg == string::utf8(b"Hello Cedra!"), 0);
    }
}
```

### Step 4: Compile Your Module

Before publishing, ensure your code compiles without errors:

```bash
# Option 1: Compile with dev address (no cedra init required)
cedra move compile --named-addresses my_module=0xcafe

# Option 2: Compile with default profile (requires cedra init first)
cedra init  # Run once to set up default profile
cedra move compile --named-addresses my_module=default

# Expected output:
# Compiling, may take a little while to download git dependencies...
# UPDATING GIT DEPENDENCY https://github.com/cedra-labs/cedra-framework.git
# INCLUDING DEPENDENCY CedraFramework
# INCLUDING DEPENDENCY CedraStdlib
# INCLUDING DEPENDENCY MoveStdlib
# BUILDING my_first_module
```

**Common Compile Flags:**

| Flag | Purpose |
|------|---------|
| `--named-addresses` | Specify address mappings |
| `--skip-fetch-latest-git-deps` | Use cached dependencies |
| `--dev` | Include dev dependencies |

### Step 5: Run Tests

Always test before publishing to avoid deploying buggy code:

```bash
# Run all tests
cedra move test

# Run specific test
cedra move test --filter test_message

# Run with coverage (requires --dev flag)
cedra move test --coverage --dev
```

**Expected test output:**

```
Running Move unit tests
[ PASS    ] 0xCAFE::hello_world::test_message
Test result: OK. Total tests: 1; passed: 1; failed: 0
```

### Step 6: Publish to Cedra

Once compiled and tested, publish your module to the Cedra blockchain:

```bash
# Publish to default profile address
cedra move publish \
  --named-addresses my_module=default \
  --profile default

# Publish to specific address
cedra move publish \
  --named-addresses my_module=0x123abc... \
  --profile mainnet

# Publish with max gas budget
cedra move publish \
  --named-addresses my_module=default \
  --max-gas 10000 \
  --profile default
```

**Publishing Flow:**

1. CLI compiles the module
2. Prompts for confirmation (shows gas estimate)
3. Submits transaction to blockchain
4. Waits for transaction confirmation
5. Displays published module address

**Example Output:**

```
Compiling, may take a little while to download git dependencies...
INCLUDING DEPENDENCY CedraFramework
BUILDING MyFirstModule

Do you want to publish this package at address 0xabc123...? [yes/no]
> yes

{
  "Result": {
    "transaction_hash": "0xdef456...",
    "gas_used": 1247,
    "vm_status": "Executed successfully"
  }
}

View on Cedrascan: https://cedrascan.com/txn/0xdef456...?network=testnet
```

### Step 7: Verify Publication

Confirm your module is published and accessible:

```bash
# List modules at your address
cedra account list --account default

# View module details
cedra move view \
  --function-id 'default::hello_world::get_message' \
  --args address:0xabc123...
```

---

## Dependencies Management

Managing dependencies correctly is crucial for successful module publication.

### Adding Dependencies

Dependencies are defined in `Move.toml` under `[dependencies]`:

**Cedra Framework (Official):**

```toml
[dependencies]
CedraFramework = {
  git = "https://github.com/cedra-labs/cedra-framework.git",
  subdir = "cedra-framework",
  rev = "main"
}
```

**Custom Git Dependencies:**

```toml
[dependencies]
MyLibrary = {
  git = "https://github.com/username/my-library.git",
  subdir = "move",
  rev = "v1.2.0"  # Use specific version tag
}
```

**Local Dependencies (Development):**

```toml
[dependencies]
LocalModule = { local = "../local-module" }
```

### Dependency Resolution

The Cedra CLI fetches dependencies during compilation:

```bash
# Update dependencies to latest
cedra move compile

# Use cached dependencies
cedra move compile --skip-fetch-latest-git-deps

# Clean and rebuild
rm -rf build/
cedra move compile
```

### Dependency Best Practices

| Practice | Reason |
|----------|--------|
| ✅ Use `main` branch | Standard across all Cedra projects and official examples |
| ✅ Use official Cedra Framework | Tested and maintained by Cedra Labs |
| ✅ Pin to specific commit for critical apps | Ensures reproducible builds (`rev = "abc123..."`) |
| ✅ Minimize dependencies | Reduces compilation time and attack surface |
| ✅ Document dependency versions | Helps teammates understand requirements |

### Resolving Dependency Conflicts

**Problem:** Two dependencies require different versions of the same module.

**Solution:**

```toml
# Explicitly specify dependency versions in [dependencies]
[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-framework.git", subdir = "cedra-framework", rev = "main" }
ThirdPartyLib = { git = "https://github.com/example/lib.git", rev = "v1.2.0" }

# Note: Move.toml does not support [patch] sections like Rust's Cargo.toml
# Always specify the exact version you want in [dependencies]
```

---

## Versioning Strategies

Proper versioning ensures smooth upgrades and compatibility.

### Semantic Versioning

Follow [SemVer](https://semver.org/) for your modules:

```
MAJOR.MINOR.PATCH
  1.2.3
```

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

**Example:**

```toml
[package]
name = "TokenVault"
version = "2.1.3"  # Major 2, Minor 1, Patch 3
```

### Module Upgrade Compatibility

:::warning Breaking Changes
Move modules can be upgraded, but **struct layouts cannot change**. Adding/removing/reordering struct fields is a breaking change that requires a new module.
:::

**Compatible Changes** (Safe to upgrade):

- ✅ Adding new functions
- ✅ Modifying function implementations
- ✅ Adding new structs
- ✅ Adding new abilities to structs (`key` → `key, drop`)

**Incompatible Changes** (Requires new module):

- ❌ Modifying struct fields
- ❌ Removing public functions
- ❌ Changing function signatures
- ❌ Removing abilities from structs

### Upgrade Strategies

**Strategy 1: In-Place Upgrade (Compatible Changes)**

```bash
# Update version in Move.toml
version = "1.1.0"  # Was 1.0.0

# Republish to same address
cedra move publish \
  --named-addresses my_module=default \
  --profile default
```

**Strategy 2: New Module (Breaking Changes)**

```bash
# Create new module with different name
module my_module::token_vault_v2 {
  // New struct layout
  struct Vault has key {
    balance: u64,
    owner: address,
    new_field: u128,  // Breaking change
  }
}

# Publish as separate module
cedra move publish \
  --named-addresses my_module=default \
  --profile default
```

**Strategy 3: Migration Path**

Provide migration functions for users:

```move
module my_module::migrator {
    use my_module::vault_v1;
    use my_module::vault_v2;

    /// Migrate from v1 to v2
    public entry fun migrate(account: &signer) {
        // Read v1 data
        let old_data = vault_v1::extract_data(account);

        // Create v2 with migrated data
        vault_v2::initialize_from_v1(account, old_data);
    }
}
```

### Version Tags in Git

Use Git tags to track published versions:

```bash
# Tag the release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Reference in Move.toml
[dependencies]
MyModule = {
  git = "https://github.com/user/my-module.git",
  rev = "v1.0.0"
}
```

---

## Troubleshooting Guide

Common issues and their solutions:

### Compilation Errors

**Error: "Cannot find module"**

```
error: unbound module
   ┌─ sources/my_module.move:2:9
   │
 2 │     use cedra_framework::coin;
   │         ^^^^^^^^^^^^^^^ Unbound module or type alias 'cedra_framework'
```

**Solution:**
Add the dependency to `Move.toml`:

```toml
[dependencies]
CedraFramework = { git = "https://github.com/cedra-labs/cedra-framework.git", subdir = "cedra-framework", rev = "main" }
```

---

**Error: "Duplicate module"**

```
error: duplicate definition for module
```

**Solution:**
- Check for multiple files defining the same module
- Ensure module name matches address::name pattern
- Remove duplicate definitions

---

**Error: "Type mismatch"**

```
error: expected `u64` but found `u128`
```

**Solution:**
- Use explicit type casting: `(value as u64)`
- Ensure type consistency across function calls
- Check function signatures match usage

---

### Publishing Errors

**Error: "Insufficient gas"**

```
Error: Transaction failed: Out of gas
```

**Solution:**

```bash
# Increase gas budget
cedra move publish \
  --named-addresses my_module=default \
  --max-gas 20000 \
  --profile default
```

---

**Error: "Module already published"**

```
Error: DUPLICATE_MODULE_NAME
```

**Solution:**

This is usually correct behavior—you're upgrading. To publish a truly new module:

```move
// Change module name
module my_module::my_contract_v2 {  // Was my_contract
    // ...
}
```

---

**Error: "Named address not found"**

```
error: address 'my_module' not found
```

**Solution:**

```bash
# Ensure named address is specified
cedra move publish \
  --named-addresses my_module=default \  # Add this flag
  --profile default
```

---

### Dependency Errors

**Error: "Failed to fetch git dependency"**

```
error: failed to clone git repository
```

**Solution:**
- Check internet connection
- Verify Git URL is correct
- Use SSH keys if repository is private
- Try using cached dependencies: `--skip-fetch-latest-git-deps`

---

**Error: "Cyclic dependency detected"**

```
error: cyclic package dependency detected
```

**Solution:**
- Review dependency tree
- Remove circular references
- Restructure modules to break cycle

---

### Runtime Errors

**Error: "Resource not found"**

```
abort_code: 0x60006 (ERESOURCE_NOT_FOUND)
```

**Solution:**

```move
// Always check resource exists
public fun get_data(addr: address): u64 acquires MyResource {
    assert!(exists<MyResource>(addr), E_NOT_FOUND);
    borrow_global<MyResource>(addr).value
}
```

---

## Best Practices

### Development Workflow

1. **Start with tests**: Write tests before implementation (TDD)
2. **Use dev-dependencies**: Keep test-only code separate
3. **Version control**: Commit after each successful publish
4. **Document changes**: Maintain CHANGELOG.md
5. **Code review**: Have teammates review before publishing

### Security Checklist

Before publishing, ensure:

- ✅ All inputs are validated
- ✅ Access control is properly implemented
- ✅ No integer overflow/underflow vulnerabilities
- ✅ Resources can't be lost or duplicated
- ✅ Test coverage is comprehensive
- ✅ Error codes are documented

### Gas Optimization

Minimize gas costs:

- Use `#[view]` for read-only functions
- Avoid unnecessary resource creation
- Batch operations when possible
- Use efficient data structures (`SmartTable` for large data)

### Documentation

Document your modules:

```move
/// Token vault for time-locked funds
///
/// # Features
/// - Time-locked deposits
/// - Authorized withdrawals
/// - Event emission
module my_module::vault {
    /// Deposit funds with timelock
    ///
    /// # Parameters
    /// - `account`: Depositor's signer
    /// - `amount`: Amount to deposit (in smallest unit)
    /// - `lock_duration`: Lock period in seconds
    ///
    /// # Errors
    /// - `E_INVALID_AMOUNT`: Amount is zero
    /// - `E_ALREADY_EXISTS`: Vault already exists
    public entry fun deposit(
        account: &signer,
        amount: u64,
        lock_duration: u64
    ) {
        // Implementation
    }
}
```

---

## Next Steps

After publishing your first module:

1. **Interact with your module**: Use the Cedra CLI to call functions
2. **Build a client**: Create a TypeScript/Python SDK client
3. **Monitor transactions**: Use Cedrascan to track activity
4. **Upgrade your module**: Practice safe upgrade patterns
5. **Publish more modules**: Build complex multi-module projects

### Additional Resources

- [Cedra Documentation](https://docs.cedra.dev)
- [Move Language Book](https://move-language.github.io/move/)
- [Cedra Framework Reference](https://github.com/cedra-labs/cedra-framework)
- [Example Contracts](https://github.com/cedra-labs/move-contract-examples)
- [Cedra Builders Community](https://t.me/+Ba3QXd0VG9U0Mzky)

---

**Congratulations!** You've learned how to publish Move modules on Cedra. Start building and deploying your blockchain applications today!

