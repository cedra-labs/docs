# Building Gas-Efficient Social Feeds on Cedra: The Event Indexing Pattern

## 1. Problem: State Bloat & Gas Costs

In traditional Web2 development, storing a list of posts in a database (the moral equivalent of a `vector<String>` in Move) is the default approach. On blockchains like **Cedra** (built on the Aptos Move stack), this pattern quickly becomes prohibitively expensive because **on-chain storage is the most expensive resource**.

If you store every social media post directly in Global State:

1. **Gas costs explode** – users pay for every byte written into the global Merkle tree.
2. **State bloat** – the chain state grows unbounded as posts accumulate.
3. **Performance degradation** – operations on large vectors (paging, filtering, sorting) become slower and more costly over time.

For social feeds, where write‑frequency is high and historical data is primarily read **off‑chain**, this approach does not scale.

## 2. Solution: "Events as Storage"

Instead of writing post content into persistent *Global Storage*, we leverage **Move events**:

- **Events** are log records emitted during transaction execution.
- They are stored in the transaction history, not in the current state tree.
- Indexers and frontends can subscribe to events without incurring long‑term storage costs.

This makes events **an order of magnitude cheaper** (often 10x–100x) than repeatedly writing large structs into account storage, while still keeping the data fully queryable.

## 3. Code Walkthrough: `cedra_guide::social_feed`

The example module lives in `sources/social_feed.move` and demonstrates a minimal, event‑driven social feed for Cedra.

### 3.1 Event Definition

```move
struct PostEvent has drop, store {
    user: address,
    content: String,
    timestamp: u64,
}
```

Each `PostEvent` captures:

- `user` – the address of the author.
- `content` – the post body as a `String`.
- `timestamp` – the logical time (in seconds) when the post was created.

### 3.2 Per-User Event Handle Resource

```move
struct UserEvents has key {
    post_events: event::EventHandle<PostEvent>,
}
```

Instead of storing posts themselves, every user only stores an `EventHandle<PostEvent>` inside a `UserEvents` resource. This handle is the anchor that frontends and indexers will use to query historical events.

Users must be registered once:

```move
public entry fun register_user(account: &signer) {
    let account_addr = signer::address_of(account);
    if (!exists<UserEvents>(account_addr)) {
        move_to(account, UserEvents {
            post_events: account::new_event_handle<PostEvent>(account),
        });
    };
}
```

### 3.3 Emitting Events Instead of Writing State

The critical function is `post`, which **does not** mutate any `vector<PostEvent>` in storage. It only emits an event:

```move
public entry fun post(account: &signer, content: String) acquires UserEvents {
    let account_addr = signer::address_of(account);

    // Ensure user is registered
    assert!(exists<UserEvents>(account_addr), 1);

    let user_events = borrow_global_mut<UserEvents>(account_addr);

    event::emit_event(&mut user_events.post_events, PostEvent {
        user: account_addr,
        content,
        timestamp: timestamp::now_seconds(),
    });
}
```

Key points:

- No `vector::push_back` or long‑lived list of posts in storage.
- All post data lives in the **event log**, which is cheap to append to and easy to index.

### 3.4 End-to-End Test

The module includes an end‑to‑end Move unit test that validates the flow:

```move
#[test(user = @0x123, framework = @0x1)]
public entry fun test_end_to_end(user: &signer, framework: &signer) acquires UserEvents {
    let user_addr = signer::address_of(user);
    account::create_account_for_test(user_addr);
    // Use the framework signer (0x1) when enabling timestamp for tests.
    timestamp::set_time_has_started_for_testing(framework);

    // 1. Register
    register_user(user);

    // 2. Post
    let content = string::utf8(b"Hello Cedra Builders!");
    post(user, content);

    // 3. Verify event emission
    let user_events = borrow_global<UserEvents>(user_addr);
    assert!(event::counter(&user_events.post_events) == 1, 0);
}
```

This ensures that:

- A user can be registered.
- A post can be created.
- Exactly **one** `PostEvent` is emitted.

## 4. Indexing Strategy (Frontend & Indexer View)

On the frontend, you never read a `UserEvents` resource to get the feed contents directly. Instead, you query the Cedra node API (or an indexer) for events.

### 4.1 Querying Events by Handle (TypeScript)

Using the Aptos/Cedra TypeScript SDK, you can fetch a user's feed like this:

```ts
const events = await client.getEventsByEventHandle(
  userAddress,
  "cedra_guide::social_feed::UserEvents",
  "post_events",
);

// Map raw events into a UI-friendly shape
const feed = events.map((e) => ({
  user: e.data.user,
  content: e.data.content,
  timestamp: Number(e.data.timestamp),
}));
```

This pattern is ideal for:

- React/Next.js frontends consuming Cedra events.
- Off‑chain indexers (e.g. GraphQL or custom workers) that build richer views over time.

## 5. Running the Tests Locally

This package is structured as a standard Move package:

- `Move.toml` – package + dependency configuration (`CedraEventGuide`).
- `sources/social_feed.move` – example module and unit test.
- `guides/README.md` – this document.

From the package root (`CedraEventGuide` folder), you can run the Move unit tests with the official Aptos CLI:

```bash
aptos move test --skip-fetch-latest-git-deps
```

This command will:

- Compile `AptosFramework` at `aptos-release-v1.9.0`.
- Compile the `CedraEventGuide` package.
- Execute `cedra_guide::social_feed::test_end_to_end`.

> **Note on Cedra CLI:**
> At the time of writing, `cedra` CLI ships with an older Move compiler that does not yet support some newer language constructs used in recent `AptosFramework` versions (e.g., ability constraints on function types). As a result, `cedra move test` fails while compiling the framework itself, even though this package compiles and tests successfully with the latest `aptos` CLI.

## 6. Summary

By moving post content from **state storage** to **event logs**, we:

- Dramatically reduce gas costs for high‑frequency social interactions on Cedra.
- Avoid unbounded state growth from large on‑chain vectors.
- Keep the UX flexible, by letting indexers and frontends shape the feed from events.

This Event Indexing pattern is a foundational building block for building scalable, gas‑efficient social applications on the Cedra Network.
