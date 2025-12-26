
# Glossary


### Core Concepts

#### Blockchain
A distributed digital ledger that records transactions across many computers so that the record cannot be altered retroactively.

#### Decentralization
The process of distributing and dispersing power away from a central authority. In blockchain, it means no single entity controls the network.

#### Distributed Ledger
A database that is consensually shared and synchronized across multiple sites, institutions, or geographies.

#### Node
A node is any device that participates in a blockchain network. Nodes maintain a copy of the ledger and may help validate or relay transactions.

**Types of Nodes:**
- **Full Node**: Stores the entire blockchain and validates blocks/transactions
- **Light Node (Light Client)**: Stores only essential parts (e.g., block headers) and relies on full nodes for data
- **Archive Node**: A full node with historical state data - useful for explorers and analytics
- **Miner Node / Validator Node**: Performs consensus (mining or validating blocks)

:::info How to Create a Node
Node is created by running a blockchain client (e.g., Geth for Ethereum).

The type of node depends on your goal:
- **Light** = for wallets, low power devices
- **Full** = to participate in the network and verify
- **Archive** = if you need historical data
- **Validator/Miner** = to secure the network (requires staking or computing power)
:::

#### Miners
Miners are nodes in Proof of Work (PoW) systems (like Bitcoin) that compete to solve cryptographic puzzles to create the next block. Miners exist only in PoW-based networks. You won't find miners in Proof of Stake systems.

**Role:**
- Secure the network
- Validate and package transactions
- Earn rewards (block reward + transaction fees)

**Node type:** Specialized full node with mining software/hardware (e.g., ASICs for Bitcoin)

#### Validators
Validators are nodes in Proof of Stake (PoS) systems (like Ethereum 2.0, Solana) that are chosen to propose and attest to blocks based on the amount of cryptocurrency they've staked. Validators exist only in PoS-based networks. You won't find validators in pure PoW systems.

**Role:**
- Propose/validate new blocks
- Vote on block validity
- Earn rewards for honest behavior (or get slashed for misbehavior)

**Node type:** Full node running validator software, requires a stake (e.g., 32 ETH for Ethereum)

:::warning Can a network have both miners and validators?
In most mainstream blockchains - **no**. A network typically uses either PoW (with miners) or PoS (with validators), not both. They are designed for different consensus mechanisms.

However, some experimental or hybrid blockchains (e.g., Decred) use both mechanisms together, where miners produce blocks and validators approve them. But this is not common in major protocols like Bitcoin, Ethereum, Solana, or Polygon.
:::

#### Clients
A client is the software implementation of the blockchain protocol. It allows a node to join the network.

**Role:**
- Communicate with other nodes
- Handle transactions and blocks
- Each client may support different node roles (full, light, validator)

**Examples:**
- **Ethereum Clients**: Geth, Nethermind, Prysm (for validators)
- **Bitcoin Clients**: Bitcoin Core
- **Solana Client**: Solana Validator

#### Consensus Mechanism
A system used to agree on the state of the blockchain.

**Examples**: Proof of Work (PoW), Proof of Stake (PoS), Proof of History (PoH), etc.

#### Epoch
An epoch is a defined period of time in a blockchain system, during which certain operations occur - like validator selection, reward distribution, or checkpoint creation.

**Where It's Used:**
- **Ethereum 2.0 (Proof of Stake)**: Epochs group 32 slots (blocks), and validators are shuffled during epoch transitions
- **Cardano, Solana, Polkadot**: Epochs are used to manage validator cycles and staking rewards

#### Genesis Block
The genesis block is the first block of a blockchain. It serves as the root from which all subsequent blocks originate. It is hardcoded into the protocol and typically has no previous block.

#### Reward Emission in PoS Networks
Emission is the protocol-driven creation of new tokens, a form of controlled inflation, which occurs according to network rules.

**How it works:**
- The blockchain protocol itself "mints" new coins each block or epoch - they did not previously exist
- These tokens are added directly into the ledger by the system (similar to a system-generated transaction)
- Validators and delegators receive most of the newly minted tokens as block rewards
- A portion may go to a treasury fund or foundation
- Some networks burn part of the transaction fees

:::note
In PoS blockchains, validators don't just collect user fees - they receive newly created tokens from the protocol's inflation model. These tokens are automatically minted by the protocol during block or epoch creation.
:::

