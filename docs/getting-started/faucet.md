# Get Cedra Test Tokens (CEDRA) - cURL & CLI

This short guide explains how to request Cedra testnet tokens (CEDRA) **from the command line** using `curl`. These tokens are only for development and testing—**they have no real‑world value**, and it is **impossible to mint CedraCoin on the Cedra mainnet**.

## Prerequisites

* **cURL installed**

  * macOS / Linux: already present or `brew install curl`
  * Windows: install via [official binaries](https://curl.se/download.html) or use WSL.
* **Cedra testnet account** (address & authentication key).
  Use your account or generate one with the Cedra CLI:

  ```bash
  cedra init  # interactive; choose \"devnet\" when prompted
  ```

  Save the `account address` (0x…) and the `authentication key` (64‑char hex). If you need to look up the address later, run `cedra account lookup-address`. If you need an address with a balance, just run `cedra account show` 

## 1 · Mint test tokens

```bash
curl --location --request POST \
  "https://faucet.cedra.dev/mint?amount=<AMOUNT>&auth_key=<AUTH_KEY>" \
  --data ''
```

Replace:

* `<AMOUNT>` - Number of CEDRA you want (e.g., `10`) on Octas.
* `<AUTH_KEY>` - your authentication key.

**Example:**

```bash
curl --location --request POST \
  "https://faucet.cedra.dev/mint?amount=10&auth_key=e3219c42819854d01f0ea6865b78061cdf657374637fee8aee7501f9e6e185db" \
  --data ''
```

The faucet responds with a JSON payload containing the transaction hash.

## 2 · Verify your balance

After the transaction is finalized (normally within seconds), query the Cedra REST API:

```bash
curl "https://testnet.cedra.dev/v1/accounts/<ACCOUNT_ADDRESS>/balance/0x1::cedra_coin::CedraCoin"
```

Replace `<ACCOUNT_ADDRESS>` with your account address (0x…).

Expected response is your balance in octas

## Alternative · Fund via CLI faucet (1 CEDRA)

If you have the Cedra CLI installed, you can trigger the Cedra faucet directly without constructing a cURL request:

```bash
cedra account fund-with-faucet
```

* Funds **1 CEDRA** to the specified account.
* Uses the same faucet service behind the scenes.
* Helpful when scripting alongside other Cedra CLI commands.

It will atomatically add 1 CEDRA to your default account

## Usage notes

* **No mainnet minting:** You cannot mint CedraCoin on mainnet; faucets are testnet‑only.
* **Security:** Keep your private key and auth key secret.

## Troubleshooting

* **`403 Forbidden`** - invalid or malformed `account_address`; double‑check it.
* **`429 Too Many Requests`** - rate limit reached; wait before retrying.
* \*\*Balance still \*\***`0`** - transaction not yet finalized; retry in \~30 seconds or check the Cedra explorer.

