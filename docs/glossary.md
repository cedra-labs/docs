
# Glossary

## Core Concepts

### Blockchain
A distributed digital ledger that records transactions across many computers so that the record cannot be altered retroactively.

### Decentralization
The process of distributing and dispersing power away from a central authority. In blockchain, it means no single entity controls the network.

### Distributed Ledger
A database that is consensually shared and synchronized across multiple sites, institutions, or geographies.

### Node
A node is any device that participates in a blockchain network. Nodes maintain a copy of the ledger and may help validate or relay transactions.

#### Types of Nodes:
- **Full Node**: Stores the entire blockchain and validates blocks/transactions
- **Light Node (Light Client)**: Stores only essential parts (e.g., block headers) and relies on full nodes for data
- **Archive Node**: A full node with historical state data — useful for explorers and analytics
- **Miner Node / Validator Node**: Performs consensus (mining or validating blocks)

:::info How to Create a Node
Node is created by running a blockchain client (e.g., Geth for Ethereum).

The type of node depends on your goal:
- **Light** = for wallets, low power devices
- **Full** = to participate in the network and verify
- **Archive** = if you need historical data
- **Validator/Miner** = to secure the network (requires staking or computing power)
:::

### Miners
Miners are nodes in Proof of Work (PoW) systems (like Bitcoin) that compete to solve cryptographic puzzles to create the next block. Miners exist only in PoW-based networks. You won't find miners in Proof of Stake systems.

**Role:**
- Secure the network
- Validate and package transactions
- Earn rewards (block reward + transaction fees)

**Node type:** Specialized full node with mining software/hardware (e.g., ASICs for Bitcoin)

### Validators
Validators are nodes in Proof of Stake (PoS) systems (like Ethereum 2.0, Solana) that are chosen to propose and attest to blocks based on the amount of cryptocurrency they've staked. Validators exist only in PoS-based networks. You won't find validators in pure PoW systems.

**Role:**
- Propose/validate new blocks
- Vote on block validity
- Earn rewards for honest behavior (or get slashed for misbehavior)

**Node type:** Full node running validator software, requires a stake (e.g., 32 ETH for Ethereum)

:::warning Can a network have both miners and validators?
In most mainstream blockchains — **no**. A network typically uses either PoW (with miners) or PoS (with validators), not both. They are designed for different consensus mechanisms.

However, some experimental or hybrid blockchains (e.g., Decred) use both mechanisms together, where miners produce blocks and validators approve them. But this is not common in major protocols like Bitcoin, Ethereum, Solana, or Polygon.
:::

### Clients
A client is the software implementation of the blockchain protocol. It allows a node to join the network.

**Role:**
- Communicate with other nodes
- Handle transactions and blocks
- Each client may support different node roles (full, light, validator)

**Examples:**
- **Ethereum Clients**: Geth, Nethermind, Prysm (for validators)
- **Bitcoin Clients**: Bitcoin Core
- **Solana Client**: Solana Validator

### Consensus Mechanism
A system used to agree on the state of the blockchain.

**Examples**: Proof of Work (PoW), Proof of Stake (PoS), Proof of History (PoH), etc.

### Epoch
An epoch is a defined period of time in a blockchain system, during which certain operations occur — like validator selection, reward distribution, or checkpoint creation.

**Where It's Used:**
- **Ethereum 2.0 (Proof of Stake)**: Epochs group 32 slots (blocks), and validators are shuffled during epoch transitions
- **Cardano, Solana, Polkadot**: Epochs are used to manage validator cycles and staking rewards

### Genesis Block
The genesis block is the first block of a blockchain. It serves as the root from which all subsequent blocks originate. It is hardcoded into the protocol and typically has no previous block.

### Reward Emission in PoS Networks
Emission is the protocol-driven creation of new tokens, a form of controlled inflation, which occurs according to network rules.

**How it works:**
- The blockchain protocol itself "mints" new coins each block or epoch — they did not previously exist
- These tokens are added directly into the ledger by the system (similar to a system-generated transaction)
- Validators and delegators receive most of the newly minted tokens as block rewards
- A portion may go to a treasury fund or foundation
- Some networks burn part of the transaction fees

:::note
In PoS blockchains, validators don't just collect user fees — they receive newly created tokens from the protocol's inflation model. These tokens are automatically minted by the protocol during block or epoch creation.
:::

### Crypto Primitives in Blockchain
Cryptographic primitives are the basic building blocks of cryptographic systems used in blockchain to ensure security, integrity, and authenticity.

#### Essential Crypto Primitives:

1. **Hash Functions** (e.g., SHA-256, Keccak)
   - One-way functions used to create unique fingerprints of data
   - Used in: Bitcoin, Ethereum, Solana (uses SHA-256 + SHA-512)

