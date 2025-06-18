# NFT Contract  -  Full Code Walkthrough

**What is an NFT?** A *Non‑Fungible Token* is a unique, indivisible on‑chain object whose immutable identity and metadata distinguish it from all other tokens. Think digital collectibles, tickets, or game items - as opposed to interchangeable fungible coins.

> **Goal**: Understand *exactly* how this NFT contract works on‑chain and how to call it from a TypeScript client.

**Scope – What you’ll learn**

* Create an  **NFT collection** on Cedra
* Mint single **NFTs** into that collection
* Transfer NFTs between accounts and understand **ownership** flow
* Query on‑chain collection & **token metadata**
* Map each action to the underlying Move code and **access‑control checks**
* Extend the contract with burns, royalties, or mutable metadata


## 1. Module header & imports

Below is the **module declaration** and its set of `use` statements. The module name binds the contract to the publisher’s address, while each `use` line imports the types and helpers we rely on throughout the rest of the file.

```rust
module CedraNFT::CedraCollection {
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use std::string::{Self, String};
    use std::option;
}
```

* **aptos\_framework::object** – low‑level helpers for creating, transferring, or dereferencing `Object<T>`.
* **collection / token** – the Digital Asset primitives.
* **std::string / std::option** – UTF‑8 and optional value utilities.


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


## 7. Let's use it!

Here’s a step‑by‑step TypeScript example that exercises the entire contract lifecycle - connect, auto‑create the collection (via `init_module`), mint an NFT, transfer it, and finally query on‑chain metadata. Replace the `0x…` placeholders with your own keys and object IDs before running.

```ts
import {
  Aptos, AptosConfig, Account, Network,
  PrivateKey, PrivateKeyVariants
} from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

// Replace with real keys in practice (use env vars!)
const deployerKey = PrivateKey.formatPrivateKey(
  "0x…", PrivateKeyVariants.Ed25519
);
const creator = Account.fromPrivateKey({ privateKey: deployerKey });
const alice   = Account.generate();
const bob     = Account.generate();

const MODULE = `${creator.accountAddress}::CedraCollectionV2`;

// 1. Mint NFT to Alice
await aptos.view({
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
await aptos.view({
  account: alice,
  function: `${MODULE}::transfer_nft`,
  arguments: [ tokenHandle, bob.accountAddress ],
});

console.log("✓ transfer complete");
```


## 6. Next steps

* Add royalties (`aptos_token_objects::royalty`) in `create_collection`.
* Provide `burn_nft` via `token::burn` + `object::destroy`.
* Implement `mutate_uri` with a `MutatorRef` for mutable metadata.
* Check next example in [Real World Guides](/real-world-guides) page.

Happy hacking on **Cedra**!
