# CLI Usage 

:::info Prerequisites & Installation
Before using the Cedra CLI, ensure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs) - Required prerequisites
- ✅ [Installed the Cedra CLI](/getting-started/cli) - Step-by-step installation guide

If you haven't installed the CLI yet, check our [Getting Started CLI guide](/getting-started/cli) for complete setup instructions.
:::

## 📖 Overview

The Cedra Command Line Interface (CLI) is a developer tool for compiling and testing Move smart contracts, managing accounts, and interacting with the Cedra blockchain. It offers a convenient way to perform on-chain operations, run a local network, and manage keys directly from your terminal. This guide provides a feature-by-feature walkthrough of Cedra CLI usage, targeted at developers (including those new to Move and Cedra). Each section below explains what a feature does, when to use it, and provides step-by-step instructions with examples.

## ⚡ Ready to start!

These commands cover the typical development workflow:

:::tip Quick Commands
* Use `cedra init` to **initialize account** 🏗️
* Use `cedra move init` when **starting a new smart contract project** 📦
* Use `compile` and `test` frequently during development to **catch errors** and verify logic off-chain 🔍
* Use `cedra move publish` when you're ready to **deploy your module** to a network 🚀
:::

Want to dive deeper? Welcome to information below 👇


## 1. Initial Configuration:

After installing, configure the CLI and create an initial account profile using `cedra init`. This command creates a configuration file and can generate a new account for you.

* **Running `cedra init`:** Open a terminal in your project or working folder and run:

  ```bash
  cedra init
  ```

  You will be prompted to enter:

  1. **🌐 REST URL** – the endpoint of the Cedra fullnode to use. If you press Enter with no input, it defaults to Cedra Testnet's URL. Available networks:
     - **Testnet**: `https://testnet.cedra.dev`
     - **Devnet**: `https://devnet.cedra.dev`
  2. **🔑 Private Key** – a hex literal for your account's private key. If you leave this blank, the CLI will generate a new key pair for you automatically.

  For example, a new developer can accept all defaults to connect to Testnet and generate keys. The CLI then creates a fresh Cedra account on Testnet and funds it with test coins via the faucet. You'll see output similar to:

  ```text
  Cedra is now set up for account 0x00f1f20...79696!  Run `cedra help` for more commands  
  {  
    "Result": "Success"  
  }
  ```

  This indicates a new account was created (with a unique address). The CLI saved your config in `.cedra/config.yaml`, which includes the active profile (named "default") and a reference to your new private key.

:::note Multiple Profiles
**Profiles:** Cedra CLI supports multiple profiles, which are separate configurations (useful if you manage multiple accounts or networks). You can create additional profiles by running `cedra init --profile <name>` (e.g. `cedra init --profile testProfile`). This will prompt for endpoints and keys again and create a separate entry in your config file. Later, you can use `--profile <name>` flag with most commands to switch which account or network you are targeting. If no profile is specified, the CLI uses the `default` profile.
:::

After initialization, you're ready to use Cedra CLI. In the following sections, we'll walk through common tasks like managing accounts, keys, Move packages, and more.


## 2. Account Management

In Cedra, an **account** represents an on-chain identity with an address, public/private key pair, and associated resources. The CLI provides commands to create accounts, fund them with test tokens, check their state, and perform basic transactions. This section covers how to manage accounts using Cedra CLI.

### 🆕 Create a New Account

The simplest way to create a new account is via `cedra init` (as shown above), which generates a key and registers the account on Testnet automatically. You can also generate an account without the interactive prompt by using the key tool (see **Key Management** below) and then fund it manually.

### 📊 Viewing Account Information

You can check its on-chain data using CLI queries. The `cedra account list` command lets you view balances, resources, and other details of an account.

* **💰 Check Balance:** Every account has a balance of the native token (for Cedra Testnet, test CED or similar). To view an account's coin balance and related information, run:

  ```bash
  cedra account list --query balance --account default
  ```

  This will output JSON data like:

  ```json
  {
    "Result": [
      {
        "coin": {
          "value": "110000"
        }
        ...
      }
    ]
  }
  ```

  The `value` field shows the account balance in the octas.

* **List Resources:** An account can hold various Move **resources** (data structures defined by smart contracts). To list all resources in an account, use:

  ```bash
  cedra account list --account <ADDRESS>
  ```

  or equivalently `--query resources`. This returns all resources stored under that account in JSON format. For example, you will see the coin resource (as shown above), and any other resources the account has acquired (such as tokens, NFTs, etc.). Each resource is identified by its type (module and struct name) and contains the stored data.

