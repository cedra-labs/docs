---

id: fee-splitter
title: Fee Splitter Module
description: Split any fungible‑token payment among multiple recipients with a single Move call.
sidebar\_position: 5
---

The **Fee Splitter** lets an owner define recipients & proportional shares, then route a payment to all of them in one transaction. Works with **any** fungible asset (`CEDRA`, `USDC`, …) and is ideal for NFT royalties, marketplace fees, or affiliate payouts.

:::tip **Source code**: [GitHub – fee splitter module](https://github.com/cedra-labs/move-contract-examples/tree/main/fee-splitter)
:::

What you’ll learn
* How the Move module validates inputs and stores the split table
* How `distribute_fees` calculates exact payouts in overflow‑safe math
* How to call the contract from a TypeScript client (create ➜ distribute ➜ query)




## 1. Project Overview  🗂️

The splitter is a **keyed resource** that lives under its creator’s account. Its state is immutable-updating the split requires deploying a new resource - making audits trivial.

| Actor                | Why they use a splitter                                    |
| -------------------- | ---------------------------------------------------------- |
| Collection creator   | Share primary/secondary sales with collaborators           |
| Marketplace backend  | Route platform fees to treasury, referrer, bounty pool     |
| Game / metaverse DAO | Distribute tournament rewards to guilds & content creators |

Total shares are counted in **basis points** (parts‑per‑10 000). A `share = 250` equals **2.5 %**.



## 2. Use‑Case Gallery  💡

* **NFT Royalty** - 70 % artist / 30 % DAO → enables a single on‑chain call instead of two separate transfers.
* **Marketplace Fee** - 50 % treasury / 30 % referrer / 20 % bug‑bounty → keeps fee logic transparent & programmable.
* **Affiliate Drop** - 10 % early promoter / 90 % creator → removes off‑chain accounting.

## 3. Move Code Breakdown 🔍

### 3.1 Module declaration & imports


Declares the contract and pulls in Move‑standard helpers

```rust
module FeeSplitter::FeeSplitter {
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object::Object;
    use aptos_std::math64;
    use std::{vector, error, signer};
```

**Imports explained**

* `fungible_asset::Metadata` - type handle that identifies any fungible token (CEDRA, USDC …).
* `primary_fungible_store` - framework vault that debits/credits balances between accounts.
* `object::Object` - wrapper for referencing on‑chain objects such as metadata handles.
* `aptos_std::math64` - overflow‑safe 64‑bit multiply‑then‑divide helper used for proportional maths.
* `std::{vector, error, signer}` - core utilities for dynamic arrays, structured aborts, and signer introspection.

### 3.2 Constants & errors

Declare hard limits and machine‑readable abort codes, so clients can surface exact error messages.

```rust
const MAX_TOTAL_SHARES: u64 = 10000; // 100 %
const EINVALID_SHARE: u64      = 1;
const EINVALID_RECIPIENTS: u64 = 2;
const EINVALID_AMOUNT: u64     = 3;
const EINSUFFICIENT_BALANCE: u64 = 4;
const ESPLITTER_NOT_FOUND: u64   = 5;
const EINVALID_TOTAL_SHARES: u64 = 6;
```

**Explanation**

* `MAX_TOTAL_SHARES` caps aggregate shares at **10 000 bp = 100 %**.
* Each `E…` constant matches an `error::invalid_argument` or `error::not_found` call inside the functions.
* Apps can map these codes to human‑friendly toast messages.

### 3.3 Data structures

Declare the on‑chain *object* that stores the split table and the lightweight payload for each recipient.

```rust
struct Recipient has copy, drop, store {
    addr: address,
    share: u64, // parts of 10 000
}

struct FeeSplitter has key {
    recipients: vector<Recipient>,
    total_shares: u64,
    owner: address,
}
```

**Explanation**

* `Recipient` is a plain value struct, it can be freely copied inside memory.
* `FeeSplitter` bears the \`key\` ability → It is a *resource object* that lives at exactly **one account address** (`owner`).

  * Because objects are single‑owner, they form a natural ownership boundary: only the `owner` account can later `move_from` / destroy / replace the splitter.
  * Any call that needs the table (e.g., `distribute_fees`) borrows it via `acquires FeeSplitter`, enforcing exclusive access at runtime.
* Storing the `owner` field inside the struct is optional but handy for UI or cross‑module checks.

### 3.4 Create splitter

Validates recipient addresses and share amounts, then stores a new `FeeSplitter` object under the creator’s account so future fee distributions have an immutable ownership anchor.

```rust
public entry fun create_splitter(
    creator: &signer,
    addresses: vector<address>,
    shares: vector<u64>,
) {
    // …validation & assembly…
    move_to(creator, FeeSplitter { recipients, total_shares, owner: signer::address_of(creator) });
}
```

**Key points**

* Ensures arrays are non‑empty, equal length, and each share > 0.
* Rejects totals above **10 000** with `EINVALID_TOTAL_SHARES`.
* Stores the resource under `creator`; one splitter per owner.

### 3.5 Distribute fees

Route an incoming fungible token `amount` from the caller to every recipient in the splitter according to their shares, completing the entire payout in one Move transaction.

```rust
public entry fun distribute_fees(
    sender: &signer,
    splitter_owner: address,
    asset_metadata: Object<Metadata>,
    amount: u64,
) acquires FeeSplitter {
    let s = borrow_global<FeeSplitter>(splitter_owner);
    for i in 0..vector::length(&s.recipients) {
        let r = vector::borrow(&s.recipients, i);
        let part = math64::mul_div(amount, r.share, s.total_shares);
        if (part > 0) {
            primary_fungible_store::transfer(sender, asset_metadata, r.addr, part);
        }
    }
}
```

**Key points**

* **Token‑agnostic** - caller supplies a `asset_metadata` handle, so any FA can be split.

* **Exclusive read** - `acquires FeeSplitter` locks the object for the tx, preventing race conditions.

* **Exact maths** -  `math64::mul_div` prevents overflow/rounding issues when computing `amount * share / total`.

* **Remainder handling** - if `total_shares < 10 000`, the leftover stays with `sender` (often the marketplace contract).

### 3.6 Read‑only helpers

Return the full recipients vector and total shares for front‑ends or indexers.

```rust
#[view]
public fun get_splitter_info(
    splitter_addr: address
): (vector<Recipient>, u64) acquires FeeSplitter {
    let s = borrow_global<FeeSplitter>(splitter_addr);
    (s.recipients, s.total_shares)
}
```

**Key points**

* Returns *copies* of data; no risk of mutation.
* Fails with `ESPLITTER_NOT_FOUND` if the resource is missing.

Lightweight boolean to see if a splitter resource lives at an address.

```rust
#[view]
public fun splitter_exists(a: address): bool {
    exists<FeeSplitter>(a)
}
```

**Key points**

* Uses `exists<T>` intrinsic - O(1) storage lookup.
* Handy for gating UI flows before making heavier view calls.

####

Determine whether `recipient_addr` is listed in the splitter’s table.

```rust
#[view]
public fun is_recipient(
    splitter_addr: address,
    recipient_addr: address
): bool acquires FeeSplitter {
    if (!exists<FeeSplitter>(splitter_addr)) return false;
    let s = borrow_global<FeeSplitter>(splitter_addr);
    for i in 0..vector::length(&s.recipients) {
        if (vector::borrow(&s.recipients, i).addr == recipient_addr) return true;
    };
    false
}
```

**Key points**

* Early‑returns `false` if splitter isn’t deployed.
* Iterates linearly through recipients → fine for small vectors; consider indexing for 100+ payees.
* Useful for UI badges (“You earn X % of fees”).

---

---

## 4. Technical Notes  🛠️

:::note Basis‑points maths
`share = 100` ⇒ 1 %   |   `share = 2 500` ⇒ 25 %
Aggregate shares must not exceed **10 000 bp (100 %)**.
:::

* **Remainder handling** – If `total_shares` less than 10 000 the unallocated fraction stays with the payer, if it exceeds the limit the tx aborts with `EINVALID_TOTAL_SHARES`.
* **Gas profile** – Algorithm is `O(n)` over recipients.
* **Token‑agnostic** – Works with any fungible asset, caller supplies the `Metadata` handle so decimals/precision are respected automatically.
* **Upgrade pattern** – Publish a new splitter (or use a proxy) to change recipients, immutable design keeps old splits auditable.
* **Edge‑case guards** – Rejects empty arrays, zero shares, amount ≤ 0, or missing resource to prevent mis‑configuration.


## 5 TypeScript Client  🤝

**Here is** a complete front‑end flow that funds test wallets, publishes the split table, sends a payment, and reads back on‑chain state - everything a dApp needs to integrate the splitter.

```ts

// -----------------------------------------------------------------------------
// Fee Splitter client wrapper
class FeeSplitterClient {
  private aptos: Aptos;
  private moduleAddress: string;
  private moduleName: string;

  constructor(network: Network, moduleAddress: string = MODULE_ADDRESS) {
    if (moduleAddress === "_") {
      console.warn("⚠️  MODULE_ADDRESS not set - deploy the contract then update this constant.");
    }
    this.aptos = new Aptos(new AptosConfig({ network }));
    this.moduleAddress = moduleAddress;
    this.moduleName = MODULE_NAME;
  }

  /* ---------------- faucet helpers ---------------- */
  async fundAccount(addr: AccountAddress, amount: number = ONE_CEDRA) {
    await this.aptos.faucet.fundAccount({ accountAddress: addr, amount });
  }

  /* ---------------- metadata helpers -------------- */
  getCEDRAMetadata(): string {
    return "0x000000000000000000000000000000000000000000000000000000000000000a";
  }

  /* ---------------- splitter calls ---------------- */
  async createSplitter(creator: Account, recips: { address: AccountAddress; share: number }[]) {
    const addresses = recips.map(r => r.address.toString());
    const shares    = recips.map(r => r.share.toString());

    const txn = await this.aptos.transaction.build.simple({
      sender: creator.accountAddress,
      data: {
        function: `${this.moduleAddress}::${this.moduleName}::create_splitter`,
        functionArguments: [addresses, shares],
      },
    });
    const res = await this.aptos.signAndSubmitTransaction({ signer: creator, transaction: txn });
    await this.aptos.waitForTransaction({ transactionHash: res.hash });
  }

  async distributeFees(sender: Account, splitterOwner: AccountAddress, amount: number) {
    const txn = await this.aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: `${this.moduleAddress}::${this.moduleName}::distribute_fees`,
        functionArguments: [splitterOwner.toString(), this.getCEDRAMetadata(), amount.toString()],
      },
    });
    const res = await this.aptos.signAndSubmitTransaction({ signer: sender, transaction: txn });
    await this.aptos.waitForTransaction({ transactionHash: res.hash });
  }

  async getSplitterInfo(splitterAddr: AccountAddress): Promise<SplitterInfo | null> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddress}::${this.moduleName}::get_splitter_info`,
        functionArguments: [splitterAddr.toString()],
      },
    });
    const [recipients, totalShares] = result as [Recipient[], string];
    return { recipients, total_shares: totalShares };
  }
}

// -----------------------------------------------------------------------------
// HAPPY‑PATH DEMO - fund ➜ create ➜ distribute ➜ query
const runHappyPath = async () => {
  console.log("🚀 Fee Splitter happy‑path demo");
  const client = new FeeSplitterClient(Network.DEVNET, MODULE_ADDRESS);

  // 1️⃣ Generate & fund actors
  const creator    = Account.generate();
  const recipient1 = Account.generate();
  const recipient2 = Account.generate();
  const payer      = Account.generate();

  await Promise.all([
    client.fundAccount(creator.accountAddress),
    client.fundAccount(recipient1.accountAddress, ONE_CEDRA / 10),
    client.fundAccount(recipient2.accountAddress, ONE_CEDRA / 10),
    client.fundAccount(payer.accountAddress),
  ]);

  // 2️⃣ Create 60/40 splitter
  await client.createSplitter(creator, [
    { address: recipient1.accountAddress, share: 60 },
    { address: recipient2.accountAddress, share: 40 },
  ]);

  // 3️⃣ Pay 0.01 CEDRA and auto‑split
  await client.distributeFees(payer, creator.accountAddress, EXAMPLE_AMOUNT);

  // 4️⃣ Read back state
  const info = await client.getSplitterInfo(creator.accountAddress);
  console.log(info);
};
```

**Happy‑path explained**

1. **Fund wallets** - Faucet mints test tokens and gas for each freshly generated account.
2. **Create splitter** - Calls `create_splitter`, storing a `FeeSplitter` object with a 60/40 share table.
3. **Distribute fees** - `distribute_fees` transfers 0.01 CEDRA from `payer` to the two recipients in one tx.
4. **Query state** - `get_splitter_info` (a `#[view]` function) returns the recipients vector & total shares for UI confirmation.

## 6 · Next Steps  🚀

* Add a `revoke_recipient` flow by publishing a V2 module that supports mutable vectors.
* Integrate with an NFT minting contract to auto‑forward royalties on every sale.
* Check other examples in [Real World Guides](/real-world-guides) page.
```
