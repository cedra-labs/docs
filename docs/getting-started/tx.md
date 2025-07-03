---
title: Your First Transaction
description: Learn how to create, sign, and submit your first transaction on the CEDRA blockchain
keywords: [cedra, blockchain, transaction, tutorial, getting-started]
---

# Your First Transaction

This tutorial will guide you through creating and submitting your first transaction on the CEDRA blockchain. You'll learn how to:

- Set up your development environment for transactions
- Create test accounts programmatically
- Build a transaction to transfer CEDRA coins
- Simulate the transaction to estimate costs
- Sign and submit the transaction
- Verify the transaction was executed successfully

:::tip Prerequisites
Before starting this guide, make sure you have:
- ✅ [Installed the CEDRA CLI](./install-cli)
- ✅ [Set up your IDE extension](./ide-setup)
- ✅ [Obtained test tokens from the faucet](./faucet)
:::

## Setting Up Your Environment

Let's create a dedicated directory for learning about transactions:

```bash
mkdir cedra-first-transaction
cd cedra-first-transaction
```

### Initialize a TypeScript Project

```bash
npm init -y
npm install @cedra-labs/ts-sdk typescript @types/node ts-node
```

Create a `tsconfig.json` file:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

Create a source directory and your first transaction file:

```bash
mkdir src
touch src/first-transaction.ts
```

## Creating Your First Transaction

Now let's write the code to create and submit a transaction:

```typescript title="src/first-transaction.ts"
import {
  Account,
  Cedra,
  CedraConfig,
  Network,
} from "@cedra-labs/ts-sdk";

async function main() {
  // Step 1: Initialize the CEDRA client
  console.log("=== Connecting to CEDRA ===");
  const config = new CedraConfig({ network: Network.TESTNET });
  const client = new Cedra(config);
  console.log("✅ Connected to CEDRA testnet");

  // Display network info
  const chainId = await client.getChainId();
  console.log(`Chain ID: ${chainId}`);
  console.log(`API Endpoint: ${config.fullnode}\n`);
  
  // Continue with account creation...
}

main().catch(console.error);
```

### Step 1: Generate Test Accounts

Add this code to create Alice (sender) and Bob (receiver) accounts:

```typescript title="src/first-transaction.ts" {15-25}
async function main() {

  // ... previous code ...
  console.log("=== Creating Accounts ===");
  const alice = Account.generate();
  const bob = Account.generate();
  
  console.log("Alice's address:", alice.accountAddress.toString());
  console.log("Alice's public key:", alice.publicKey.toString());
  console.log("\nBob's address:", bob.accountAddress.toString());
  console.log("Bob's public key:", bob.publicKey.toString());
}
```

:::warning Security Note
Never share or commit private keys! In production applications, use secure key management solutions. These keys control access to your funds.
:::

### Step 2: Fund Alice's account from faucet

```typescript title="src/first-transaction.ts"

  // ... previous code ...
  console.log("\n=== Funding Accounts ===");
  await client.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000, // 1 CEDRA = 100,000,000 sub-units
  });
  console.log("✅ Alice's account funded");
  
  // Check initial balances
  const aliceBalance = await client.getAccountCoinAmount({
    accountAddress: alice.accountAddress,
    coinType: "0x1::cedra_coin::CedraCoin",
  });
  
  const bobBalance = await client.getAccountCoinAmount({
    accountAddress: bob.accountAddress,
    coinType: "0x1::cedra_coin::CedraCoin",
  });
  
  console.log("\n=== Initial Balances ===");
  console.log(`Alice: ${aliceBalance} sub-units (${aliceBalance / 100_000_000} CEDRA)`);
  console.log(`Bob: ${bobBalance} sub-units (${bobBalance / 100_000_000} CEDRA)`);
```

### Step 3: Build the Transaction

Now let's create a transaction to transfer 1,000 sub-units from Alice to Bob:

```typescript title="src/first-transaction.ts"
async function main() {

  // ... previous code ...
  console.log("\n=== Building Transaction ===");
  const transaction = await client.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::cedra_account::transfer",
      functionArguments: [
        bob.accountAddress,
        1000, // Transfer 1000 sub-units
      ],
    },
  });
  
  console.log("✅ Transaction built");
  console.log("Transaction details:");
  console.log(`  - Function: 0x1::cedra_account::transfer`);
  console.log(`  - Sender: ${alice.accountAddress}`);
  console.log(`  - Recipient: ${bob.accountAddress}`);
  console.log(`  - Amount: 1000 sub-units`);
}
```

### Step 4: Simulate the Transaction

Before submitting, let's simulate to see the gas costs:

