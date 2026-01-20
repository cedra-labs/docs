---
id: randomness
title: On-Chain Randomness
description: Build a secure random winner selector for airdrops, raffles, and whitelist spots using Cedra's native randomness.
sidebar_position: 6
---

The **Random Selector** uses Cedra's on-chain randomness to fairly select winners from a pool of candidates - perfect for airdrops, raffles, whitelist spots, or any scenario requiring verifiable random selection.

:::tip Prerequisites
Before starting this guide, make sure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs)
- ✅ [Installed the Cedra CLI](/getting-started/cli)
- ✅ [Obtained test tokens from the faucet](/getting-started/faucet)
:::

:::tip **Source code**: [GitHub – randomness example](https://github.com/cedra-labs/move-contract-examples/tree/main/randomness-example)
:::

The contract maintains a pool of candidate addresses under an admin account. When it's time to pick winners, the admin calls `select_winners(n)` or `select_one()`, and the contract uses Cedra's native randomness to choose fairly. Results come back as events since Move entry functions can't return values directly.

Typical use cases:
- **Airdrop organizers** selecting recipients from eligible addresses
- **NFT projects** picking whitelist spots from a waitlist
- **Game developers** distributing prizes among participants
- **DAOs** randomly selecting committee members

## Security Considerations

On-chain randomness requires special care. Without proper safeguards, attackers can game the system by calling your random function through their own contract, checking if the result is favorable, and aborting if not - retrying until they win.

Cedra prevents this with the `#[randomness]` attribute. Functions using randomness **must** have this attribute and **must** be private (not `public entry`):

```rust
#[randomness]
entry fun select_winners(admin: &signer, n: u64) {
    let idx = randomness::u64_range(0, n);
    // ...
}
```

The compiler enforces this - if you try to make a randomness function public, it won't compile unless you explicitly mark it with `#[lint::allow_unsafe_randomness]` (which you shouldn't do for production code).

There's also the "undergasing" attack where someone sets `max_gas` just high enough to abort on expensive outcomes. The mitigation is to keep gas costs consistent regardless of the random result. This example only emits events after randomness, so gas is the same no matter who wins.

## Selecting Multiple Winners

The `select_winners` function picks `n` unique winners using `randomness::permutation()`:

```rust
#[randomness]
entry fun select_winners(admin: &signer, n: u64) acquires CandidatePool {
    let pool = borrow_global<CandidatePool>(signer::address_of(admin));
    let total = vector::length(&pool.candidates);

    assert!(total > 0, E_NO_CANDIDATES);
    assert!(n <= total, E_NOT_ENOUGH_CANDIDATES);

    // permutation(total) returns shuffled indices [0, total-1]
    // take first n for n unique winners
    let perm = randomness::permutation(total);
    let winners = vector::empty<address>();

    let i = 0;
    while (i < n) {
        let idx = *vector::borrow(&perm, i);
        vector::push_back(&mut winners, *vector::borrow(&pool.candidates, idx));
        i = i + 1;
    };

    event::emit(WinnersSelected { winners });
}
```

`permutation(total)` returns a shuffled list of indices `[0, total-1]`. Grabbing the first `n` gives you `n` unique winners without duplicates.

Notice it's `entry fun` not `public entry fun` - the `#[randomness]` attribute requires private entry functions to prevent test-and-abort attacks.

## Selecting One Winner

For a single winner, `u64_range()` is simpler:

```rust
#[randomness]
entry fun select_one(admin: &signer) acquires CandidatePool {
    let pool = borrow_global<CandidatePool>(signer::address_of(admin));
    let total = vector::length(&pool.candidates);
    assert!(total > 0, E_NO_CANDIDATES);

    let idx = randomness::u64_range(0, total);
    let winner = *vector::borrow(&pool.candidates, idx);

    event::emit(WinnersSelected { winners: vector[winner] });
}
```

Results go into a `WinnersSelected` event because entry functions can't return values. Your client parses transaction events to get winners.

## Other Examples

- [Fungible Asset Guide](/guides/first-fa) - Create and manage tokens
- [NFT Contract](/guides/first-nft) - Mint collections with transfers
- [Fee Splitter](/guides/fee-splitter) - Split payments among recipients