* **List Modules:** If the account has published Move modules (smart contracts), you can list them with:

  ```bash
  cedra account list --query modules --account <ADDRESS>
  ```

  This will output the bytecode for each module published in that account. (It's usually more useful to verify modules via source code, but this command confirms what's on-chain.)

* **Account Summary:** Simply running `cedra account list` with no `--query` will default to listing **resources** (same as `--query resources`). This gives a quick snapshot of an account's state.

### 💸 Transferring Tokens Between Accounts

Cedra CLI can act as a basic wallet to send the native coins from one account to another. The `cedra account transfer` command facilitates this, with support for custom gas payments.

* **📤 Send a Transfer with Native Gas:** To send funds using CED for gas fees:

  ```bash
  cedra account transfer --account <RECIPIENT> --amount <NUMBER>
  ```

* **💰 Send a Transfer with Custom Gas:** To send funds using a whitelisted token for gas fees:

  ```bash
  cedra account transfer \
      --account <RECIPIENT> \
      --amount <NUMBER> \
      --fa-address <TOKEN_ADDRESS> \
      --max-gas <GAS_LIMIT>
  ```

  Example using USDT for gas:
  ```bash
  cedra account transfer \
      --account 0x35c82a4fbf233f793b49de20212872ada755073f2a5b74c00ab4661da1220686 \
      --amount 10 \
      --fa-address 0x35c82a4fbf233f793b49de20212872ada755073f2a5b74c00ab4661da1220685::usdt::USDT \
      --max-gas 5000
  ```

  The CLI will output a JSON result of the transaction, including the gas used (in the custom token), balance changes, and success indicator:

  ```json
  {
    "Result": {
      ...
      "gas_used": 3421,
      "gas_token": "USDT",
      "vm_status": "Executed successfully"
    }
  }
  ```

:::tip Custom Gas Benefits
Using custom gas tokens eliminates the need for users to hold CED tokens. This is especially useful for:
- New users who receive stablecoins directly
- DeFi protocols that want to subsidize gas for their users
- Gaming projects where players only need the game token
:::

### ⛽ Custom Gas Payment Parameters

The new `--fa-address` parameter enables gas payment with whitelisted tokens:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--fa-address` | Fungible asset address for gas payment | `0x1::usdt::USDT` |
| `--max-gas` | Maximum gas units to spend | `5000` |

**Supported Tokens:** Only whitelisted tokens can be used for gas. Check available tokens:

```bash
# View whitelisted gas tokens
cedra move view \
    --function-id 0x1::whitelist::get_whitelisted_tokens
```

**Error Handling:** Common issues when using custom gas:

| Error | Cause | Solution |
|-------|-------|----------|
| `ETOKEN_NOT_WHITELISTED` | Token not approved for gas | Use a whitelisted token |
| `EINSUFFICIENT_GAS_BALANCE` | Not enough tokens for gas | Top up your token balance |
| `EINVALID_TOKEN_ADDRESS` | Incorrect token format | Check the token address format |

## 3. Key Management (Generate & Recover Keys)

Cedra CLI provides tools for generating new cryptographic keys, managing multiple keys, and importing existing keys from other wallets. This is useful for creating accounts programmatically or managing multiple development identities.

### 🎲 Generating New Keys

* **Create Keys:** The `cedra key generate` command creates a new Ed25519 key pair and saves it to files:

  ```bash
  cedra key generate --key-type ed25519 --output-file my-key
  ```

  This creates two files: `my-key` (private key) and `my-key.pub` (public key). The CLI will also print the account address that corresponds to this key:

  ```json
  {
    "Result": {
      "PrivateKey Path": "my-key",
      "PublicKey Path": "my-key.pub"
    }
  }
  ```

  You can now use this key to initialize or import an account.

:::warning Key Security
**Storing Keys:** Keys generated with `cedra key generate` are not automatically added to your CLI config. They are just files. You can use them by either: (a) running `cedra init --private-key <path_to_key>` to create a profile with that key, or (b) manually editing your `.cedra/config.yaml` to reference the private key for a profile.
:::

### 🔄 Recovering Accounts with Existing Keys

If you have an existing private key (from another wallet or a previous backup), you can import it into Cedra CLI to manage that account.

**📥 Import via Private Key:**

The CLI `init` command accepts a `--private-key` argument. If you have the key as a hex string, you can run:

```bash
cedra init --private-key <YOUR_PRIVATE_KEY_HEX>
```

This will set up a new profile using the given key. Once imported, you can use the CLI to view the account (`cedra account list`) or execute transactions as normal. Key management commands help you handle keys safely outside the blockchain, while account commands manage on-chain entities.


## 4. Move Project Management (Init, Compile, Test, Publish)

One of the Cedra CLI's most powerful features is helping you develop and deploy **Move** smart contracts. The CLI can **create** a new Move project, **compile** it, run Move **unit tests**, and **publish** your modules to the blockchain. This section walks through a typical Move development cycle using Cedra CLI.

For a comprehensive guide on package management, see [Move Package Management](/move-package-management).

### 🎬 Initializing a New Move Project

```bash
cedra move init --name <PACKAGE_NAME>
```

This will create a new folder (named after your package) with a `Move.toml` file and a `sources/` directory.

Next, add your Move source code in the `sources/` directory.

### 🔨 Compiling Move Code

```bash
cedra move compile
```

Make sure you execute this inside the project directory (where `Move.toml` is located). The CLI will compile your Move modules and any dependencies. If successful, it will produce compiled bytecode in a `build/` directory, and list the module IDs (addresses and names) that were compiled. If there are errors, the compiler will display them with file and line numbers so you can fix your code.

:::tip Clean Build
If you want to clear the compiled artifacts, you can run `cedra move clean`. This deletes the `build` directory. It's not required but helps ensure you're starting fresh.
:::

### 🧪 Running Move Unit Tests

Move allows you to write unit tests within your modules (functions annotated with `#[test]`). To execute these tests with the CLI, run:

