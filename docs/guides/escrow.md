---
title: Build an Escrow Contract
sidebar_position: 3
---

# Build an Escrow Contract

In this guide, we'll walk through how escrow works by explaining its flow. We'll cover how funds are locked, released, or returned in a secure and predictable way.

The escrow system supports two types of locking:

* Simple escrow (manual release)
* Time-locked escrow (claimable after a specific time)

## Before we start - check these resources

:::tip **Source code**: [GitHub – escrow module](https://github.com/cedra-labs/move-contract-examples/tree/main/lock)
:::

 * Local dev env ([ENV](/docs/getting-started))
 * A fungible asset (like the one from [First FA](/docs/guides/first-fa))

## Core Data Structures

Escrow module is built around three key data types that enable object-level control over token locking. Understanding these will help you reason about how escrows are tracked and managed.

### `LockupRef`

A small resource that lives in the user's account. It stores the address of the user's `Lockup` object.

```rust
/// The lookup to object for escrow in an easily addressible spot
struct LockupRef has key {
    lockup_address: address,
}
```

* **Why it's important**: it prevents multiple lockups per account and keeps the link between the account and their escrow manager explicit.
* **Think of it as**: a pointer from your wallet to your personal escrow vault.

### `Lockup`

An on-chain object that manages all escrow entries for a single user.

```rust
/// A single lockup, which has the same lockup period for all of them
enum Lockup has key {
    ST {
        creator: address,
        /// Used to control funds in the escrows
        extend_ref: ExtendRef,
        /// Used to cleanup the Lockup object
        delete_ref: DeleteRef,
        escrows: SmartTable<EscrowKey, address>
    }
}
```

* It has a field called `escrows`, which is a dynamic map of all ongoing escrows the user has opened.
* It also holds `extend_ref` and `delete_ref` to manage storage properly.
* **Why it's important**: This is your actual escrow registry. Every deposit, claim, or refund is routed through it.

### `Escrow`

This is the structure that holds the funds and defines when they can be withdrawn.

```rust
/// An escrow object for a single user and a single FA
enum Escrow has key {
    Simple {
        original_owner: address,
        delete_ref: DeleteRef,
    },
    TimeUnlock {
        original_owner: address,
        /// Time that the funds can be unlocked
        unlock_secs: u64,
        delete_ref: DeleteRef,
    }
}
```

* It comes in two variants:

  * `Simple`: can be claimed or refunded anytime.
  * `TimeUnlock`: can only be touched after a specific unlock time.
* Each escrow also knows who originally sent the funds and has a `delete_ref` for cleanup.

:::info **Storage Management**
Notice how each structure has a `delete_ref`? This enables automatic storage cleanup and refunds when escrows are completed, keeping the blockchain efficient.
:::

## Step 1: Creating a Lockup


Before a user can deposit funds into escrow, they must create their personal lockup manager. This is handled by the `initialize_lockup` function, which sets up two key things: a `Lockup` object stored on-chain, and a `LockupRef` resource stored in the user’s account:

```rust
/// Initializes a lockup at an address
public entry fun initialize_lockup(
    caller: &signer,
) {
    init_lockup(caller);
}

inline fun init_lockup(caller: &signer): Object<Lockup> {
    let caller_address = signer::address_of(caller);

    // Create the object only if it doesn't exist, otherwise quit out
    assert!(!exists<LockupRef>(caller_address), E_LOCKUP_ALREADY_EXISTS);

    // Create the object
    let constructor_ref = object::create_object(@0x0);
    let lockup_address = object::address_from_constructor_ref(&constructor_ref);
    let extend_ref = object::generate_extend_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);
    let obj_signer = object::generate_signer(&constructor_ref);
    move_to(&obj_signer, Lockup::ST {
        creator: caller_address,
        escrows: smart_table::new(),
        extend_ref,
        delete_ref
    });

    // This is specifically to ensure that we don't create two lockup objects, we put a marker in the account
    move_to(caller, LockupRef {
        lockup_address
    });
    object::object_from_constructor_ref(&constructor_ref)
}
```
The function first checks whether a `LockupRef` already exists for the caller. This ensures that users don’t accidentally create multiple lockups. If one already exists, the function aborts with a clear error.

If the check passes, a new lockup is created using Move object model. A constructor reference is generated, from which we derive the object’s address and prepare two important lifecycle controls: `extend_ref` and `delete_ref`. These are used later to either extend the object’s capabilities or clean it up and reclaim storage.

The core of the lockup is the `escrows` field, which is initialized as an empty `SmartTable`. This will eventually hold mappings between each asset-user pair and the corresponding escrow object. The lockup is finalized by writing the object on-chain with the current user set as its creator.

Lastly, a `LockupRef` resource is stored directly in the user’s account. This small but critical structure keeps track of which `Lockup` object belongs to the account, enabling the rest of the escrow system to function correctly.

:::warning **Mandatory Setup**
This setup step is mandatory. Without it, no user can participate in the escrow system. Once complete, users can proceed to lock funds using the `escrow_funds_with_no_lockup` or `escrow_funds_with_time` flows.
:::

## Step 2: Locking Funds into Escrow

There are two ways to lock tokens:

### Simple Escrow

Once you’ve initialized your lockup, you can deposit funds into escrow. The `escrow_funds_with_no_lockup` function is used when you don’t want to enforce a time-based restriction.

```rust
/// Escrows funds with no lockup time
public entry fun escrow_funds_with_no_lockup(
    caller: &signer,
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    amount: u64,
) acquires Lockup, Escrow {
    let caller_address = signer::address_of(caller);
    let lockup_address = object::object_address(&lockup_obj);
    let lockup = &mut Lockup[lockup_address];

    let lockup_key = EscrowKey::FAPerUser {
        fa_metadata,
        user: caller_address
    };

    let escrow_address = lockup.escrows.borrow_mut_with_default(lockup_key, @0x0);

    // If we haven't found it, create a new escrow object
    if (escrow_address == &@0x0) {
        let constructor_ref = object::create_object(lockup_address);
        let object_signer = object::generate_signer(&constructor_ref);
        let object_delete_ref = object::generate_delete_ref(&constructor_ref);

        // Make it a store to keep the escrow funds
        fungible_asset::create_store(&constructor_ref, fa_metadata);

        // Store the appropriate info for the funds
        move_to(&object_signer, Escrow::Simple {
            original_owner: caller_address,
            delete_ref: object_delete_ref
        });
        // Save it to the table
        *escrow_address = object::address_from_constructor_ref(&constructor_ref);
    }

    // Now transfer funds into the escrow
    escrow_funds(caller, fa_metadata, *escrow_address, caller_address, amount);
}
```

When you call this function, it starts by getting your account address and loading your existing `Lockup` object. It then constructs a unique key based on the token you're depositing and your account. This key is used to look up or create an escrow entry for you.

If an escrow doesn’t already exist, a new object is created and set up to hold the tokens. That includes creating a `FungibleStore` inside the object and moving an `Escrow::Simple` resource into it. Your ownership of this escrow is recorded, along with a `delete_ref` to support safe deletion and storage refunding later.

Once the escrow exists, the function moves the specified amount of tokens from your account into the escrow. Now the funds are locked, and the lockup manager controls what happens next.

### Time-Locked Escrow

Sometimes, you want to make sure funds stay locked until a specific time. That’s what `escrow_funds_with_time` is for. It works just like the simple escrow deposit, but adds a built-in restriction: funds can’t be touched until a future timestamp is reached.

This is useful for vesting, delayed payouts, milestone-based releases, or protecting both sides in a timed exchange.

```rust
/// Escrows funds with a user defined lockup time
public entry fun escrow_funds_with_time(
    caller: &signer,
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    amount: u64,
    lockup_time_secs: u64,
) acquires Lockup, Escrow {
    let caller_address = signer::address_of(caller);
    let lockup_address = object::object_address(&lockup_obj);
    let lockup = &mut Lockup[lockup_address];

    let lockup_key = EscrowKey::FAPerUser {
        fa_metadata,
        user: caller_address
    };

    let escrow_address = lockup.escrows.borrow_mut_with_default(lockup_key, @0x0);
    
    let new_unlock_secs = timestamp::now_seconds() + lockup_time_secs;

    // If we haven't found it, create a new escrow object
    if (escrow_address == &@0x0) {
        let constructor_ref = object::create_object(lockup_address);
        let object_signer = object::generate_signer(&constructor_ref);
        let object_delete_ref = object::generate_delete_ref(&constructor_ref);

        // Make it a store to keep the escrow funds
        fungible_asset::create_store(&constructor_ref, fa_metadata);

        // Store the appropriate info for the funds
        move_to(&object_signer, Escrow::TimeUnlock {
            original_owner: caller_address,
            unlock_secs: new_unlock_secs,
            delete_ref: object_delete_ref
        });
        // Save it to the table
        *escrow_address = object::address_from_constructor_ref(&constructor_ref);
    }

    // Now transfer funds into the escrow
    escrow_funds(caller, fa_metadata, *escrow_address, caller_address, amount);
}
```

The setup starts the same way as the simple escrow - it looks up your lockup, checks if an escrow entry already exists for your (account, token) pair, and creates one if needed.

What’s new is how the time restriction is applied:

When you call this function, you pass in the number of seconds the tokens should remain locked. The contract adds that to the current blockchain timestamp and stores the result as `unlock_secs` in the escrow object.

Once the time lock is set, the funds are transferred into the escrow object the same way as before. But now they're unclaimable until the `unlock_secs` timestamp is reached.

:::tip **Choosing Escrow Types**
Use **Simple** escrow for manual control (like milestone payments), and **Time-Locked** escrow for automatic releases (like vesting schedules or delayed transfers).
:::

## Step 3: Releasing Funds

After locking funds, there are three ways they can be released:

### Claim by Lockup Owner

When the time is right - or when no time lock exists - the recipient of an escrowed payment can claim the funds using the `claim_escrow` function. This is the standard flow for a lockup creator to collect funds that someone else deposited into escrow.

```rust
/// Claims an escrow by the owner of the escrow
public entry fun claim_escrow(
    caller: &signer,
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    user: address,
) acquires Lockup, Escrow {
    let caller_address = signer::address_of(caller);
    let lockup = get_lockup_mut(&lockup_obj);
    assert!(caller_address == lockup.creator, E_NOT_ORIGINAL_OR_LOCKUP_OWNER);
    let (lockup_key, escrow_address) = lockup.get_escrow(
        fa_metadata,
        user
    );

    // Take funds from lockup
    lockup.take_funds(fa_metadata, escrow_address);

    // Clean up the object
    lockup.delete_escrow(lockup_key);
}
```

When you call `claim_escrow`, the contract first checks that you’re the creator of the lockup. This is a strict ownership rule - only the intended recipient of the escrow can claim the funds.
Once verified, the escrow object is looked up using the combination of token metadata and the sender’s address. This identifies the specific escrow entry associated with that deposit. The function then calls an internal helper to move the escrowed funds from the escrow’s `FungibleStore` into the recipient’s primary store. This is a direct transfer that respects the Move resource model.

After the funds are transferred, the escrow object is deleted. This both reclaims storage and ensures there’s no lingering state tied to the now-completed escrow.

### Return by Lockup Owner

Sometimes, instead of claiming escrowed funds, the lockup creator may want to return them to the original sender. This is exactly what the `return_user_funds` function is for. Use this when a deal falls through, a milestone isn’t reached, or you simply want to refund the depositor.

```rust
/// Returns funds for the user
public entry fun return_user_funds(
    caller: &signer,
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    user: address,
) acquires Lockup, Escrow {
    let caller_address = signer::address_of(caller);
    let lockup = get_lockup_mut(&lockup_obj);
    assert!(caller_address == lockup.creator, E_NOT_ORIGINAL_OR_LOCKUP_OWNER);
    let (lockup_key, escrow_address) = lockup.get_escrow(
        fa_metadata,
        user
    );

    // Determine original owner, and any conditions on returning
    let original_owner = match (&Escrow[escrow_address]) {
        Escrow::Simple { original_owner, .. } => {
            *original_owner
        }
        Escrow::TimeUnlock { original_owner, .. } => {
            // Note, the lockup owner can reject the unlock faster than the unlock time
            *original_owner
        }
    };

    lockup.return_funds(fa_metadata, escrow_address, original_owner);

    // Clean up the object
    lockup.delete_escrow(lockup_key);
}
```

When creator call `return_user_funds`, the function first verifies that you’re authorized to manage this lockup. Then it locates the specific escrow entry by combining the token and the address of the original depositor.

Next, it checks the type of escrow stored. Regardless of whether it’s a `Simple` or `TimeUnlock` escrow, the function extracts the original sender’s address - the person who should get the tokens back.

:::note Time lock is not enforced here. The assumption is that the lockup owner is intentionally choosing to return funds, possibly even before the unlock time.
:::

Finally, the tokens are transferred from the escrow object back to the original sender, and the escrow entry is deleted. That deletion also cleans up the on-chain state and reclaims storage.

### Return by Original Sender (Self-Unlock)

In some cases, you may want to take your funds back from escrow - especially if the other party hasn't claimed them or if you're using a time-locked escrow that has expired. The `return_my_funds` function gives the original sender a way to recover their tokens.

```rust
/// Returns funds for the caller
public entry fun return_my_funds(
    caller: &signer,
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
) acquires Lockup, Escrow {
    let caller_address = signer::address_of(caller);
    let lockup = get_lockup_mut(&lockup_obj);
    let (lockup_key, escrow_address) = lockup.get_escrow(
        fa_metadata,
        caller_address
    );

    // Determine original owner, and any conditions on returning
    let original_owner = match (&Escrow[escrow_address]) {
        Escrow::Simple { original_owner, .. } => {
            *original_owner
        }
        Escrow::TimeUnlock { original_owner, unlock_secs, .. } => {
            assert!(timestamp::now_seconds() >= *unlock_secs, E_UNLOCK_TIME_NOT_YET);
            *original_owner
        }
    };

    // To prevent others from being annoying, only the original owner can return funds
    assert!(original_owner == caller_address, E_NOT_ORIGINAL_OR_LOCKUP_OWNER);
    lockup.return_funds(fa_metadata, escrow_address, original_owner);

    // Clean up the object
    lockup.delete_escrow(lockup_key);
}
```

This function is designed to be used by the person who originally deposited funds into escrow. It looks up the escrow entry based on your account and the token type. Once it finds the escrow, the contract checks whether the funds are time-locked. If they are, it verifies that the unlock time has passed. If the time hasn't passed yet, the function aborts — this prevents users from bypassing time locks.

:::caution **Time lock enforcement**
Unlike `return_user_funds`, this function **strictly enforces** time locks. Original senders cannot retrieve their funds early from time-locked escrows.
:::

After confirming that you're allowed to withdraw, the function double-checks that you are the original owner of the escrow. This prevents malicious callers from trying to extract someone else's deposit.

Finally, the funds are moved from the escrow's storage back into your account, and the escrow object is deleted to clean up the on-chain state.

## Step 4: Checking Status

As you interact with escrow contracts — whether you're locking, claiming, or returning tokens — it’s important to have visibility into the state of your escrows. The module provides several view-only functions that help you do exactly that.

These functions are read-only and can be used by frontends, dashboards, or scripts to show real-time escrow status without modifying the blockchain.

Use `lockup_address` to find the on-chain `Lockup` object address for a given user account.

```rust
#[view]
/// Tells the lockup address for the user who created the original lockup
public fun lockup_address(escrow_account: address): address acquires LockupRef {
    LockupRef[escrow_account].lockup_address
}
```

This is useful when you want to interact with someone else’s lockup (e.g. you're depositing funds into their escrow), but only have their account address.


Use `escrowed_funds` to see how many tokens are currently locked in escrow for a given (user, token) pair.

```rust
#[view]
/// Tells the amount of escrowed funds currently available
public fun escrowed_funds(
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    user: address
): Option<u64> acquires Lockup {
    let lockup = get_lockup(&lockup_obj);
    let escrow_key = EscrowKey::FAPerUser {
        fa_metadata,
        user
    };
    if (lockup.escrows.contains(escrow_key)) {
        let escrow_address = lockup.escrows.borrow(escrow_key);
        let escrow_obj = object::address_to_object<Escrow>(*escrow_address);
        option::some(fungible_asset::balance(escrow_obj))
    } else {
        option::none()
    }
}
```

If the escrow exists, the function returns the balance as `Option<u64>` — otherwise it returns `none`. You can use this in a frontend to show locked token amounts for a wallet.


Use `remaining_escrow_time` to check how many seconds are left before a time-locked escrow can be released.

```rust
#[view]
/// Tells the remaining time until escrow unlock
public fun remaining_escrow_time(
    lockup_obj: Object<Lockup>,
    fa_metadata: Object<Metadata>,
    user: address
): Option<u64> acquires Lockup, Escrow {
    let lockup = get_lockup(&lockup_obj);
    let escrow_key = EscrowKey::FAPerUser {
        fa_metadata,
        user
    };
    if (lockup.escrows.contains(escrow_key)) {
        let escrow_address = lockup.escrows.borrow(escrow_key);
        let remaining_secs = match (&Escrow[*escrow_address]) {
            Simple { .. } => { 0 }
            TimeUnlock { unlock_secs, .. } => {
                let now = timestamp::now_seconds();
                if (now >= *unlock_secs) {
                    0
                } else {
                    *unlock_secs - now
                }
            }
        };
        option::some(remaining_secs)
    } else {
        option::none()
    }
}
```

If the escrow is of type `Simple`, the function will return 0. If it's a `TimeUnlock` escrow, it subtracts the current blockchain timestamp from the unlock timestamp.

:::info **Frontend Integration**
These view functions are perfect for building dashboards and user interfaces. They don't consume gas and provide real-time escrow status without any side effects.
:::

You now understand escrow as a user flow - not just code.

## Conclusion

At the heart of the system are three key components: `LockupRef`, which links a user account to their lockup manager; `Lockup`, an on-chain object that holds and manages escrow entries; and `Escrow`, which stores actual tokens and controls how they can be claimed or returned. These abstractions separate ownership, logic, and control — giving developers and users a clean, auditable lifecycle for escrowed funds.

Escrow flows begin with a one-time lockup initialization, which sets up a new `Lockup` object and stores a reference to it in the user's account. From there, funds can be deposited into escrow via two entry points: a simple version with no time restrictions and a time-locked version that prevents access until a specified timestamp. Each deposit creates or reuses an `Escrow` object tied to a unique (token, user) pair.

### What's Next?

Now that you understand how escrow works, you can:
* **Build your own tokens**: Create fungible assets using our [First FA Guide](/docs/guides/first-fa) 
* **Explore more contracts**: Check out other [Move examples](https://github.com/cedra-labs/move-contract-examples) for inspiration

