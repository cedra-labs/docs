# Cedra Node Installation Guide

The Cedra Node is the core component for running a validator or full node on the Cedra blockchain network. It enables you to participate in consensus, validate transactions, and maintain a copy of the blockchain state.

:::tip Prerequisites
Before installing the Cedra Node, make sure you have:
- ✅ A compatible operating system (Linux, macOS, or Windows)
- ✅ Sufficient disk space for blockchain data
- ✅ Stable internet connection
:::

## Installation

### Download from GitHub Releases

:::info Current Version
This guide covers Cedra Node v1.0.2, the latest stable release.
:::

1. Visit the **Cedra Node v1.0.2** release page: [https://github.com/cedra-labs/cedra-network/releases/tag/cedra-node-v1.0.2](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-node-v1.0.2)

2. In the **Assets** section, download the appropriate binary for your platform:

| OS           | Architecture          | File name                                    |
| ------------ | --------------------- | -------------------------------------------- |
| Linux        | x86\_64               | `cedra-node-1.0.2-Linux-x86_64.zip`        |
| Linux        | aarch64               | `cedra-node-1.0.2-Linux-aarch64.zip`       |
| macOS        | x86\_64               | `cedra-node-1.0.2-macOS-x86_64.zip`        |
| macOS        | arm64 (Apple Silicon) | `cedra-node-1.0.2-macOS-arm64.zip`         |
| Ubuntu 22.04 | x86\_64               | `cedra-node-1.0.2-Ubuntu-22.04-x86_64.zip` |
| Ubuntu 24.04 | x86\_64               | `cedra-node-1.0.2-Ubuntu-24.04-x86_64.zip` |
| Windows      | x86\_64               | `cedra-node-1.0.2-Windows-x86_64.zip`      |

3. Extract the archive and run the command:

```bash
./cedra-node --version
```

:::warning macOS Security
On macOS, you may need to approve the binary in System Settings:
**System Settings → Privacy & Security → "Open Anyway"**
:::

## What's next?

After installing the Cedra Node binary, proceed with one of these paths:

### Run a Full Node
* **[System Requirements](/nodes/requirements)** - Check hardware and network specifications
* **[Full Node Setup](/nodes/full-node)** - Configure and run a public full node to help distribute blockchain data

### Become a Validator
* **[System Requirements](/nodes/requirements)** - Ensure your hardware meets validator specifications
* **[Validator Setup](/nodes/validator-setup)** - Initial validator configuration and key generation
* **[Stake Pool Management](/nodes/stake-pool-management)** - Run a validator with direct staking (100,000 CEDRA minimum)
* **[Delegation Pool Setup](/nodes/delegation-pool-setup)** - Run a validator with community delegation (10,000 CEDRA minimum)

:::important Validator Application
To become a validator, you must submit an application: [Validator Application Form](https://tally.so/r/mDRz5b)
:::