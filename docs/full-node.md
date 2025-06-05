# Cedra Fullnode Overview

A **Cedra node** is an always‑on service that tracks and serves the canonical state of the Cedra blockchain. All wallets, explorers, exchanges, and dapps communicate with the chain through these nodes.

Cedra‑core can operate in two mutually‑exclusive roles:

| Role               | Purpose                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Validator node** | Executes and signs blocks, participates in BFT consensus, and earns staking rewards. |
| **Fullnode**       | Replicates the ledger for read/write access but **does not** vote in consensus.      |

## Internal Components

A Cedra node is composed of several logical services, each running inside the same binary:

1. **REST API service** – HTTP+JSON entry point for clients.
2. **Mempool** – Admits, orders, and gossips pending transactions.
3. **Execution** – Runs transactions through **MoveVM** and produces deterministic outputs.
4. **MoveVM** – Executes Move bytecode with linear‑type resource safety.
5. **Storage** – Persists blocks, state, and events in a RocksDB‑backed datastore.
6. **State synchronizer** – Streams certified ledger data from upstream peers and keeps local state in lock‑step.

> **Tip :** The same cedra‑core binary can be started with `--role validator` or `--role fullnode` to switch behavior.

## Fullnode Operation

Fullnodes may be run by **anyone**. They bootstrap by downloading the ledger from an upstream peer and then either:

* **Re‑executing** every historical transaction to independently verify state, **or**
* **Replaying outputs** (faster) after checking the epoch accumulator root signed by the validators.

Fullnodes also accept client‑submitted transactions and forward them to validators, but they **do not** take part in consensus voting.

### Upstream Options

| Fullnode type          | Upstream peer                      |
| ---------------------- | ---------------------------------- |
| **Validator fullnode** | Directly follows a validator node. |
| **Public fullnode**    | Follows another fullnode.          |

The functionality is identical - the label only reflects who the upstream is.

## Why Run a Fullnode?

* Use the local **REST interface** for unrestricted blockchain interaction.
* Obtain a consistent, trust‑but‑verify view of the Cedra ledger.
* Bypass public endpoint rate limits for high‑volume reads.
* Run custom analytics over historical data and events.
* Receive real‑time on‑chain notifications without third‑party services.

## Testnet Diagnostics

Cedra testnet currently runs **three validators**. You can confirm the validator set and chain metadata with cURL:

```bash
# Validator set (3 validators expected)
curl -s "https://testnet.cedra.dev/v1/accounts/0x1/resource/0x1::stake::ValidatorSet" | jq

# Basic chain information
curl -s https://testnet.cedra.dev/v1 | jq
```

Example output for the chain info endpoint:

```json
{
  "chain_id": 2,
  "epoch": "66",
  "ledger_version": "2757437",
  "oldest_ledger_version": "0",
  "ledger_timestamp": "1748360667256042",
  "node_role": "validator",
  "oldest_block_height": "0",
  "block_height": "1378730",
  "git_hash": "370dbf51ae76ed2fceb4267566eae10c1d6da6f1"
}
```