#### Crypto Primitives in Blockchain
Cryptographic primitives are the basic building blocks of cryptographic systems used in blockchain to ensure security, integrity, and authenticity.

**Essential Crypto Primitives:**

1. **Hash Functions** (e.g., SHA-256, Keccak)
   - One-way functions used to create unique fingerprints of data
   - Used in: Bitcoin, Ethereum, Solana (uses SHA-256 + SHA-512)

2. **Public-Key Cryptography**
   - A pair of keys - one public, one private - is used to encrypt, decrypt, and sign data

3. **Digital Signatures** (e.g., ECDSA, Ed25519)
   - Allow users to prove ownership and authorize transactions
   - Used in: Bitcoin (ECDSA), Ethereum (ECDSA), Solana (Ed25519)

4. **Merkle Trees**
   - A tree structure that enables efficient and secure verification of large data sets (like all transactions in a block)
   - Reduces the amount of data needed to verify integrity
   - Used in: Bitcoin, Ethereum (in receipts and logs), others

| Blockchain | Hashing | Signature | Other |
|------------|---------|-----------|--------|
| Bitcoin | SHA-256 | ECDSA | Merkle Tree |
| Ethereum | Keccak-256 | ECDSA | Merkle Patricia Trie |
| Solana | SHA-256 + SHA-512 | Ed25519 | Flat account state |

### Structures and Operations

#### Block
A unit of data in the blockchain that contains transactions, a timestamp, and a reference (hash) to the previous block.

#### Transaction
A record of an operation (e.g., sending cryptocurrency) stored in a block.

#### Smart Contract
A self-executing contract with the terms directly written into code.

**Example**: An escrow system where funds are released only after certain conditions are met.

#### Gas
A unit that measures the amount of computational effort required to execute operations.

#### Wallet
A digital tool (software or hardware) that allows users to store and manage their cryptocurrencies.

#### Private Key & Public Key
A cryptographic pair. The private key is kept secret and used to sign transactions, while the public key is shared and used to verify them.

---

## Cedra Blockchain

#### Cedra
A community-owned blockchain built on the Move language, enabling developers to create secure smart contracts with native asset safety guarantees.

#### CED
The native token of the Cedra blockchain, used for paying gas fees and staking.

#### Octas
The smallest unit of CED. 1 CED = 100,000,000 Octas

#### Devnet
Development network for testing features. URL: `https://devnet.cedra.dev`. Tokens have no real value and the network may be reset.

#### Testnet
Testing network for pre-production validation. URL: `https://testnet.cedra.dev`. More stable than devnet, used for final testing before mainnet.

#### Mainnet
The production network where real value transactions occur.

#### Cedrascan
Block explorer for viewing transactions, accounts, and modules on the Cedra blockchain.

#### Faucet
A service that provides free test tokens for development on devnet and testnet.

### Execution & Performance

#### Sequence Number
A transaction counter for each account that prevents replay attacks. Unlike Ethereum's nonce, Cedra allows parallel transaction submission with different sequence numbers.

#### Parallel Execution
Cedra's ability to process multiple transactions simultaneously using optimistic concurrency control, significantly increasing throughput.

#### Block-STM
Technology enabling parallel transaction execution with automatic conflict detection and resolution. Transactions are speculatively executed in parallel and re-executed only if conflicts occur. See [Block-STM Parallel Execution](/concepts/block-stm) for details.

#### Instant Finality
Transactions become irreversible immediately after consensus is reached. No need to wait for multiple block confirmations.

#### BFT Consensus
Byzantine Fault Tolerant consensus mechanism that can tolerate up to 1/3 of validators acting maliciously while still reaching agreement.

### Accounts & Storage

#### Account Address
A 32-byte identifier for an account on Cedra, typically shown as a hex string prefixed with `0x`. In Move code, addresses are prefixed with `@`.

#### Authentication Key
The cryptographic identity of an account, derived from the public key. Can be rotated without changing the account address.

#### Global Storage
Blockchain state where resources with the `key` ability are stored. Organized by address and type - each address can hold at most one instance of each resource type.

#### Type-indexed Storage
Storage organized by type rather than arbitrary slots. Each resource type is stored exactly once per account, preventing slot collision bugs.

---

## Move Language

### Core Concepts

