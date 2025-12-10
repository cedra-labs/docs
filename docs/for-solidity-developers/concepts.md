# Concepts: Move vs Solidity

If you're coming from Solidity, Move will challenge how you think about blockchain programming.

This comprehensive guide compares every major concept between Ethereum/Solidity and Cedra/Move. You'll discover how Move's design eliminates entire vulnerability classes that require constant vigilance in Solidity, and why this matters for building secure, high-performance decentralized applications.

### The Paradigm Shift

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>

<div>
#### Solidity: Contract-Centric Computing
Smart contracts are autonomous programs that hold both logic and state. Think of them as independent computers that manage their own data.
</div>
<div>
#### Move: Resource-Oriented Programming
Resources are first-class digital assets that exist independently of the code that manipulates them. Think of them as physical objects that can be owned, transferred, but never duplicated or lost.
</div>
</div>

---

### Account Architecture

In Ethereum, everything is an account, but accounts don't own their assets. In Cedra, accounts directly own typed resources, fundamentally changing how you think about storage and ownership.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>
#### Ethereum
```solidity
// Account structure
Account {
    nonce: Sequential transaction counter
    balance: ETH balance in wei
    storageRoot: Pointer to contract storage
    codeHash: Contract code identifier
}
```
- All data lives in contract storage (Patricia Merkle Tree)
- Contracts are accounts with code
- Users are accounts without code

</div>
<div>
#### Cedra
```rust
// Account structure
Account {
    sequence_number: Transaction ordering
    authentication_key: Cryptographic identity
    resources: Type-indexed storage
    modules: Deployed code
}
```
- [Resources](/move/resource) live under user accounts
- [Modules](/move/modules) (code) are separate from resources (data)
- Each resource type stored once per account
</div>
</div>

### Storage

Solidity stores all user data inside contracts using numbered slots. Move stores typed resources directly under user accounts. You own your data, not the contract.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
contract Token {
    // Slot 0: owner
    address owner;
    
    // Slot 1: totalSupply  
    uint256 totalSupply;
    
    // Slot 2+: mapping data
    mapping(address => uint256) balances;

}
```
- Each contract has isolated storage space
- Storage organized in 32-byte slots
- Key-value mappings for complex data
</div>
<div>
#### Cedra

```rust
// Move module
module cedra::token {
    struct Vault has key {
        coins: Coin<CedraCoin>
    }

    // Store resource under account
    move_to(account, Vault { coins });

    // Access resource by type
    let vault = borrow_global<Vault>(address);
}
```
- Resources stored globally under addresses
- Type-safe access via [`borrow_global`](/move/ownership#global-storage-borrowing)
- Resources indexed by type
</div>
</div>
### Execution Models

Ethereum processes transactions one at a time because any contract can call any other. Move's resource isolation enables [parallel execution](/concepts/blockchain) - 160,000 TPS.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>
#### Ethereum

```solidity
// Transaction 1 and 2 must execute in order
// because they might touch the same state
transfer(alice, 100);  // Tx 1
transfer(bob, 50);     // Tx 2 (must wait)
```

- Contracts can call any other contract
- Can't predict state access patterns
- External calls can loop back

</div>
<div>
#### Cedra

```rust
// These can execute simultaneously
transfer_coin<USDC>(alice, 100);  // Tx 1
transfer_coin<CED>(bob, 50);      // Tx 2 (parallel)
```
- Assume no conflicts, execute in parallel
- Check if assumptions were correct
- Retry conflicting transactions
- Apply all changes atomically

</div>
</div>

### Type Systems and Safety

Solidity offers basic type safety but requires runtime checks for everything. Move's [linear type system](/move/resource) with [abilities](/move/basics#the-ability-system) prevents entire classes of bugs at compile time.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
uint256 amount;  // Cannot assign string
address owner;   // 20-byte address type
bool isActive;   // Boolean type

// Runtime checks required
require(msg.sender == owner, "Not authorized");
require(balance >= amount, "Insufficient funds");
```

- Basic type safety (strings, ints, addresses)
- Manual validation everywhere
- No compile-time asset safety
- Developer must prevent bugs

</div>
<div>

#### Cedra

```rust
// This coin cannot be copied or dropped
struct Coin has store {
    value: u64
}

// This receipt must be used (hot potato pattern)
struct Receipt {  // No abilities!
    amount: u64
}
```