2. **Public-Key Cryptography**
   - A pair of keys — one public, one private — is used to encrypt, decrypt, and sign data

3. **Digital Signatures** (e.g., ECDSA, Ed25519)
   - Allow users to prove ownership and authorize transactions
   - Used in: Bitcoin (ECDSA), Ethereum (ECDSA), Solana (Ed25519)

4. **Merkle Trees**
   - A tree structure that enables efficient and secure verification of large data sets (like all transactions in a block)
   - Reduces the amount of data needed to verify integrity
   - Used in: Bitcoin, Ethereum (in receipts and logs), others

📚 [Learn more about crypto primitives](https://cryptobook.nakov.com/)

| Blockchain | Hashing | Signature | Other |
|------------|---------|-----------|--------|
| Bitcoin | SHA-256 | ECDSA | Merkle Tree |
| Ethereum | Keccak-256 | ECDSA | Merkle Patricia Trie |
| Solana | SHA-256 + SHA-512 | Ed25519 | Flat account state |

## Blockchain Trilemma

The **Blockchain Trilemma** is a term popularized by Ethereum co-founder Vitalik Buterin to describe the challenge of achieving three key objectives in blockchain networks simultaneously:

### The Three Pillars

1. **Decentralization**
   - The network is not controlled by a single entity or small group
   - Anyone can participate in validating transactions and governing the system

2. **Security**
   - The network is resistant to attacks, manipulation, or failure
   - It protects user data, funds, and transaction integrity

3. **Scalability**
   - The ability of the blockchain to handle a growing number of transactions per second (TPS)
   - Without slowing down or becoming expensive

### Trade-offs

Most blockchains can effectively optimize only two of these three properties at any given time:

- **Bitcoin**: Prioritizes security and decentralization, but sacrifices scalability (low TPS)
- **Solana**: Focuses on scalability and security, but critics argue it may reduce decentralization due to high hardware requirements
- **Ethereum (Pre-2.0)**: Strong in decentralization and security, but struggles with scalability — hence high gas fees during peak use

```
        Decentralization
              /\
             /  \
            /    \
           /      \
          /        \
         /__________\
    Security      Scalability
```

In this triangle, most projects lie toward one side and must make trade-offs. Solving the trilemma means finding a system design that balances all three without major compromises — a current goal of innovation in blockchain technology.

### Solutions Being Developed

To address the trilemma, developers and researchers are working on:
- Layer 2 Solutions (e.g., Optimistic Rollups, zk-Rollups)
- Sharding (breaking the blockchain into smaller pieces)
- New Consensus Mechanisms (e.g., Proof of Stake, Delegated PoS)
- Interoperability Protocols (e.g., Polkadot, Cosmos)

## Blockchain Structures and Operations

### Block
A unit of data in the blockchain that contains transactions, a timestamp, and a reference (hash) to the previous block.

### Transaction
A record of an operation (e.g., sending cryptocurrency) stored in a block.

### Smart Contract
A self-executing contract with the terms directly written into code.

**Example**: An escrow system where funds are released only after certain conditions are met.

### Gas
A unit that measures the amount of computational effort required to execute operations.

### Wallet
A digital tool (software or hardware) that allows users to store and manage their cryptocurrencies.

### Private Key & Public Key
A cryptographic pair. The private key is kept secret and used to sign transactions, while the public key is shared and used to verify them.

## Ecosystem & Use Cases

### Oracle
A blockchain oracle is a service that connects smart contracts to external data sources, enabling them to access information that exists outside the blockchain (also called off-chain data).

| Type of Oracle | Description |
|----------------|-------------|
| **Inbound** | Delivers real-world data to smart contracts (e.g., price feeds) |
| **Outbound** | Sends blockchain data to external systems |
| **Software** | Pulls data from APIs, websites, databases |
| **Hardware** | Gets data from physical sensors, IoT devices |
| **Human** | Verified individuals provide data input manually |
| **Decentralized** (e.g. Chainlink) | Uses multiple sources and consensus to prevent manipulation |

### dApp (Decentralized Application)
An application that runs on a decentralized network rather than a single server.

### DeFi (Decentralized Finance)
Financial services without traditional intermediaries like banks.

**Examples**: Lending platforms, DEXs (Decentralized Exchanges)

### NFT (Non-Fungible Token)
Unique digital assets that represent ownership of specific items or content, often used in art, gaming, or music.

### DAO (Decentralized Autonomous Organization)
An organization governed by smart contracts and voting systems rather than central leadership.

### Layer 1 vs Layer 2

- **L1 (Layer 1)**: The base blockchain (e.g., Ethereum) — secure but limited in throughput
- **L2 (Layer 2)**: Built on top of L1 to scale it — processes many transactions off-chain or in batches, then submits the result back to L1

#### Transaction Flow:
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

## Security & Risks

### 51% Attack
When an entity gains over 50% of the network's hashing power, potentially allowing them to double-spend or block transactions.

### Rug Pull
A type of scam where project creators take investor funds and disappear.

### Phishing
Fraudulent attempts to obtain sensitive information such as private keys or seed phrases.

### Re-Entrancy Attack
A vulnerability in smart contracts where an external contract calls back into the original contract before the first execution is finished, often used to drain funds.

**Example**: The DAO hack on Ethereum in 2016 — ~$60M lost due to improper state updates before fund transfers.

**Prevention:**
- Update state before external calls
- Use reentrancy guards (e.g., mutex or `nonReentrant` in Solidity)

### Sandwich Attack
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

## Developer Essentials

### Solidity
The main programming language for Ethereum smart contracts.

### EVM (Ethereum Virtual Machine)
The environment in which all Ethereum smart contracts run.

### Web3.js / Ethers.js
JavaScript libraries to interact with Ethereum and smart contracts.

### RPC (Remote Procedure Call)
A communication protocol used to interact with blockchain nodes.

### CLI
CLI is a text-based interface used to interact with blockchain clients or tools via terminal/command prompt. It offers full control, automation, and low-level interaction — essential for developers and node operators.

**Use Cases in Blockchain:**
- Deploy and interact with smart contracts
- Send transactions manually
- Query network data
- Set up validators or nodes

**Examples**: `cedra-cli`, `solana-cli`, `near-cli`, `geth`, `hardhat`, `eth-cli`

### Zero-Knowledge Proof
A Zero-Knowledge Proof is a cryptographic method that allows one party (the prover) to convince another (the verifier) that a statement is true without revealing any information beyond the fact that the statement is indeed true.

There are multiple types, such as: zk-SNARKs, zk-STARKs, Bulletproofs, etc.

**What problem does it solve?**
- **Privacy**: Proves knowledge or computation without revealing sensitive data
- **Integrity**: Ensures computations are done correctly, useful in blockchains and authentication

### Blockchain Bridge
A blockchain bridge connects two separate blockchains, allowing assets or data to be transferred between them.

**A blockchain bridge allows:**
- The transfer of tokens
- The movement of data
- The execution of logic across chains

**What problem does it solve?**
- **Interoperability**: Enables ecosystems like Ethereum, Solana, or Bitcoin to interact
- **Liquidity fragmentation**: Helps use tokens across chains without siloing liquidity

:::note Why are bridges needed?
Bridges are needed because most blockchains are not natively compatible — Bitcoin, Ethereum, Solana, etc., all use different consensus mechanisms, address formats, and virtual machines.
:::

**Problems Solved by Bridges:**
- **Asset portability**: Move tokens from one chain to other chains to avoid high fees
- **DeFi composability**: Use an asset on multiple platforms (e.g., stake ETH on Avalanche)
- **Network scalability**: Offload transactions to layer-2s or sidechains
- **Cross-chain dApps**: Combine functionality across chains (e.g., an app using Solana speed + Ethereum security)

## How Bridges Are Built (Mechanisms)

### 1. Trusted (Centralized) Bridges
- Operated by a central custodian (e.g., Binance Bridge)
- The user sends assets to a controlled wallet on Chain A
- Equivalent tokens are minted on Chain B by the custodian

**Risks:**
- Custodian key compromise
- Lack of transparency

### 2. Federated (Multi-sig / MPC) Bridges
- A set of validators (e.g., 5-of-7 multisig) manage asset locking and minting
- Can use MPC (Multi-party computation) for managing shared signing keys
- More decentralized than custodial bridges, but still not trustless

**Risks:**
- Collusion among validators
- Still partially trusted

### 3. Trustless (Smart Contract + ZKP + Light Client) Bridges
Rely on on-chain verification of state transitions or proofs. Most secure and decentralized form.

**How it works:**
1. **On Chain A**: A user locks or burns tokens. A zk-proof is generated attesting that this event occurred according to Chain A's consensus rules
2. **Proof Generation**: A zk-circuit models the consensus & logic. Generates a validity proof (e.g., zk-SNARK or zk-STARK)
3. **On Chain B**: A smart contract verifies the zk-proof. If the proof is valid, a wrapped token is minted or an action is executed

**Challenges and Limitations:**
- **Heavy setup cost**: circuit design and proof generation can be complex
- **Proof generation cost**: still CPU/GPU intensive (especially zk-STARKs)
- **Still experimental**: fewer projects use it in production compared to MPC or multisig bridges