#### Move
A resource-oriented programming language designed for safe digital asset management on blockchains. Move's type system prevents common bugs like double-spending and asset loss at compile time.

#### Module
The fundamental unit of code organization in Move. A module contains structs, functions, and constants, and is deployed at a specific blockchain address. Modules define the logic for interacting with resources.

```rust
module my_address::my_module {
    // structs, functions, constants
}
```

#### Resource
A special type in Move that cannot be copied or accidentally dropped. Resources ensure digital assets are handled safely - they must be explicitly moved, stored, or destroyed.

#### Struct
A custom data type that groups related fields together. Structs can have abilities that control how they behave.

```rust
struct Token has key, store {
    value: u64,
}
```

#### Linear Type System
Move's type system that ensures resources exist in exactly one location at any time. Values must be explicitly moved, preventing duplication or loss of assets.

### Abilities

#### Ability
A property granted to structs that controls what operations are allowed on instances of that type. Move has four abilities: `copy`, `drop`, `store`, and `key`.

#### copy
Allows a struct to be duplicated. Use for data that doesn't represent scarce resources (like configuration or counters). Resources representing assets typically don't have this ability.

#### drop
Allows a struct to be discarded when it goes out of scope. Without `drop`, the compiler enforces that values must be explicitly handled, preventing accidental loss.

#### store
Allows a struct to be stored inside other structs or in global storage containers. Required for types that need to persist on-chain as part of other resources.

#### key
Allows a struct to exist as a top-level resource in global storage. Only one instance of a `key` type can exist per address. This is the foundation for account-based storage.

### Functions & Visibility

#### Entry Function
A function marked with `entry` that can be called directly from transactions. Entry functions cannot return values and serve as the public interface for user interactions.

```rust
public entry fun transfer(from: &signer, to: address, amount: u64) { ... }
```

#### Public Function
A function accessible from other modules using the `public` keyword. Public functions form the API of a module and can be called by any other module.

#### Friend Function
A function using `public(friend)` visibility, accessible only to specifically declared friend modules. Useful for controlled access between related modules.

#### View Function
A read-only function marked with `#[view]` that doesn't modify state. View functions can be called without creating a transaction, making them free to execute.

#### Signer
A special type representing transaction authority. A `&signer` reference proves the caller has permission to perform operations on behalf of an account.

#### Acquires
An annotation required on functions that read from or modify global storage. Helps prevent reentrancy attacks by making storage access explicit.

```rust
public fun get_balance(addr: address): u64 acquires Balance { ... }
```

### Ownership & Storage

#### Ownership
In Move, every value has exactly one owner. When a value is assigned to a new variable or passed to a function, ownership transfers (the value "moves").

#### Borrow
Accessing data through references without taking ownership. Borrowing allows temporary access while the original owner retains the value.

#### Immutable Reference (&)
A read-only reference to data. Multiple immutable references can exist simultaneously, allowing shared read access.

#### Mutable Reference (&mut)
A reference that allows modification of borrowed data. Only one mutable reference can exist at a time, ensuring exclusive write access.

#### borrow_global
Function to obtain an immutable reference to a resource stored in global storage at a specific address.

```rust
let token = borrow_global<Token>(addr);
```

#### borrow_global_mut
Function to obtain a mutable reference to a resource in global storage, allowing modification.

```rust
let token = borrow_global_mut<Token>(addr);
token.value = token.value + 1;
```

#### move_to
Operation that publishes a resource to global storage at an address. The signer must own the address.

```rust
move_to(account, Token { value: 100 });
```

#### move_from
Operation that removes a resource from global storage and returns it. The resource must exist at the specified address.

#### exists\<T\>
Function to check if a resource of type T exists at a given address. Returns `true` or `false`.

```rust
if (exists<Token>(addr)) { ... }
```

### Patterns

#### Capability Pattern
Using resource types as proof of authorization. Holding a capability resource grants permission to perform specific operations. The capability itself is the access control.

```rust
struct AdminCap has key, store {}

public fun admin_only(cap: &AdminCap) { ... }
```

#### Hot Potato Pattern
A resource without any abilities (`copy`, `drop`, `store`, `key`) that must be handled immediately within the same transaction. Forces atomic operations and prevents partial execution.

