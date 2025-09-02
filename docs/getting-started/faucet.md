# Get Cedra Test Tokens via CLI & cURL

This short guide explains how to request Cedra testnet tokens (CEDRA) **from CLI** and **from the command line** using `curl`. These tokens are only for development and testing - **they have no real‑world value**, and it is **impossible to mint CedraCoin on the Cedra mainnet**.

## Prerequisites

**Installed CEDRA CLI** you can use installation [guide](/getting-started/cli)
**Cedra testnet account** (address & authentication key).
  Use your account or generate one with the Cedra CLI:

  ```bash
  cedra init
  ```

  Save the `account address` (0x…) and the `authentication key` (64‑char hex).

## 1 · Fund via CLI faucet (1 CEDRA)

If you have the Cedra CLI installed, you can trigger the Cedra faucet directly without constructing a cURL request:

```bash
cedra account fund-with-faucet
```

* Funds **1 CEDRA** to the specified account.
* Helpful when scripting alongside other Cedra CLI commands.

## 2 · Mint test tokens

```bash
curl --location --request POST \
  "https://faucet-api.cedra.dev/mint?amount=<AMOUNT>&auth_key=<AUTH_KEY>" \
  --data ''
```

Replace:

* `<AMOUNT>` - Number of CEDRA you want (e.g., `10`) on Octas. **Maximum: 100 CEDRA per call.**
* `<AUTH_KEY>` - your authentication key.

**Example:**

```bash
curl --location --request POST \
  "https://faucet-api.cedra.dev/mint?amount=10&auth_key=e3219c42819854d01f0ea6865b78061cdf657374637fee8aee7501f9e6e185db" \
  --data ''
```

The faucet responds with a JSON payload containing the transaction hash.

## 3 · Verify your balance

After the transaction is finalized (normally within seconds), query the Cedra REST API:

```bash
curl "https://testnet.cedra.dev/v1/accounts/<ACCOUNT_ADDRESS>/balance/0x1::cedra_coin::CedraCoin"
```

Replace `<ACCOUNT_ADDRESS>` with your account address (0x…).

## 4 · Get other test assets (BTC & ETH)

If you need other fungible assets like BTC or Ethereum for testing, you can mint them directly using the Cedra CLI:

**Mint test ETH (1 ETH):**
```bash
cedra move run --function-id 0x45d869282e5605c700c8f153c80770b5dc9af2beadc3a35aa1c03aabff25f41c::minter::mint_ETH --args u64:100000000 --assume-yes
```

**Mint test BTC (1 BTC):**
```bash
cedra move run --function-id 0x45d869282e5605c700c8f153c80770b5dc9af2beadc3a35aa1c03aabff25f41c::minter::mint_BTC --args u64:100000000 --assume-yes
```

These commands will mint 1 unit of each asset (100000000 in smallest denomination) to your account.

## What's next?
* **Run first transaction** - via [First TX guide](/getting-started/tx)
* **Start your write your first contract** - via [CLI guide](/getting-started/counter)
* **Dive depper into the CLI** - via [CLI guide](/cli/usage)
* **Build your first DApp** - via our [Real World Guides](/real-world-guides)



