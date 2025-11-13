# What if Assets Were Physical Objects?

In Solidity, tokens are numbers in a mapping. In Move, they're **resources** that physically exist and move between accounts - like handing someone a dollar bill instead of updating two bank ledgers.

Let's implement a basic token transfer to see the paradigm shift:

```solidity
contract Token {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Two ledger updates - sender and receiver
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

:::info
you're a bookkeeper:
- Manually track balances in mappings
- Ensure conservation (no creating/destroying value)
- Guard against reentrancy attacks
- Hope you updated all the right ledgers
:::

#### Moving Physical Resources
In Move you're handling physical objects that exist in one place at a time. When you transfer a token, you're not updating two balance entries - you're actually withdrawing a resource from one account and depositing it into another. The language guarantees that the resource cannot be duplicated, lost, or accessed from two places simultaneously.
```rust
module cedra::token {
    struct Coin has store { 
        value: u64 
    }
    
    public fun transfer(from: &signer, to: address, amount: u64) {
        // Coin physically leaves sender's account
        let coin = coin::withdraw(from, amount);
        
        // And moves to receiver's account
        // The coin can only exist in ONE place
        coin::deposit(to, coin);
    }
}
```


**In Move**, you're handling physical objects:
- Resources can only exist in one place
- Can't be copied or lost (unless explicitly allowed)
- Reentrancy is impossible - you can't give away what you don't have
- The language enforces conservation laws


| Thinking in Solidity | Thinking in Move |
|---------------------|------------------|
| "Update the mapping" | "Move the resource" |
| "Check then update" | "Take then give" |
| "Prevent reentrancy" | "Physics prevents it" |
| "Track all state changes" | "Resources track themselves" |


You've seen how resources change the game and that's just the beginning. Move's design eliminates entire classes of vulnerabilities that plague Solidity. Ready to see what else makes Move a paradigm shift?

### 📖 **Understanding the Differences**
→ **[Concepts: Move vs Solidity](/for-solidity-developers/concepts)**: Complete comparison of every major concept - accounts, storage, execution, type systems, security models, and more

### 🎯 **Start Building**
→ **[Your First Token](/guides/first-fa)**: Create a fungible asset in 15 minutes
→ **[Build an NFT](/guides/first-nft)**: Launch your NFT collection
→ **[Counter App](/getting-started/counter)**: Complete dApp with frontend

**Quick Challenge**: Can you implement a flash loan that's guaranteed to be repaid? Hint: In Move, it's 12 lines using "hot potatoes" 🥔 - Learn more in the [Resource Types guide](/move/resource#the-hot-potato-pattern)