#### Witness Pattern
A one-time use type that proves initialization has occurred. Typically has only the `drop` ability, ensuring it can only be used once and then discarded.

#### Phantom Type
A type parameter that doesn't appear in struct fields but provides compile-time type safety. Used to distinguish between different instances of the same structure.

```rust
struct Coin<phantom CoinType> has store {
    value: u64,
}
```

---

## Fungible Assets (FA)

### Core Concepts

#### Fungible Asset (FA)
Cedra's token standard that replaces ERC-20-style patterns with ownable objects. FA provides safer, cheaper, and more composable token operations.

#### FungibleStore
An object that holds a user's balance for a specific fungible asset. Each holder has their own store for each token type they own.

#### Metadata
An object storing token information including name, symbol, decimals, icon URI, and supply tracking. Acts as the token's identity and admin account.

#### Primary Fungible Store
The default storage location for an account's FA balance. Created lazily on first receipt - no manual registration required.

#### Object
A first-class on-chain entity with a unique address. Objects can own resources and other objects, enabling complex ownership hierarchies.

### Capabilities

#### MintRef
A capability granting permission to create new tokens (inflate supply). Only holders of this reference can mint.

#### BurnRef
A capability granting permission to destroy tokens (deflate supply). Controls token removal from circulation.

#### TransferRef
A capability enabling token movement without the owner's signature. Used for escrow and automated transfer scenarios.

#### FreezeRef
A capability to pause transfers from a specific store. Used for compliance or security freezes on suspicious accounts.

---

## Development

### Package Management

#### Move.toml
The package manifest file that defines dependencies, named addresses, and compilation settings for a Move project.

```toml
[package]
name = "my_project"
version = "1.0.0"

[addresses]
my_project = "0x1"

[dependencies]
CedraFramework = { git = "..." }
```

#### Named Address
An alias for a blockchain address used in code, resolved at compile time. Allows the same code to be deployed to different addresses.

#### Package
A collection of Move modules with their dependencies, compiled and deployed together as a unit.

#### Upgrade Policy
Rules governing how a deployed package can be modified. Cedra supports `compatible` (backward-compatible changes only) and `immutable` (no changes allowed).

#### Compatible Upgrade
A package update that preserves backward compatibility - existing struct layouts and public function signatures remain unchanged.

#### Immutable Package
Code that cannot be upgraded after deployment. Provides maximum trust guarantees that behavior will never change.

#### Chunked Publishing
A method for deploying packages larger than 64KB by splitting bytecode into multiple transactions that are staged and assembled on-chain.

### CLI & Tools

#### Cedra CLI
The command-line interface for Move development on Cedra. Supports compiling, testing, publishing, and interacting with contracts.

```bash
cedra move compile
cedra move test
cedra move publish
```

#### @cedra-labs/ts-sdk
The official TypeScript SDK for building applications that interact with the Cedra blockchain.

#### Transaction Simulation
A dry-run of a transaction to estimate gas costs and verify it will succeed before actually submitting it to the network.

#### Profile
A CLI configuration for different networks (devnet, testnet, mainnet). Profiles store endpoint URLs and account credentials.

---

## Ecosystem & Use Cases

#### Oracle
A blockchain oracle is a service that connects smart contracts to external data sources, enabling them to access information that exists outside the blockchain (also called off-chain data).

| Type of Oracle | Description |
|----------------|-------------|
| **Inbound** | Delivers real-world data to smart contracts (e.g., price feeds) |
| **Outbound** | Sends blockchain data to external systems |
| **Software** | Pulls data from APIs, websites, databases |
| **Hardware** | Gets data from physical sensors, IoT devices |
| **Human** | Verified individuals provide data input manually |
| **Decentralized** (e.g. Chainlink) | Uses multiple sources and consensus to prevent manipulation |

#### dApp (Decentralized Application)
An application that runs on a decentralized network rather than a single server.

#### DeFi (Decentralized Finance)
Financial services without traditional intermediaries like banks.

**Examples**: Lending platforms, DEXs (Decentralized Exchanges)

#### NFT (Non-Fungible Token)
Unique digital assets that represent ownership of specific items or content, often used in art, gaming, or music.

#### DAO (Decentralized Autonomous Organization)
An organization governed by smart contracts and voting systems rather than central leadership.

#### Layer 1 vs Layer 2

