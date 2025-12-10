# Move Package Management

Learn how to create, compile, and deploy Move packages on Cedra. Start with the quick guide for immediate results, then explore detailed explanations below.

:::tip Prerequisites
Before starting, ensure you have:
- ✅ [Cedra CLI installed](/getting-started/cli)
- ✅ [A configured Cedra account](/cli/usage#1-initial-configuration)
:::


<div className="flow-steps">

<div>

**1** &nbsp; **Initialize your package**

Create a new Move package with the required directory structure:

```bash
cedra move init --name my_project
```

This creates `Move.toml`, `sources/`, and `tests/` directories. Add your modules to `sources/` - see [First Transaction Guide](/getting-started/tx) for module examples.

</div>

---

<div>

**2** &nbsp; **Compile your code**

Compile your Move code with named addresses:

- Replace `my_project` with your address name from Move.toml
- Use `default` to deploy to your current account

```bash
cedra move compile --named-addresses my_project=default
```

</div>

---

<div>

**3** &nbsp; **Deploy to blockchain**

Deploy the compiled package to Cedra:

```bash
cedra move publish --named-addresses my_project=default
```

The CLI will simulate first, then ask for confirmation. After deployment, save the transaction hash.
<br />
✅ **Done!** Your module is now live on-chain.

</div>

</div>



### Package Structure

When you run `cedra move init`, it creates:

```
my_project/
├── Move.toml          # Package configuration
├── sources/           # Your Move modules
├── scripts/           # Transaction scripts (optional)
└── tests/             # Test modules
```

- **`sources/`** - Contains your Move modules (smart contracts)
- **`Move.toml`** - Package manifest with dependencies and configuration
- **`scripts/`** - Optional transaction scripts for complex operations
- **`tests/`** - Test modules with `#[test]` functions

### Configuring Move.toml

A complete `Move.toml` configuration:

```toml
[package]
name = "MyProject"
version = "1.0.0"
upgrade_policy = "compatible"

[dependencies]
CedraFramework = {
    git = "https://github.com/cedra-labs/cedra-framework.git",
    subdir = "cedra-framework",
    rev = "mainnet"
}

[addresses]
my_project = "_"
```

### Address Parameterization

Named addresses allow flexible deployment without hardcoding. Benefits:
- Deploy the same code to different addresses
- Keep real addresses out of public repos
- Use different addresses for test vs production

**Configuration options:**

```toml
[addresses]
# Option 1: Placeholder (most flexible)
my_project = "_"

# Option 2: Hardcoded address
my_project = "0xCAFE"

# Option 3: Use current account
my_project = "default"

# Option 4: Multiple addresses
my_project = "_"
helper_module = "0x123"
shared_lib = "0x456"
```

**How addresses map to code:**

```rust
// If my_project = "0xCAFE" in Move.toml
module my_project::token {
    // This module will be deployed at 0xCAFE::token
}

module my_project::marketplace {
    // This will be at 0xCAFE::marketplace
    use my_project::token; // Internal reference
}
```

The named address acts as an alias - the compiler replaces `my_project` with the actual address at compile time.

### Package Dependencies

Add framework and third-party dependencies:

```toml
[dependencies]
# Cedra Framework (required for most projects)
CedraFramework = {
    git = "https://github.com/cedra-labs/cedra-framework.git",
    subdir = "cedra-framework",
    rev = "mainnet"
}

# Local dependency
MySharedLib = { local = "../shared-lib" }

# Git dependency with specific branch
ThirdPartyLib = {
    git = "https://github.com/example/lib.git",
    rev = "feature-branch"
}
```

**Standard deployment:**

```bash
cedra move publish --named-addresses my_project=default
```

The CLI simulates first, showing gas costs before actual deployment. Confirm when prompted.

**Deploy to different networks:**

```bash
# Initialize for specific network
cedra init --network devnet    # For development
cedra init --network testnet   # For testing
cedra init --network mainnet   # For production

# Deploy using specific profile
cedra move publish --profile devnet --named-addresses my_project=default
```

## Next Steps

- If your package exceeds 64KB, see [Deploying Large Packages](/large-packages)
- Learn Move syntax in [Move Programming](/move/basics)
- Try the [Counter Tutorial](/getting-started/counter)