- [Linear types](/move/resource) prevent duplication/loss
- [Abilities](/move/basics#the-ability-system) control behavior
- Compiler enforces asset safety
- Language prevents bugs

</div>
</div>

### Function Dispatch

Solidity allows calling any contract at runtime with arbitrary data. Move requires all [function calls to be known at compile time](/move/modules) - no `address.call()`, no reentrancy.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
// Can call any contract dynamically
IContract(contractAddress).someFunction();

// Enables complex patterns but also vulnerabilities
address(target).call(
    abi.encodeWithSignature("withdraw()")
);
```

- Flexible composition
- Runtime resolution
- Enables reentrancy attacks
- Difficult to analyze statically

</div>
<div>

#### Cedra

```rust
// All calls resolved at compile time
use cedra::token;
token::transfer(from, to, amount);

// No arbitrary external calls possible
// No address.call() equivalent
```

- Compile-time verification
- No reentrancy possible
- Better performance
- Easier formal verification

</div>
</div>

### Security Models

Solidity requires developers to follow security patterns correctly. Move's language design makes entire vulnerability classes impossible by construction.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
// Reentrancy Guard
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}

// Checks-Effects-Interactions
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);  // Check
    balances[msg.sender] -= amount;           // Effect
    msg.sender.transfer(amount);              // Interaction
}
```

- Manual security patterns required
- Easy to forget or misimplement
- SafeMath for overflow protection
- Access control via modifiers

</div>
<div>

#### Cedra

```rust
// Reentrancy impossible - no recursive calls
public fun withdraw(account: &signer, amount: u64) {
    let coin = coin::withdraw(account, amount);
    // No way to call back into this function
}

// Integer overflow auto-aborts
public fun add(a: u64, b: u64): u64 {
    a + b  // No SafeMath needed
}

// Access control via capability types
public fun admin_only(_cap: &AdminCapability) {
    // Must have capability to call
}
```

- Security enforced by language
- Impossible to write vulnerable patterns
- Automatic overflow checking
- [Type-based capabilities](/move/resource#the-capability-pattern)

</div>
</div>

### Transaction Safety Mechanisms

Ethereum's nonces prevent replay attacks but block parallel submission. Cedra's sequence numbers provide the same security without head-of-line blocking.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
// Transaction queue - MUST execute in order
Tx1: nonce=4, transfer(alice, 100)  // Waiting...
Tx2: nonce=5, transfer(bob, 50)     // BLOCKED!
Tx3: nonce=6, transfer(carol, 25)   // BLOCKED!

// If Tx1 fails or gets stuck, ALL subsequent
// transactions are blocked (head-of-line blocking)
```

- Sequential counter per account
- Prevents replay attacks
- Causes issues with parallel submission
- Stuck transactions block queue

</div>
<div>

#### Cedra

```rust
// Transactions can be submitted in parallel
Tx1: seq=4, transfer(alice, 100)  // Processing
Tx2: seq=5, transfer(bob, 50)     // Can proceed!
Tx3: seq=6, transfer(carol, 25)   // Can proceed!

// Failed transactions don't block others
// Better handling of transaction ordering
```

- Similar to nonces but more flexible
- Allows parallel transaction submission
- Better handling of failed transactions
- No head-of-line blocking

</div>
</div>

### Gas Models

Ethereum's gas price auctions create unpredictable costs from $0.60 to $196+. Cedra's fixed unit pricing delivers consistent ~$0.006 transaction costs.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

**Auction-Based Pricing**:
```
gasPrice = baseFee + priorityFee
totalCost = gasUsed × gasPrice
```

- Variable costs ($0.60 - $196+)
- Competitive bidding for block space
- MEV and front-running issues

</div>
<div>

#### Cedra

**Predictable Pricing**:
```
totalGas = executionUnits + ioUnits + storageBytes
totalCost = totalGas × unitPrice
```

- Fixed unit prices (~$0.006)
- Predictable costs
- Parallel execution reduces competition
- Storage fees based on actual bytes

</div>
</div>

### Module Upgradeability

Solidity requires complex proxy patterns with delegatecall risks and storage layout constraints. Move supports native module upgrades with automatic compatibility checks.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
// Complex proxy setup required
contract Proxy {
    address implementation;

    function upgrade(address newImpl) external {
        implementation = newImpl;
    }

    fallback() external {
        delegatecall(implementation);
    }
}
```

- Storage layout must be preserved
- Complex upgrade patterns
- Security risks with delegatecall

</div>
<div>

#### Cedra

```rust
// Modules can be upgraded directly
module cedra::token {
    struct UpgradeCapability has key {}

    public fun upgrade(
        cap: &UpgradeCapability,
        code: vector<u8>
    ) {
        // Direct code replacement
    }
}
```

- Native upgrade support
- Compatibility checking
- Simpler governance

Learn more about [Move Package Upgrades](/move-package-upgrades).

</div>
</div>

### Token Standards

Ethereum requires deploying a new contract for every token (ERC-20, ERC-721). Move uses one [generic framework](/guides/first-fa) with type parameters - infinite tokens, zero deployments.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
<div>

#### Ethereum

```solidity
// Each token needs its own contract
contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000);
    }
}

// Deploy again for another token
contract AnotherToken is ERC20 {
    constructor() ERC20("Another", "ATK") {
        _mint(msg.sender, 5000000);
    }
}
```

- Contract per token
- Deployment costs for each
- Inconsistent implementations

</div>
<div>

#### Cedra

```rust
// One framework, infinite tokens
module cedra::fungible_asset {
    use cedra::fungible_asset;
    use cedra::primary_fungible_store;
    use cedra::object::Object;

    // Same code for all tokens
    public fun transfer(
        from: &signer,
        metadata: Object<Metadata>,
        to: address,
        amount: u64
    ) {
        let fa = primary_fungible_store::withdraw(from, metadata, amount);
        primary_fungible_store::deposit(to, fa);
    }
}
```

- Type parameters for tokens
- No deployment needed
- Guaranteed consistency

</div>
</div>

### Mental Model Shifts: from Solidity to Move

The transition from Solidity to Move requires rethinking fundamental blockchain programming patterns. Move's language design eliminates entire classes of vulnerabilities by construction:

| Solidity Thinking | Move Thinking | Learn More |
|------------------|---------------|------------|
| "How do I prevent double-spending?" | "Resources can't be duplicated" | [Resource Types](/move/resource) |
| "Check, then update state" | "Take resource, then give it" | [Ownership & Borrowing](/move/ownership) |
| "Add reentrancy guard" | "Static dispatch prevents it" | [Module System](/move/modules) |
| "Pack structs for gas" | "Use natural data layout" | [Data Types](/move/basics) |
| "Deploy new contract per token" | "Use type parameters" | [Generics](/move/functions) |
| "Implement access control" | "Use capability tokens" | [Capability Pattern](/move/resource#the-capability-pattern) |
| **Programming Model**: Contract-centric | **Resource-oriented** programming | [Introduction to Move](/move/introduction) |
| **Asset Representation**: Numbers in mappings | **Physical resources with types** | [Resource Safety](/move/resource) |
| **Ownership Model**: Contracts own assets | **Users own resources** | [Account Architecture](/for-solidity-developers/concepts#account-architecture) |
| **Safety Approach**: Developer vigilance | **Language-enforced invariants** | [Type System](/move/basics#structs-and-abilities-custom-types-with-superpowers) |
| **Execution Model**: Sequential by necessity | **Parallel by design** (160k TPS) | [Blockchain Architecture](/concepts/blockchain) |
| **Type System**: Basic types + structs | **Linear types with abilities** | [Abilities System](/move/basics#the-ability-system) |


Ready to build with Move? Here's your learning path:

### 🎯 **Start Building**
- **[Your First Token](/guides/first-fa)** - Create a fungible asset in 15 minutes
- **[Build an NFT](/guides/first-nft)** - Launch your NFT collection
- **[Counter App Tutorial](/getting-started/counter)** - Complete dApp with frontend

### 📚 **Deep Dive into Move**
- **[Move Basics](/move/basics)** - Master syntax and data types
- **[Resource Types](/move/resource)** - Understand Move's superpower
- **[Module System](/move/modules)** - Organize your code like a pro

### 🏗️ **Advanced Patterns**
- **[Escrow Contract](/guides/escrow)** - Time-locked funds and complex logic
- **[DEX Implementation](/guides/dex)** - Build an automated market maker
- **[Fee Splitter](/guides/fee-splitter)** - Revenue distribution patterns