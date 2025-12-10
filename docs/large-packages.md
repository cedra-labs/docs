# Deploying Large Move Packages

This guide explains how to deploy Move packages that exceed the standard transaction size limits (>64KB) using Cedra's chunked publishing feature. This is essential for complex contracts with extensive code or large embedded data.

Use chunked publishing when:
- Your package size exceeds **64KB**
- You get `MAXIMUM_TRANSACTION_SIZE_EXCEEDED` errors during deployment
- Your package contains multiple large modules
- You have embedded large data structures in your code


Compile Your Package in usual way

```bash
cedra move compile
```

Deploy with Chunked Publishing

:::info LargePackages Module Addresses
- **Devnet**: `0x3c9124028c90111d7cfd47a28fae30612e397d115c7b78f69713fb729347a77e`
- **Testnet**: Contact the Cedra team for the official address
:::

Deploy your large package:

```bash
cedra move publish --chunked-publish \
  --large-packages-module-address 0x3c9124028c90111d7cfd47a28fae30612e397d115c7b78f69713fb729347a77e \
  --assume-yes
```

Expected output:
```
package size 189202 bytes
Publishing package in chunked mode will submit 4 transactions for staging and publishing code.

Transaction 1 of 4: Success (0x225d1ced3f7260f750917e1626ffc31da19ad8f238a05f1b966edd3b0e36762b)
Transaction 2 of 4: Success (0xfdcf43b6f6da0b467601a9b7a034dfbdfe5466baa0d310167f8328d3c62d9cb8)
Transaction 3 of 4: Success (0x5ecc225eb5d3bbbae382682992ce84c3d099e54f79edb12831477224d109d75c)
Transaction 4 of 4: Success (0x678a7cb0d2aff90ed56bcb669d26f1c7a2863b28f6d7414659415a8f4848b3b8)

All Transactions Submitted Successfully.
```

### 📝 Complete Example

For a complete working example with 9 modules that exceeds the 64KB limit, refer to the official large package example:

**[📂 View Large Package Example on GitHub](https://github.com/cedra-labs/cedra-network/tree/6a991f7a8b91582266e31253e3127388a18c42e9/cedra-move/move-examples/large_packages/large_package_example)**

This example contains:
- Nine modules (`zero.move` through `eight.move`) with large embedded data
- Proper `Move.toml` configuration
- Total package size of ~189KB requiring 4 transactions to deploy

You can clone and use this example directly, or create your own modules following a similar pattern.

### 🔧 How It Works

When deploying packages larger than 64KB, Cedra uses chunking mechanism to bypass transaction size limitations. Here's what happens behind the scenes:

1. **Package Analysis**: The CLI first analyzes your compiled package to determine its total size and calculates how many transactions are needed (typically one transaction per ~50KB of data).

2. **Data Segmentation**: Your package bytecode is intelligently split into smaller chunks that fit within individual transaction limits. Each chunk maintains integrity markers to ensure proper reassembly.

3. **Sequential Staging**: Each chunk is sent to the blockchain in a separate transaction. The `stage_code_chunk` function stores these pieces in a temporary staging area associated with your account, building up the complete package piece by piece.

4. **Final Assembly & Publication**: The last chunk triggers the complete deployment. The `stage_code_chunk_and_publish_to_account` function combines all staged chunks, verifies the package integrity, publishes it to your account, and automatically cleans up the temporary storage.

The LargePackages module provides these specialized functions to handle different deployment scenarios.