# Cedra Fungible Asset (FA) End‑to‑End Guide

> **All code is taken directly from the `fa-example` folder in the ([cedra‑labs repo](https://github.com/cedra-labs/move-contract-examples/tree/main/fa-example))**

:::tip Prerequisites
Before starting this guide, make sure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs) - Required for development toolchain
- ✅ [Installed the Cedra CLI](/getting-started/cli) - Essential for deploying contracts
- ✅ [Obtained test tokens from the faucet](/getting-started/faucet) - Needed for deployment gas
:::

## 1. What *is* a Fungible Asset?

Cedra **Fungible Asset (FA)** is a standard rebuilds ERC‑20‑style tokens for the Move VM, replacing brittle global tables with **ownable objects** - safer, cheaper, composable.

:::info Move Concepts Used
This guide applies several Move fundamentals:
- **[Resources](/move/resource)** - Tokens are resources that can't be copied or destroyed
- **[Abilities](/move/basics#the-ability-system)** - The `has store` ability enables tokens to be stored in wallets
- **[Capabilities](/move/modules#the-capability-pattern)** - MintRef and BurnRef control token creation/destruction
- **[Entry Functions](/move/functions#parameters-how-data-flows-in)** - Public entry points for minting and transferring
:::

### 1.1 Design pillars

* **Object‑based balances** – Every holder’s balance lives in an `Object<FungibleStore>`. Gas is refunded when balance hits zero.
* **Zero‑friction receiving** – Primary stores are created *lazily* on first transfer - no manual registration.
* **Fine‑grained capabilities** – Narrow permissions:

  * `MintRef` – inflate supply
  * `BurnRef` – destroy supply
  * `FreezeRef` – pause transfers from a given store
  * `TransferRef` – move tokens without the owner’s signature (escrow use‑cases)
* **Optional supply cap** – Provide `max_supply` at creation for hard‑capped tokens.
* **Metadata object** – Stores `name`, `symbol`, `decimals`, URIs, and can itself own capabilities - acting as the token’s *admin account*.

### 1.2 Core objects at a glance

| Object          | Key Fields                                                        | Created               | Ownership                            |
| --------------- | ----------------------------------------------------------------- | --------------------- | ------------------------------------ |
| `Metadata`      | `name`, `symbol`, `decimals`, `icon_uri`, `supply`, `max_supply?` | Once in `init_module` | Immutable; admin is the object owner |
| `FungibleStore` | `balance`                                                         | On first receipt      | Holder account                       |

### 1.3 Lifecycle & Permissions

1. **Creation + Permission minting** – Call `create_primary_store_enabled_fungible_asset` to write metadata **and mint capability resources** (`MintRef`, `BurnRef`, `TransferRef`, `FreezeRef`). These live under the metadata address.
2. **Mint/Burn** – Accounts holding `MintRef`/`BurnRef` can change supply. Re‑home or burn capabilities to delegate/revoke rights.
3. **Transfer** – Any holder may `withdraw` → `deposit` without special rights.
4. **Freeze/Thaw** *(optional)* – `FreezeRef` can pause/resume outflows from a suspicious store.



## 2. Repo Layout & Move Smart Contract

### 2.0 Directory roles

* **`contract/`** – The **Move smart‑contract package**. `Move.toml` lists dependencies, named addresses, compiler flags, etc. Business logic lives in `sources/cedra_asset.move`.
* **`client/`** – A **TypeScript client** built with the Cedra SDK (`@cedra-labs/ts-sdk` fork) for signing transactions and calling on‑chain entries.

### 2.1 `cedra_asset.move` – entry functions

The contract has four entry functions: `mint`, `burn`, and `transfer`.

#### 2.1.1 `init_module` - bootstrap

```move
fun init_module(admin: &signer) {
    let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
    primary_fungible_store::create_primary_store_enabled_fungible_asset(
        constructor_ref,
        option::none(),                       // unlimited supply
        utf8(ASSET_NAME),
        utf8(ASSET_SYMBOL),
        8,                                    // decimals
        utf8(b"https://metadata.cedra.dev/cedraasset.json"),
        utf8(b"http://example.com"),
    );

    let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
    let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
    let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
    let metadata_object_signer = object::generate_signer(constructor_ref);

    move_to(
        &metadata_object_signer,
        ManagedFungibleAsset {
            mint_ref,
            burn_ref,
            transfer_ref,
            admin: signer::address_of(admin),
        }
    );
}
```

**How it works**

1. `create_named_object` creates an object ID based on `ASSET_SYMBOL`.
2. `create_primary_store_enabled_fungible_asset` registers metadata.
3. Generate `MintRef`, `BurnRef`, and `TransferRef` capabilities.
4. Store capabilities in `ManagedFungibleAsset` under the metadata object.

#### 2.1.2 `mint` - controlled inflation

```move
public entry fun mint(admin: &signer, to: address, amount: u64) acquires ManagedFungibleAsset {
    let asset = get_metadata();
    let managed_fungible_asset = authorized_borrow_refs(admin, asset);
    let to_wallet = primary_fungible_store::ensure_primary_store_exists(to, asset);
    let fa = fungible_asset::mint(&managed_fungible_asset.mint_ref, amount);
    fungible_asset::deposit_with_ref(&managed_fungible_asset.transfer_ref, to_wallet, fa);
}
```

Only the admin can mint. The `authorized_borrow_refs` function checks if the caller is the admin.

#### 2.1.3 `burn` - token destruction

```move
public entry fun burn(owner: &signer, amount: u64) acquires ManagedFungibleAsset {
    let asset = get_metadata();
    let managed_fungible_asset = borrow_global<ManagedFungibleAsset>(object::object_address(&asset));
    let fa = primary_fungible_store::withdraw(owner, asset, amount);
    fungible_asset::burn(&managed_fungible_asset.burn_ref, fa);
}
```

Any user can burn their own tokens. The function withdraws tokens from the caller's store, then burns them using the `BurnRef`.

#### 2.1.4 `transfer` - peer-to-peer move

```move
public entry fun transfer(sender: &signer, to: address, amount: u64) {
    let asset = get_metadata();
    let fa = primary_fungible_store::withdraw(sender, asset, amount);
    primary_fungible_store::deposit(to, fa);
}
```

No special capabilities needed - any holder can transfer their tokens.


## 3. Deploying

1. **Compile** to type-check.
2. If output looks correct, **publish**.
3. **Save** the printed Metadata object address.

```bash
cedra move compile --named-addresses CedraFungible=default
cedra move publish --named-addresses CedraFungible=default
```

For detailed deployment options, see [Move Package Management](/move-package-management). For large contracts (>64KB), see [Deploying Large Packages](/large-packages).


## 4. Testing

The contract includes a test file at `tests/cedra_asset_test.move` with 17 tests covering mint, burn, transfer, and error cases.

### 4.1 Run tests

```bash
cd contract
cedra move test
```

### 4.2 Test structure

Tests use a shared setup function:

```move
#[test_only]
fun setup_for_test(
    admin: &signer,
    alice: &signer,
    bob: &signer
): (address, address, address, Object<Metadata>) {
    let admin_addr = signer::address_of(admin);
    let alice_addr = signer::address_of(alice);
    let bob_addr = signer::address_of(bob);

    CedraAsset::init_for_test(admin);
    let metadata = CedraAsset::get_metadata();

    (admin_addr, alice_addr, bob_addr, metadata)
}
```

The `init_for_test` function is a `#[test_only]` wrapper around the internal initialization logic.

### 4.3 Test examples

**Basic mint and balance check:**

```move
#[test(admin = @CedraFungible, alice = @0xA11CE, bob = @0xB0B)]
fun test_mint(admin: &signer, alice: &signer, bob: &signer) {
    let (_admin_addr, alice_addr, _bob_addr, metadata) = setup_for_test(admin, alice, bob);

    CedraAsset::mint(admin, alice_addr, 1000);

    let balance = primary_fungible_store::balance(alice_addr, metadata);
    assert!(balance == 1000, 0);
}
```

**Burn tokens:**

```move
#[test(admin = @CedraFungible, alice = @0xA11CE, bob = @0xB0B)]
fun test_burn(admin: &signer, alice: &signer, bob: &signer) {
    let (_admin_addr, alice_addr, _bob_addr, metadata) = setup_for_test(admin, alice, bob);

    CedraAsset::mint(admin, alice_addr, 1000);
    CedraAsset::burn(alice, 50);

    let balance = primary_fungible_store::balance(alice_addr, metadata);
    assert!(balance == 950, 0);
}
```

**Test expected failures:**

```move
#[test(admin = @CedraFungible, alice = @0xA11CE, bob = @0xB0B)]
#[expected_failure(abort_code = 327681, location = CedraFungible::CedraAsset)]
fun test_mint_not_admin(admin: &signer, alice: &signer, bob: &signer) {
    let (_admin_addr, _alice_addr, bob_addr, _metadata) = setup_for_test(admin, alice, bob);

    // Alice tries to mint (should fail - not admin)
    CedraAsset::mint(alice, bob_addr, 1000);
}
```

**Full flow test:**

```move
#[test(admin = @CedraFungible, alice = @0xA11CE, bob = @0xB0B)]
fun test_mint_transfer_burn_flow(admin: &signer, alice: &signer, bob: &signer) {
    let (_admin_addr, alice_addr, bob_addr, metadata) = setup_for_test(admin, alice, bob);

    // Mint to Alice
    CedraAsset::mint(admin, alice_addr, 1000);

    // Transfer to Bob
    CedraAsset::transfer(alice, bob_addr, 100);

    // Alice burns some
    CedraAsset::burn(alice, 50);

    // Bob burns all
    CedraAsset::burn(bob, 100);

    assert!(primary_fungible_store::balance(alice_addr, metadata) == 850, 0);
    assert!(primary_fungible_store::balance(bob_addr, metadata) == 0, 1);
}
```

### 4.4 Test coverage

| Test | What it checks |
|------|----------------|
| `test_init_module` | Metadata creation |
| `test_mint` | Admin can mint |
| `test_mint_multiple_times` | Cumulative minting |
| `test_transfer` | Token transfer between accounts |
| `test_burn` | User burns own tokens |
| `test_burn_all_tokens` | Burn entire balance |
| `test_mint_transfer_burn_flow` | Full lifecycle |
| `test_mint_not_admin` | Non-admin mint fails |
| `test_transfer_insufficient_balance` | Transfer > balance fails |
| `test_burn_insufficient_balance` | Burn > balance fails |
| `test_zero_amounts` | Zero transfers/burns work |
| `test_multiple_users` | Multi-user operations |
| `test_self_transfer` | Self-transfer is no-op |
| `test_burn_zero_balance` | Burn without tokens fails |
| `test_large_mint` | u64 max mint works |
| `test_transfer_zero_balance` | Transfer without tokens fails |


## 5. TypeScript Client

We’ll validate the module end‑to‑end:

1. Generate `admin` & `user` accounts.
2. Fund both via faucet.
3. Mint 1 000 tokens → `user`.
4. Transfer 250 tokens back → `admin`.
5. Log balances to confirm.

```ts
import { Account, Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

const config = new CedraConfig({ network: Network.TESTNET });
const cedra = new Cedra(config);

const MODULE_ADDRESS = "0x..."; // from publish output
const MODULE_NAME = "CedraAsset";

async function example() {
  const admin = Account.generate();
  const user = Account.generate();

  // Fund accounts
  await cedra.faucet.fundAccount({ accountAddress: admin.accountAddress, amount: 100_000_000n });
  await cedra.faucet.fundAccount({ accountAddress: user.accountAddress, amount: 100_000_000n });

  // Mint 500 tokens to user
  const mintTxn = await cedra.transaction.build.simple({
    sender: admin.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::mint`,
      functionArguments: [user.accountAddress, 500],
    },
  });
  await cedra.signAndSubmitTransaction({ signer: admin, transaction: mintTxn });

  // Transfer 250 to admin
  const transferTxn = await cedra.transaction.build.simple({
    sender: user.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::transfer`,
      functionArguments: [admin.accountAddress, 250],
    },
  });
  await cedra.signAndSubmitTransaction({ signer: user, transaction: transferTxn });

  // Burn 50 tokens
  const burnTxn = await cedra.transaction.build.simple({
    sender: user.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::burn`,
      functionArguments: [50],
    },
  });
  await cedra.signAndSubmitTransaction({ signer: user, transaction: burnTxn });

  // Final balances: admin=250, user=200
}
```


## 6. Debug Cheat-Sheet

| Abort code                                   | Reason                               | Typical fix                                     |
| -------------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| `0x1::fungible_asset::ENOT_AUTHORIZED`       | Missing capability (`MintRef`, etc.) | Sign with the capability holder or transfer ref |
| `0x1::fungible_asset::EINSUFFICIENT_BALANCE` | Amount exceeds balance               | Lower amount or mint more                       |
| `0x1::fungible_asset::ESTORE_NOT_FOUND`      | Store object absent                  | Send tiny transfer to auto‑create store         |
| `INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE`   | Not enough gas coin                  | Faucet or top‑up                                |

```ts
try { await example(); } catch (e: any) {
  const vm = e.vmError as { abort_code?: string };
  // …switch as shown earlier…
}
```

**Debug tips**

* Inspect transaction hash in Cedra Explorer.
* Query `deposit` / `withdraw` events to trace balances.
* Reproduce edge cases with `cedra move test` and step through aborts locally.


## 7. Next Steps

* Fork [repo](https://github.com/cedra-labs/move-contract-examples/tree/main/fa-example) and tweak `ASSET_NAME`, `ASSET_SYMBOL`, `decimals`.
* Protect `MintRef` with a multisig.
* Build React hooks with SDK subscriptions for live balances.
* Check other examples in [Real World Guides](/real-world-guides) page.
