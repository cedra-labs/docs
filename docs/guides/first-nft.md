# NFT Contract  -  Full Code Walkthrough

:::tip Prerequisites
Before starting this guide, make sure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs) - Required for development toolchain
- ✅ [Installed the Cedra CLI](/getting-started/cli) - Essential for deploying contracts
- ✅ [Obtained test tokens from the faucet](/getting-started/faucet) - Needed for deployment gas
:::

**What is an NFT?** A *Non‑Fungible Token* is a unique, indivisible on‑chain object whose immutable identity and metadata distinguish it from all other tokens. Think digital collectibles, tickets, or game items - as opposed to interchangeable fungible coins.

> **Goal**: Understand *exactly* how this NFT contract works on‑chain and how to call it from a TypeScript client.

**Scope – What you’ll learn**

* Create an  **NFT collection** on Cedra
* Mint single **NFTs** into that collection
* Transfer NFTs between accounts and understand **ownership** flow
* Query on‑chain collection & **token metadata**
* Map each action to the underlying Move code and **access‑control checks**
* Extend the contract with burns, royalties, or mutable metadata

:::tip **Source code**: [GitHub – NFT module](https://github.com/cedra-labs/move-contract-examples/tree/main/nft-example)
:::

:::info Move Concepts Applied
This NFT implementation demonstrates key Move concepts:
- **[Resource Safety](/move/resource)** - NFTs are unique resources that can't be duplicated
- **[Module Organization](/move/modules)** - Clean separation of initialization, minting, and transfer logic
- **[View Functions](/move/functions#view-functions)** - Gas-free queries for collection data
- **[Access Control](/move/errors#the-anatomy-of-good-error-handling)** - Creator-only minting with assert checks
:::


## 1. Module header & imports

Below is the **module declaration** and its set of `use` statements. The module name binds the contract to the publisher’s address, while each `use` line imports the types and helpers we rely on throughout the rest of the file.

```rust
module CedraNFT::CedraCollection {
    use cedra_framework::object::{Self, Object};
    use cedra_token_objects::collection;
    use cedra_token_objects::token;
    use std::string::{Self, String};
    use std::option;
}
```

* **cedra\_framework::object** – low‑level helpers for creating, transferring, or dereferencing `Object<T>`.
* **collection / token** – the Digital Asset primitives.
* **std::string / std::option** – UTF‑8 and optional value utilities.

:::tip Pro Tip
Each `use` statement imports specific functionality - think of it as your toolkit for building NFTs!
:::

## 2. Initialization & collection setup

When the module is published, Cedra automatically invokes a tiny initializer that spins up the NFT **collection container** in the very same transaction. This ensures the collection exists before any minting logic is executed.

```rust
fun init_module(admin: &signer) {
    create_collection(admin);
}

public entry fun create_collection(creator: &signer) {
    let name        = string::utf8(COLLECTION_NAME);
    let description = string::utf8(COLLECTION_DESCRIPTION);
    let uri         = string::utf8(COLLECTION_URI);

    collection::create_unlimited_collection(
        creator,          // signer / future owner
        description,
        name,
        option::none(),   // optional royalty struct (none for now)
        uri,
    );
}
```

**Key factors**

* Everything happens inside the `move publish` transaction - no follow‑up calls.
* The publisher’s signer becomes the **collection owner**.
* Uses `create_unlimited_collection`, so the supply is unbounded.
* No royalties yet (`option::none()`), leaving room for your upgrades.

:::info Quick Insight
The `init_module` function runs automatically when you publish your contract. This means your collection is ready to use immediately after deployment - no extra setup required!
:::

## 3. Creator‑gated mint

Allows the collection creator to mint a single‑supply NFT and immediately hand it to any recipient address. Under the hood, it:

1. Confirms the caller is the collection owner
2. Converts the collection name constant from bytes to `String`
3. Calls `token::create_named_token` with `supply = 1` to mint a unique token
4. Uses `object::transfer` to deliver the NFT to recipient

```rust
public entry fun mint_nft(
    creator: &signer,
    to: address,
    name: String,
    description: String,
    uri: String,
) {
    let expected_creator = signer::address_of(creator);
    assert!(expected_creator == signer::address_of(creator), ENOT_CREATOR);

    let collection_name = string::utf8(COLLECTION_NAME);

    let token_obj = token::create_named_token(
        creator,
        collection_name,
        name,
        description,
        1,
        0,
        uri,
        option::none(),
    );

    object::transfer(token_obj, to);
}
```

**Key factors**

* Caller must be the original collection owner otherwise, aborts with `ENOT_CREATOR`.
* `supply = 1` enforces non‑fungible uniqueness.
* Immediately transfers ownership, so the NFT never sits in the creator’s account.

:::warning Security Note
Notice the `assert!` check? This prevents unauthorized minting. Only the original collection creator can mint new NFTs - this is your access control in action!
:::

## 5. Transfer NFT

A thin wrapper around `object::transfer` that moves an existing NFT object from the signer to a new owner.

```rust
public entry fun transfer_nft(
    from: &signer,
    object: Object<token::Token>,
    to: address,
) {
    object::transfer(object, to);
}
```

**Key factors**

* Signer (`from`) must own `object`, or the transaction aborts with the framework’s permission error.
* Reuses the object system’s built‑in permission checks - no custom logic required.
* Returns nothing; success means the object has already changed hands on‑chain.

:::tip Gas Saver
Transfers use Move's built-in object system, which handles all the ownership validation for you. This means secure transfers with minimal gas costs!
:::

## 6. Read‑only helpers

Each helper is annotated with `#[view]`, meaning it can be executed  without gas fees. They expose collection ownership, existence, and metadata in a lightweight and predictable manner.

### 6.1 Get collection owner

Returns the address that currently owns the collection object.

```rust
#[view]
public fun get_collection_owner(creator_addr: address): address {
    let name = string::utf8(COLLECTION_NAME);
    let coll_addr = collection::create_collection_address(&creator_addr, &name);
    let obj = object::address_to_object<collection::Collection>(coll_addr);
    object::owner(obj)
}
```

**Key factors**

* Deterministically reconstructs the collection address from `creator_addr` + constant name.
* Converts the address into an `Object<collection::Collection>` to invoke `object::owner`.

### 6.2 Check collection existence

Boolean guard that prevents aborts when dereferencing a non‑existent collection.

```rust
#[view]
public fun collection_exists(creator_addr: address): bool {
    let name = string::utf8(COLLECTION_NAME);
    let coll_addr = collection::create_collection_address(&creator_addr, &name);
    object::exists_at<collection::Collection>(coll_addr)
}
```

**Key factors**

* Same deterministic address calculation as above.
* `object::exists_at` returns `false` instead of aborting, make it safe for front‑end checks.

### 6.3 Get collection metadata

Fetches the collection’s name, description, and URI, or empty strings if the collection hasn’t been created.

```rust
#[view]
public fun get_collection_data(creator_addr: address): (String, String, String) {
    if (collection_exists(creator_addr)) {
        let name = string::utf8(COLLECTION_NAME);
        let coll_addr = collection::create_collection_address(&creator_addr, &name);
        let obj = object::address_to_object<collection::Collection>(coll_addr);
        (
            collection::name(obj),
            collection::description(obj),
            collection::uri(obj),
        )
    } else {
        (string::utf8(b""), string::utf8(b""), string::utf8(b"")) }
}
```

**Key factors**

* Call `collection_exists` first to avoid aborts.
* Returns three empty strings as a defined fallback when the collection is missing.

:::note Developer Friendly
These `#[view]` functions are free to call! Use them liberally in your frontend to check state without spending gas.
:::

## 7. Let's use it!

Here’s a step‑by‑step TypeScript example that exercises the entire contract lifecycle - connect, auto‑create the collection (via `init_module`), mint an NFT, transfer it, and finally query on‑chain metadata. Replace the `0x…` placeholders with your own keys and object IDs before running.

```ts
import {
  Aptos, AptosConfig, Account, Network,
  PrivateKey, PrivateKeyVariants
} from "@cedra-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const cedra = new Cedra(config);

// Replace with real keys in practice (use env vars!)
const deployerKey = PrivateKey.formatPrivateKey(
  "0x…", PrivateKeyVariants.Ed25519
);
const creator = Account.fromPrivateKey({ privateKey: deployerKey });
const alice   = Account.generate();
const bob     = Account.generate();

const MODULE = `${creator.accountAddress}::CedraCollectionV2`;

// 1. Mint NFT to Alice
await cedra.view({
  account: creator,
  function: `${MODULE}::mint_nft`,
  arguments: [
    alice.accountAddress,
    "Rare Cedra Dragon #42",
    "A legendary dragon",
    "https://metadata.cedra.dev/dragons/42.json",
  ],
});

// 2. Alice transfers to Bob
const tokenHandle = "0x...object-id...";
await cedra.view({
  account: alice,
  function: `${MODULE}::transfer_nft`,
  arguments: [ tokenHandle, bob.accountAddress ],
});

console.log("✓ transfer complete");
```

:::caution Before You Run
Remember to replace the placeholder keys and addresses with real values! For production, always use environment variables to store private keys securely.
:::

## 6. Next steps

* Add royalties (`cedra_token_objects::royalty`) in `create_collection`.
* Provide `burn_nft` via `token::burn` + `object::destroy`.
* Implement `mutate_uri` with a `MutatorRef` for mutable metadata.
* Check other examples in [Real World Guides](/real-world-guides) page.