- **L1 (Layer 1)**: The base blockchain (e.g., Ethereum) - secure but limited in throughput
- **L2 (Layer 2)**: Built on top of L1 to scale it - processes many transactions off-chain or in batches, then submits the result back to L1

**Transaction Flow:**
1. The user interacts with the L2 app (e.g., Arbitrum, Optimism)
2. Transaction processed on L2 (fast, cheap)
3. Periodically, L2 sends a proof or summary (e.g., rollup, zk-proof, state root) back to L1
4. L1 verifies the proof and updates its state

**Examples:**
- Arbitrum/Optimism = Optimistic Rollups
- StarkNet/ZkSync = ZK Rollups

:::info
L1 always acts as the source of truth, ensuring that L2 cannot cheat (disputes or fraud proofs are used if needed).
:::

---

## Security & Risks

#### 51% Attack
When an entity gains over 50% of the network's hashing power, potentially allowing them to double-spend or block transactions.

#### Rug Pull
A type of scam where project creators take investor funds and disappear.

#### Phishing
Fraudulent attempts to obtain sensitive information such as private keys or seed phrases.

#### Re-Entrancy Attack
A vulnerability in smart contracts where an external contract calls back into the original contract before the first execution is finished, often used to drain funds.

**Example**: The DAO hack on Ethereum in 2016 - ~$60M lost due to improper state updates before fund transfers.

**Prevention:**
- Update state before external calls
- Use reentrancy guards (e.g., mutex or `nonReentrant` in Solidity)

:::tip Move's Safety
Move's `acquires` annotation and linear type system prevent reentrancy attacks by design. Functions must declare what resources they access, and resources cannot be borrowed twice simultaneously.
:::

#### Sandwich Attack
Occurs in DeFi and DEXs where an attacker front-runs and back-runs a user's transaction to profit from price manipulation.

**How it works:**
1. See a large swap coming in mempool
2. Front-run with your own buy (to pump price)
3. Let the victim's trade go through at a worse rate
4. Back-run with your sell (at now higher price)

:::tip Prevention
- Use private transaction relays (e.g., Flashbots)
- Slippage control
:::

---

## Other Developer Tools

#### Solidity
The main programming language for Ethereum smart contracts.

#### EVM (Ethereum Virtual Machine)
The environment in which all Ethereum smart contracts run.

#### Web3.js / Ethers.js
JavaScript libraries to interact with Ethereum and smart contracts.

#### RPC (Remote Procedure Call)
A communication protocol used to interact with blockchain nodes.

#### CLI
CLI is a text-based interface used to interact with blockchain clients or tools via terminal/command prompt. It offers full control, automation, and low-level interaction - essential for developers and node operators.

**Use Cases in Blockchain:**
- Deploy and interact with smart contracts
- Send transactions manually
- Query network data
- Set up validators or nodes

#### Zero-Knowledge Proof
A Zero-Knowledge Proof is a cryptographic method that allows one party (the prover) to convince another (the verifier) that a statement is true without revealing any information beyond the fact that the statement is indeed true.

There are multiple types, such as: zk-SNARKs, zk-STARKs, Bulletproofs, etc.

**What problem does it solve?**
- **Privacy**: Proves knowledge or computation without revealing sensitive data
- **Integrity**: Ensures computations are done correctly, useful in blockchains and authentication

#### Blockchain Bridge
A blockchain bridge connects two separate blockchains, allowing assets or data to be transferred between them.

**A blockchain bridge allows:**
- The transfer of tokens
- The movement of data
- The execution of logic across chains

**What problem does it solve?**
- **Interoperability**: Enables ecosystems like Ethereum, Solana, or Bitcoin to interact
- **Liquidity fragmentation**: Helps use tokens across chains without siloing liquidity

:::note Why are bridges needed?
Bridges are needed because most blockchains are not natively compatible - Bitcoin, Ethereum, Solana, etc., all use different consensus mechanisms, address formats, and virtual machines.
:::

**Problems Solved by Bridges:**
- **Asset portability**: Move tokens from one chain to other chains to avoid high fees
- **DeFi composability**: Use an asset on multiple platforms (e.g., stake ETH on Avalanche)
- **Network scalability**: Offload transactions to layer-2s or sidechains
- **Cross-chain dApps**: Combine functionality across chains (e.g., an app using Solana speed + Ethereum security)