```bash
cedra move test
```

This will compile the package (in test mode) and run all tests in your code. Output will show which tests passed or failed, along with any debug prints or assertions from the tests. Use this to verify your module's logic off-chain before deploying.

For comprehensive testing documentation including test annotations, expected failures, and best practices, see [Move Unit Testing](/move/testing).

### 🚀 Publishing Move Modules to the Blockchain

For packages exceeding 64KB, see [Deploying Large Packages](/large-packages).

3. **📤 Publish the Package:** Run the `cedra move publish` command (with `--named-addresses` as needed). The CLI will first **simulate** the publish transaction (see next section on simulation) and then ask for confirmation to actually submit it. For example:

   ```bash
   cedra move publish --named-addresses my_first_module=default
   ```

   On success, you'll get a JSON output with details of the transaction, including a `transaction_hash`, gas used, the sender, and `success: true` if it executed.

4. **✅ Verify on Chain:** After publishing, you can use `cedra account list --query modules --account <publisher>` to see the module in the account's modules list.

## 5. Transaction Simulation and Execution

Before executing any transaction on-chain, it's often useful (or even automatic) to **simulate** it – to ensure it will succeed and to estimate gas usage. Cedra CLI provides built-in support for simulating transactions, either on the remote network or locally, and then executing them.

:::info Default Behavior
**🔍 Simulate then Execute:** By default, when you run a command like `cedra move publish` or `cedra move run` (to execute a Move function), the CLI will first submit the transaction as a **simulation** to the network's REST API. This means the transaction is run against the current blockchain state *without actually committing it*, so you can see if it would succeed and how much gas it would use. If the simulation passes (no aborts or errors), the CLI will prompt you to confirm execution. This protects developers from accidentally sending failing transactions. *(In technical terms, the CLI "simulation" uses the Cedra fullnode's simulation endpoint under the hood.)*
:::

For example, if you run a Move script call:

```bash
cedra move run --function-id default::message::set_message --args string:"Hello, Cedra!"
```

the CLI will simulate this call on the specified network. You might see output indicating a simulation succeeded and a prompt like "Submit transaction (yes/no)?"". After you type "yes", the transaction is submitted to be executed (committed) on chain.

### 🏠 Local Simulation Mode

Cedra CLI can also simulate transactions entirely **locally** (without contacting a node). This is useful for rapid feedback or offline analysis. To do this, append the `--local` flag to your command. For instance:

```bash
cedra move run --function-id default::message::set_message --args string:"Test" --local
```

### 🎬 Executing (Submitting) Transactions

After simulation, when you confirm, the CLI submits the transaction to the network for execution. If you prefer to skip the interactive confirmation , you can add the `--assume-yes` flag to any command that prompts. This tells the CLI to proceed without asking, essentially assuming you typed "yes" to all confirmations.

### 🎯 Example – Running a Move Function

Suppose you published the `message::set_message`. To call this function on Testnet via CLI:

**Using Native CED for gas:**
```bash
cedra move run --function-id <your_address>::message::set_message --args string:"Hello!"
```

**Using Custom Token for gas:**
```bash
cedra move run \
    --function-id <your_address>::message::set_message \
    --args string:"Hello!" \
    --fa-address 0x1::usdt::USDT \
    --max-gas 10000
```

The CLI will:

1. 🔍 Simulate the call on the Testnet node (by default).
2. 📊 Show you the result (e.g., success and gas cost in the specified token).
3. ❓ Prompt for confirmation. If you continue, it will send the transaction for execution.

