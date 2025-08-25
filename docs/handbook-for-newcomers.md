---
# id: handbook-for-newcomers
title: "Handbook for Newcomers: Accounts, Move, and Beyond"
sidebar_position: 2
---

# Handbook for Newcomers

> This guide is for Web3 newcomers. If you've worked with any Web2 technology and are curious about how blockchains work or want to start building on Cedra, this is a perfect place to begin.

We want to help you understand the core ideas behind blockchains, familiarize you with the Cedra blockchain and the Move language, and prepare you to build your first (but not last) smart contract. The following two guides will walk you through writing your very own asset and editing top‑notch DeFi contracts.

## What is a Blockchain?

A blockchain is a shared database that no single person controls. Think of it as a giant spreadsheet everyone agrees on but cannot change independently. Every time something is added via a transaction, it's stored in a block and locked in forever, creating an immutable history.

Instead of trusting a central server, users rely on a network of nodes to agree on what's true. This process is called **consensus**.

## Cedra Overview

Cedra is a blockchain based on Aptos. It uses the same core technology but extends it with custom features. We inherit the best and elevate it to the next level using bleeding‑edge technology.

### Inherited from Aptos

* **Move VM** – A virtual machine built for safe and flexible smart contracts.
* **Resource‑oriented programming** – Data ownership is baked into the language.
* **Parallel execution** – Transactions are run in parallel for better performance.

### Cedra adds

* **Native sub‑chains** - Scalable multi-chain architecture.
* **Built‑in Indexer** - Real‑time on‑chain data.
* **Random generator machine** - Verifiable randomness for apps.
* **Easier module upgrades and management** – Seamless on‑chain upgrades.
* **Custom token and NFT standards** – Unified asset interfaces.
* **Native hooks for governance and modular extensions** – Modular governance hooks.

## Accounts in Cedra

On Cedra, accounts are like user profiles. Each account has an address and stores data such as tokens or custom resources. There are two types of accounts:

1. **Externally Owned Accounts (EOAs)** – Controlled by a private key (like a wallet).
2. **Resource Accounts** – Created and managed by Move code, often used for on‑chain apps.

When you want to send tokens, call a contract, or publish a module, you submit a **transaction**. Every transaction costs **gas**, a small fee paid to the network.

## The Move Language

Move differs from most general‑purpose languages. It's inspired by Rust and built around **resources**, which means assets (like tokens) can't be accidentally copied or lost.

You'll write smart contracts in **modules**, which define how your logic works. Modules can be called by scripts or by other users/contracts.

A typical Move package looks like this:

```text
Move.toml   # Project metadata
sources/    # Modules you're building
scripts/    # Custom scripts to test or run actions
```

We will dive deeper into project structure and the Move language in future courses, but for now you can use the [Move Book](https://move-book.com/reference/) to understand it better.

## Wallets, Addresses, and Key Management

To interact with Cedra, you need a **wallet**. Wallets hold your private keys and let you sign transactions. Each wallet has a public address (hex string) that identifies you on‑chain.

Common ways to back up your wallet:

* **Mnemonic phrase** (12 or 24 words)
* **Private key** (hex string)

Popular wallets include **Nightly** and **Pontem**.

## Writing & Deploying Smart Contracts

Once you install the Cedra CLI, the general flow for deploying a contract is:

1. **Create a new account**
2. **Fund it on Testnet** using the faucet
3. **Write your asset code** using Move
4. **Compile** it with the CLI
5. **Publish** the module to the blockchain
6. **Build a UI** to interact with the blockchain using the TypeScript SDK
7. **Interact** with your asset

## What's Next

You're now ready to:

* Deploy your own asset
* Build your own DEX on Cedra


## Next Steps

Now that you've set up your environment, you can:

- Check out our example implementations
- Join our community for support 