```typescript title="src/first-transaction.ts" {75-89}
async function main() {

  // ... previous code ...
  console.log("\n=== Simulating Transaction ===");
  const [simulationResult] = await client.transaction.simulate.simple({
    signerPublicKey: alice.publicKey,
    transaction,
  });
  
  const gasUsed = parseInt(simulationResult.gas_used);
  const gasUnitPrice = parseInt(simulationResult.gas_unit_price);
  const totalGasCost = gasUsed * gasUnitPrice;
  
  console.log("✅ Simulation complete");
  console.log(`  - Gas units used: ${gasUsed}`);
  console.log(`  - Gas unit price: ${gasUnitPrice}`);
  console.log(`  - Total gas cost: ${totalGasCost} sub-units`);
  console.log(`  - Status: ${simulationResult.success ? "✅ Will succeed" : "❌ Will fail"}`);
}
```

:::note Gas Fees
Gas is the computational fee for processing transactions. Total cost = `gas_used × gas_unit_price`. Learn more about [gas and fees](../concepts/gas-and-fees).
:::

### Step 5: Sign and Submit

Now let's sign the transaction with Alice's private key and submit it:

```typescript title="src/first-transaction.ts" {87-125}
async function main() {
  
  // ... previous code ...
  console.log("\n=== Signing Transaction ===");
  const senderAuthenticator = await client.transaction.sign({
    signer: alice,
    transaction,
  });
  console.log("✅ Transaction signed");
  
  // Submit the transaction
  console.log("\n=== Submitting Transaction ===");
  const pendingTransaction = await client.transaction.submit.simple({
    transaction,
    senderAuthenticator,
  });
  
  console.log("✅ Transaction submitted");
  console.log(`Transaction hash: ${pendingTransaction.hash}`);
  console.log(`View on explorer: https://explorer.testnet.cedra.network/txn/${pendingTransaction.hash}`);
  
  // Wait for confirmation
  console.log("\n=== Waiting for Confirmation ===");
  const committedTransaction = await client.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });
  
  console.log("✅ Transaction confirmed");
  console.log(`  - Status: ${committedTransaction.success ? "SUCCESS" : "FAILED"}`);
  console.log(`  - Gas used: ${committedTransaction.gas_used}`);
  console.log(`  - VM Status: ${committedTransaction.vm_status}`);
  
  // Verify final balances
  console.log("\n=== Final Balances ===");
  const aliceFinalBalance = await client.getAccountCoinAmount({
    accountAddress: alice.accountAddress,
    coinType: "0x1::cedra_coin::CedraCoin",
  });
  
  const bobFinalBalance = await client.getAccountCoinAmount({
    accountAddress: bob.accountAddress,
    coinType: "0x1::cedra_coin::CedraCoin",
  });
  
  console.log(`Alice: ${aliceFinalBalance} sub-units (spent ${aliceBalance - aliceFinalBalance})`);
  console.log(`Bob: ${bobFinalBalance} sub-units (received ${bobFinalBalance - bobBalance})`);
  
  const totalCost = aliceBalance - aliceFinalBalance;
  const gasCost = totalCost - 1000;
  console.log(`\nTransaction breakdown:`);
  console.log(`  - Transfer amount: 1000 sub-units`);
  console.log(`  - Gas fee: ${gasCost} sub-units`);
  console.log(`  - Total cost: ${totalCost} sub-units`);
}
```

## Running Your First Transaction

Execute the complete code:

```bash
npx ts-node src/first-transaction.ts
```

You should see output similar to:

```
=== Connecting to CEDRA ===
✅ Connected to CEDRA testnet
Chain ID: 4
API Endpoint: https://testnet.cedra.dev/v1

=== Creating Accounts ===
Alice's address: 0x978c213990c4833df71548df7ce49d54c759d6b6d932de22b24d56060b7af2aa
Bob's address: 0x7af2d6c93a2feafc9b69b5e8ad9d6b513b260f62f23f3a384a3a2e4a84694a9b

=== Initial Balances ===
Alice: 100000000 sub-units (1 CEDRA)
Bob: 0 sub-units (0 CEDRA)

=== Building Transaction ===
✅ Transaction built

=== Simulating Transaction ===
✅ Simulation complete
  - Gas units used: 146
  - Total gas cost: 14600 sub-units
  - Status: ✅ Will succeed

=== Submitting Transaction ===
✅ Transaction submitted
Transaction hash: 0x3a8a3e34a1c64ad9d7636a3a827b7ec3bb12d73825b36fa06d425c5a3b42cccc

=== Final Balances ===
Alice: 99984400 sub-units (spent 15600)
Bob: 1000 sub-units (received 1000)
```

## Using the CLI Alternative

You can also execute transactions using the CEDRA CLI:

```bash
# Transfer using CLI
cedra move run \
  --function-id 0x1::cedra_account::transfer \
  --args address:0x7af2d6c93a2feafc9b69b5e8ad9d6b513b260f62f23f3a384a3a2e4a84694a9b u64:1000 \
  --sender-account default
```

## Next Steps

Congratulations! You've successfully created and executed your first transaction on CEDRA. Here's what to explore next:

### 🛠️ Build Your First Application
- [**Counter App Tutorial**](./counter) - Build a complete dApp with a frontend
- [Move Basics](../move/introduction) - Learn the Move programming languagecontracts
