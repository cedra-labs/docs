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

```
fa-example/
 ├─ contract/               # Move module that defines the token
 │   ├─ Move.toml           # package manifest / config
 │   └─ sources/
 │       └─ cedra_asset.move
 └─ client/                 # TypeScript demo that mints & transfers
     ├─ package.json
     └─ src/
         └─ index.ts
```

### 2.0 Directory roles

* **`contract/`** – The **Move smart‑contract package**. `Move.toml` lists dependencies, named addresses, compiler flags, etc. Business logic lives in `sources/cedra_asset.move`.
* **`client/`** – A **TypeScript client** built with the Cedra SDK (`@cedra-labs/ts-sdk` fork) for signing transactions and calling on‑chain entries.

### 2.1 `cedra_asset.move` – key entry functions

Below are the three essential entries with line‑by‑line explanations.

#### 2.1.1 `init_module` - bootstrap

```rust
public entry fun init_module(admin: &signer) {
    let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
    let (metadata, mint, transfer) =
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),                       // unlimited supply
            utf8(ASSET_NAME),
            utf8(ASSET_SYMBOL),
            8,                                     // decimals
            utf8(b"https://metadata.cedra.dev/icon.png"),
        );
    move_to(metadata, ManagedFungibleAsset { mint_ref: mint, transfer_ref: transfer });
}
```

**How it works**

1. `create_named_object` creates an empty object ID based on `ASSET_SYMBOL` → future metadata address.
2. `create_primary_store_enabled_fungible_asset` registers metadata and returns `MintRef` + `TransferRef`.
3. `move_to` stores a `ManagedFungibleAsset` with both capabilities.

> 📝 No supply is minted here - just scaffolding + permissions.

#### 2.1.2 `mint` - controlled inflation

```rust
public entry fun mint(admin: &signer, to: address, amount: u64)
acquires ManagedFungibleAsset {
    let refs = borrow_global<ManagedFungibleAsset>(signer::address_of(admin));
    fungible_asset::mint(&refs.mint_ref, to, amount);
}
```

**Permissions gate** – Caller must own `ManagedFungibleAsset` → holds `MintRef`; else abort `ENOT_AUTHORIZED`.

#### 2.1.3 `transfer` - peer‑to‑peer move

```rust
public entry fun transfer(sender: &signer, to: address, amount: u64) {
    let asset = fungible_asset::metadata<Object<Metadata>>(signer::address_of(sender));
    let fa = primary_fungible_store::withdraw(sender, asset, amount);
    primary_fungible_store::deposit(to, fa);
}
```

No special capabilities needed - any holder may transfer.


## 3. Deploying

1. **Compile** to type‑check.
2. If output looks correct, **publish**.
3. **Save** the printed Metadata object address (admin + capability store).

For detailed deployment options, see [Move Package Management](/move-package-management). For large contracts (>64KB), see [Deploying Large Packages](/large-packages).

```bash
cedra move compile --named-addresses CedraFungible=default
cedra move publish --named-addresses CedraFungible=default
```


## 4. TypeScript Client & Testing Flow

We’ll validate the module end‑to‑end:

1. Generate `admin` & `user` accounts.
2. Fund both via faucet.
3. Mint 1 000 tokens → `user`.
4. Transfer 250 tokens back → `admin`.
5. Log balances to confirm.

```ts
import { Account, Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

const config = new CedraConfig({ network: Network.TESTNET });
const cedra  = new Cedra(config);

const MODULE_ADDRESS = "0x..."; // from publish output
const MODULE_NAME    = "CedraAsset";
const FA_TYPE        = `${MODULE_ADDRESS}::${MODULE_NAME}::CedraAsset`;
const ONE_CEDRA        = 100_000_000n; // Octas

async function example() {
  const admin = Account.generate();
  const user  = Account.generate();

  await cedra.faucet.fundAccount({ accountAddress: admin.accountAddress, amount: ONE_CEDRA });
  await cedra.faucet.fundAccount({ accountAddress: user.accountAddress,  amount: ONE_CEDRA });

  // Mint
  const mintTxn = await cedra.transaction.build.simple({
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::mint`,
    arguments: [user.accountAddress, 1_000],
  });
  const { hash: mintHash } = await cedra.signAndSubmitTransaction({ signer: admin, transaction: mintTxn });
  await cedra.waitForTransaction({ transactionHash: mintHash });

  // Transfer back
  const transferTxn = await cedra.transaction.build.simple({
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::transfer`,
    arguments: [admin.accountAddress, 250],
  });
  const { hash: transferHash } = await cedra.signAndSubmitTransaction({ signer: user, transaction: transferTxn });
  await cedra.waitForTransaction({ transactionHash: transferHash });

  // Balances
  const balAdmin = await cedra.getFungibleAssetBalance({ accountAddress: admin.accountAddress, assetType: FA_TYPE });
  const balUser  = await cedra.getFungibleAssetBalance({ accountAddress: user.accountAddress,  assetType: FA_TYPE });
  console.log({ balAdmin, balUser });
}
```


## 5. Debug Cheat‑Sheet

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


## 6. Next Steps

* Fork [repo](https://github.com/cedra-labs/move-contract-examples/tree/main/fa-example) and tweak `ASSET_NAME`, `ASSET_SYMBOL`, `decimals`.
* Protect `MintRef` with a multisig.
* Build React hooks with SDK subscriptions for live balances.
* Check other examples in [Real World Guides](/real-world-guides) page.