After execution, you'll get a JSON result similar to other transactions (`gas_used`, `gas_token`, `success`, etc.). You can then query the account's resources to see the effect (e.g., the `MessageHolder` resource now stored under that account).

:::info Custom Gas in Move Calls
Any Move function call can use custom gas tokens. This includes:
- Contract deployments (`cedra move publish`)
- Function executions (`cedra move run`)
- View functions with state changes
- Governance operations
:::

:::tip Best Practice
**When to Use Simulation:** Always! It's good practice to let the CLI simulate transactions first – this way you avoid wasting gas on mistakes. The simulation results give you a chance to inspect what will happen. For complex or state-changing operations, consider using `--local` simulation to test different scenarios offline. Use `--benchmark` and `--profile-gas` during development to improve your code (for example, to ensure your transaction stays within desired gas limits or to identify which parts of your code are costly).
:::

## 6. Viewing Resources and Events

Blockchain applications revolve around **resources** (Move's persistent data) and **events** (emitted records of actions). Cedra CLI provides commands to inspect these on-chain, primarily through the `account` subcommands.

### 📋 Listing Account Resources

As described, `cedra account list --account <addr>` will show all Move resources in the account. This is the primary way to view on-chain state for that account. Each resource is output as a JSON object with its fields. For example, a coin resource might look like:

```json
{
  "coin": { "value": "1000" },
  ...
}
```

Use this command whenever you need to inspect the outcome of transactions. For instance, after calling a `set_message` function, you could run `cedra account list --account default` (if default is the affected account) to see the `MessageHolder` resource now exists and contains the message you stored.

### 🔍 Querying Specific Data

The CLI's `--query` flag can narrow down what you see:

* `--query resources` (default) shows all resources.
* `--query balance` shows just the coin balance resource with its event handles.
* `--query modules` lists the account's modules (bytecode).

If you only care about balances and coin events, use the `balance` query. If you want the full state dump, use `resources`. This can be useful for debugging state differences, especially in testing scenarios.

:::note Summary
**📊 Summary:** Use Cedra CLI to get a quick snapshot of account state and ensure your transactions did what you expected:

* After any state-changing transaction (publish, coin transfer, resource modification), run `cedra account list` on the affected account to see new resource values.
* Use the queries to focus on balances or confirm modules.
* For detailed event logs, consult Cedra's explorer or APIs, as CLI outputs only include event counters by default.
:::

## 7. Useful Utilities (Version Info and Gas Profiling)

Finally, Cedra CLI offers some utility commands that can make development easier or provide meta-information about the CLI and your transactions. Two notable ones are checking the CLI version and profiling gas usage.

### ℹ️ CLI Version and Info

It's important to know which version of Cedra CLI you are running, especially as Cedra evolves. You can check this in a couple ways:

* `cedra --version` – prints the version number of the CLI (for example, `cedra 2.1.0` if using an Cedra build). This is a quick way to verify if you have the latest release.
* `cedra info` – shows detailed build information about the CLI tool. Running this outputs a JSON with fields like `build_commit_hash`, `build_time`, and `build_pkg_version`. This is mostly useful for debugging or when reporting issues (so developers know exactly what build you're using).

For example:

```bash
cedra info
```

might output:

```json
{
  "Result": {
    "build_branch": "main",
    "build_git_rev": "abc1234...",
    "build_pkg_version": "1.0.0",
    "build_time": "2025-01-15 12:00:00",
    "build_os": "macos-aarch64"
  }
}
```

### ⛽ Gas Profiling Utility

Gas fees are a critical aspect of blockchain transactions. Cedra CLI's gas profiler helps you understand how much gas your transactions consume and where. This is particularly helpful when optimizing smart contracts.

* **📈 Profiling a Transaction's Gas:** To profile gas, add `--profile-gas` to a transaction execution command. For example:

  ```bash
  cedra move run --function-id default::message::set_message --args string:"Hi" --profile-gas
  ```

  When you run this, the CLI will **simulate the transaction locally with instrumentation**. You'll see output indicating the simulation and where the gas report was saved:

  ```text
  Simulating transaction locally using the gas profiler...
  Gas report saved to gas-profiling/txn-<XYZ>-<function-name>
  {
    "Result": { "transaction_hash": "...", "gas_used": 441, ... "success": true, ... }
  }
  ```

  . The CLI still prints a Result (as if the transaction executed, though it was just a simulation), but crucially it generates a detailed report in a directory called `gas-profiling/`.

  In your project folder, after running the above, look for a new folder `gas-profiling/txn-<something>/`. Inside, you will find an `index.html` along with an `assets/` directory. Open `index.html` in a web browser to view the gas report.