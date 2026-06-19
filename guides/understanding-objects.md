Understanding Objects in Cedra Move: A Beginner's Guide with Interactive Playground

Introduction

Objects are the fundamental building blocks for managing assets and data in Cedra Move. This guide explains the three types of Objects with practical examples using our interactive playground.

Try the Concepts Hands-On: [Cedra Object Playground](https://cedra-playground.onenov.xyz/)

1. What Are Objects in Move?

In traditional Move, structs (resources) live directly in user accounts, creating limitations for transfer, ownership, and composition. Cedra/Aptos Move introduces Objects as smart containers that solve these problems.

Key Innovation: Objects live at their own independent address in global storage, not inside user accounts.

2. The Three Types of Objects

2.1 Normal Objects

Use Case: NFTs, tradeable items, fungible tokens

```move
// Created with random address
let constructor_ref = object::create_object(owner_address);
```

Characteristics:

· Random address generation
· Fully transferable between accounts
· Can be deleted by owner
· Default choice for most assets

Try It: In the playground, select "Normal Object" and notice the generated create, transfer, and delete functions.

2.2 Named Objects

Use Case: Global configurations, registries, singleton patterns

```move
// Deterministic address from creator + seed
let constructor_ref = object::create_named_object(
    creator, 
    b"global_leaderboard_v1" // Seed value
);
```

Characteristics:

· Deterministic address (creator_address + seed)
· Can only be created once per seed
· Not deletable (persistent singleton)
· Predictable location for global resources

Try It: Select "Named Object" and add a seed value. Notice how the get_address function allows predictable discovery.

2.3 Sticky Objects

Use Case: Soulbound tokens (SBTs), achievements, identity credentials

```move
// Permanently bound to recipient
let constructor_ref = object::create_sticky_object(recipient_address);
```

Characteristics:

· Permanently bound to original owner
· Non-transferable under any circumstances
· Not deletable
· Perfect for reputation and identity

Try It: Select "Sticky Object" and see how the create function requires a recipient parameter and lacks transfer functions.

3. Storage Visualization: Where Data Actually Lives

This is the most important concept for beginners:

```
┌─────────────────────┐    ownership    ┌─────────────────────┐
│   Object Address    │ ◄───────────── │   Your Account      │
│ 0xabc... (random)   │    reference   │ 0x123...            │
├─────────────────────┤                 ├─────────────────────┤
│ • ObjectCore        │                 │ • Ownership Proof   │
│ • Your Struct Data  │                 │   → 0xabc...        │
│ • Custom Resources  │                 └─────────────────────┘
└─────────────────────┘
```

Key Insight: Your data lives at the Object's address (0xabc...). Your account only stores a reference pointing to that Object. This separation enables flexible ownership and transfer patterns.

Visualize It: Switch to the "Storage" tab in the playground to see this relationship animated.

4. Practical Examples

4.1 Creating an NFT (Normal Object)

```move
module my_address::game_item {
    use aptos_framework::object::{Self, Object};
    
    struct GameItem has key {
        name: vector<u8>,
        attack: u64,
        durability: u64
    }
    
    public entry fun mint_nft(creator: &signer) {
        let constructor_ref = object::create_object(
            signer::address_of(creator)
        );
        let object_signer = object::generate_signer(&constructor_ref);
        
        move_to(&object_signer, GameItem {
            name: b"Dragon Sword",
            attack: 150,
            durability: 100
        });
    }
}
```

4.2 Global Leaderboard (Named Object)

```move
module my_address::leaderboard {
    const SEED: vector<u8> = b"global_leaderboard_v1";
    
    struct Leaderboard has key {
        top_players: vector<address>,
        season: u64
    }
    
    // Singleton pattern - can only be created once
    public entry fun init_leaderboard(admin: &signer) {
        let constructor_ref = object::create_named_object(admin, SEED);
        let object_signer = object::generate_signer(&constructor_ref);
        
        move_to(&object_signer, Leaderboard {
            top_players: vector::empty(),
            season: 1
        });
    }
}
```

4.3 Achievement Badge (Sticky Object)

```move
module my_address::achievements {
    struct Achievement has key {
        badge_id: u64,
        name: vector<u8>,
        earned_at: u64
    }
    
    // Once awarded, can never be transferred
    public entry fun award_achievement(
        awarder: &signer,
        recipient: address,
        badge_id: u64
    ) {
        let constructor_ref = object::create_sticky_object(recipient);
        let object_signer = object::generate_signer(&constructor_ref);
        
        move_to(&object_signer, Achievement {
            badge_id,
            name: b"Dragon Slayer",
            earned_at: timestamp::now_seconds()
        });
    }
}
```

5. Quick Decision Guide

Use Case Object Type Key Feature
NFTs, tokens Normal Transferable, deletable
Global config Named Deterministic address
Identity, SBTs Sticky Non-transferable
Gaming items Normal Random address
Registry Named Singleton pattern
Certifications Sticky Permanent binding

6. Common Patterns & Best Practices

6.1 Ownership Verification

Always verify ownership before allowing operations:

```move
public entry fun transfer_item(
    owner: &signer, 
    object_addr: address,
    recipient: address
) {
    assert!(object::owner(object_addr) == signer::address_of(owner), 1);
    object::transfer(owner, object_addr, recipient);
}
```

6.2 Seed Naming Convention for Named Objects

Use versioned, descriptive seeds:

```move
b"protocol_treasury_v2"
b"user_registry_mainnet"
b"config_2024_q3"
```

6.3 Error Handling

Define clear error codes:

```move
const E_NOT_OWNER: u64 = 1;
const E_ALREADY_INITIALIZED: u64 = 2;
const E_INSUFFICIENT_BALANCE: u64 = 3;
```

7. Interactive Learning Path

1. Start with the Playground: Experiment with creating different Object types
2. Modify Examples: Change struct fields and see code update in real-time
3. Visualize Storage: Switch to Storage tab to understand data location
4. Try Preset Examples: Click "NFT Game Item", "Global Leaderboard", or "Achievement Badge"
5. Build Your Own: Create custom structs for your specific use case

8. Further Resources

[· Official Cedra Documentation](https://docs.cedra.network)
[· Cedra Contract Examples](https://github.com/cedra-labs/move-contract-examples)
[· Aptos Objects Documentation](https://aptos.dev/network/blockchain/objects)

Conclusion

Objects revolutionize asset management in Move by separating data storage from account ownership. This enables:

· Flexible transfers without moving data
· Complex ownership models (shared, conditional)
· Better composability between protocols
· Persistent global state with Named Objects
· Identity primitives with Sticky Objects

Next Steps: Use the Cedra Object Playground to experiment with these concepts, then implement them in your own contracts.

---

This guide is part of the Cedra Builders Forge. Found an issue? Submit a PR.

Interactive playground built by [OneNov0209](https://github.com/OneNov0209).

```
