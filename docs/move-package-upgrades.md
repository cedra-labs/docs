# Move Package Upgrades

Move code on the Cedra blockchain can be upgraded. This allows code owners and module developers to update and evolve their contracts under a single, stable, well-known account address that doesn't change. When a module upgrade happens, all consumers of that module will automatically receive the latest version of the code the next time they interact with it.

:::tip Prerequisites
Before upgrading packages, ensure you have:
- ✅ [Cedra CLI installed](/getting-started/cli)
- ✅ [An existing deployed package](/move-package-management)
- ✅ [Understanding of Move.toml configuration](/move-package-management#configuring-movetoml)
:::

### How Package Upgrades Work

The Cedra blockchain natively supports different upgrade policies, which allow Move developers to explicitly define the constraints around how their Move code can be upgraded. The default policy is **backwards compatible** - code upgrades are accepted only if they guarantee that no existing resource storage or public APIs are broken by the upgrade. This compatibility checking is possible because of Move's strongly typed bytecode semantics.

:::warning
Even compatible upgrades can have hazardous effects on applications and dependent Move code. For example, if the semantics of the underlying module are modified. Developers should be careful when depending on third-party Move code that can be upgraded on-chain. See [Security Considerations](#security-considerations-for-dependencies) for more details.
:::

There are two upgrade policies supported by Cedra:

#### Compatible (default)

Upgrades must be backwards compatible:

**For storage:**
- All old struct declarations must be the same in the new code
- This ensures existing state of storage is correctly interpreted by the new code
- New struct declarations can be added

**For APIs:**
- All existing public functions must have the same signature as before
- New functions (including public and entry functions) can be added

#### Immutable

- The code is not upgradeable
- Guaranteed to stay the same forever
- Use this when you want to give users maximum trust guarantees

### Policy Strength Hierarchy

Policies are ordered by strength: `compatible` < `immutable`

- The policy of a package on-chain can only get **stronger**, not weaker
- All dependencies of a package must have policies that are **equal to or stronger than** the package itself
- For example, an `immutable` package cannot refer directly or indirectly to a `compatible` package

:::info Framework Exception
Framework packages installed at addresses `0x1` to `0xa` are exempted from the dependency check. This is necessary so you can define an `immutable` package based on the standard libraries, which have the `compatible` policy to allow critical upgrades and fixes.
:::

### Performing an Upgrade

<div className="flow-steps">

<div>

**1** &nbsp; **Make changes to your code**

Update your Move modules in the `sources/` directory. Ensure your changes follow the [compatibility rules](#compatibility-rules) for your upgrade policy.

</div>

---

<div>

**2** &nbsp; **Recompile your package**

Compile with the same named addresses as your original deployment:

```bash
cedra move compile --named-addresses my_app=default
```

The compiler will verify your changes are valid Move code.

</div>

---

<div>

**3** &nbsp; **Republish to the same address**

Deploy the updated package to the same address where it was originally published:

```bash
cedra move publish --named-addresses my_app=default
```

The CLI will simulate first, checking compatibility. If compatible, confirm to deploy.
<br />
✅ **Done!** Your upgraded module is now live on-chain.

</div>

</div>

## Compatibility Rules

When using the `compatible` upgrade policy, updates to existing modules must follow these rules:

#### Struct Rules

- All existing struct fields **cannot be updated**
- No new fields can be added to existing structs
- Existing fields cannot be modified or removed
- **New structs can be added**

```rust
// Original
struct MyStruct has key {
    value: u64,
}

// INVALID upgrade - cannot add field
struct MyStruct has key {
    value: u64,
    new_field: bool,  // Not allowed!
}

// VALID - adding a new struct is fine
struct AnotherStruct has key {
    data: vector<u8>,
}
```

#### Function Rules

- **Public functions** (`public fun`) cannot change their signature (argument types, type arguments, return types)
- **Entry functions** (`entry fun`, `public entry fun`) cannot change their signature
- Argument **names** can change (only types matter)
- **New public and entry functions** can be added

```rust
// Original
public fun transfer(from: address, to: address, amount: u64) { ... }

// INVALID - cannot change signature
public fun transfer(from: address, to: address, amount: u128) { ... }

// VALID - new function
public fun transfer_with_memo(from: address, to: address, amount: u64, memo: vector<u8>) { ... }
```

#### Friend Function Rules

`public(friend)` functions are treated as private for compatibility purposes:
- Their signatures **can** change arbitrarily
- This is safe because only modules in the same package can call friend functions
- Those modules are updated together and must handle any signature changes

#### Ability Rules

- Existing abilities on a struct/enum type **cannot be removed**
- Abilities **can be added**

```rust
// Original
struct Token has store { value: u64 }

// VALID - adding ability
struct Token has store, copy { value: u64 }

// INVALID - removing ability
struct Token { value: u64 }  // Removed 'store' - not allowed!
```

With these rules in mind, you're ready to safely upgrade your packages. If you're unsure whether your changes are compatible, compile with `cedra move compile` first - the compiler will catch compatibility violations before you attempt to publish.

## Next Steps

- Learn the basics in [Package Management](/move-package-management)
- Handle large contracts with [Deploying Large Packages](/large-packages)
- Dive into [Move Programming](/move/basics)
- Understand [Move Modules](/move/modules) and [Functions](/move/functions)
