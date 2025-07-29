# Cedra CLI Installation Guide

The Cedra Command Line Interface (CLI) is the primary tool for developers and users to interact with the Cedra blockchain. It lets you manage accounts, deploy Move modules, test code, execute transactions, and query network state.

:::tip Prerequisites
Before installing the Cedra CLI, make sure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs) - Required for building from source and running JavaScript/TypeScript clients
:::

> **Next step:** After installation, open a terminal and run `cedra --version` to confirm your setup, then explore the [CLI guide](/cli/usage) for all available commands.

## Installation

### Option 1 – Download a pre‑built binary (recommended)

1. Visit the **Cedra CLI v1.0.1** release page: [https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.1](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.1).
2. In the **Assets** section, choose the file that matches your platform:

| OS           | Architecture          | File name                                 |
| ------------ | --------------------- | ----------------------------------------- |
| Linux        | x86\_64               | `cedra-cli-1.0.1-Linux-x86_64.zip`        |
| Linux        | aarch64               | `cedra-cli-1.0.1-Linux-aarch64.zip`       |
| macOS        | x86\_64               | `cedra-cli-1.0.1-macOS-x86_64.zip`        |
| macOS        | arm64 (Apple Silicon) | `cedra-cli-1.0.1-macOS-arm64.zip`         |
| Ubuntu 22.04 | x86\_64               | `cedra-cli-1.0.1-Ubuntu-22.04-x86_64.zip` |
| Ubuntu 24.04 | x86\_64               | `cedra-cli-1.0.1-Ubuntu-24.04-x86_64.zip` |
| Windows      | x86\_64               | `cedra-cli-1.0.1-Windows-x86_64.zip`      |

3. Extract the archive.
4. Move the `cedra` (or `cedra.exe` on Windows) executable to a folder that is in your **PATH**:

   * **macOS / Linux**: `/usr/local/bin` or `$HOME/.local/bin`
   * **Windows**: `C:\Windows\System32` or any folder listed in *Environment Variables → Path*
5. Check current CLI version:

```bash
cedra --version
```

### Option 2 – Install via Chocolatey (Windows only)

1. Run the following command:

```powershell
choco install cedra
```

2. Once installed, verify:

```powershell
cedra --version
```

More details available here: [Chocolatey Cedra CLI Package](https://community.chocolatey.org/packages/cedra/1.0.1)

### Option 3 – Install via Debian package (Ubuntu/Debian-based)

If you're using Ubuntu/Debian and prefer using `.deb` files:

```bash
wget https://launchpad.net/~username/+archive/ubuntu/ppa/+files/cedra-cli_1.0.1_amd64.deb
sudo dpkg -i cedra-cli_1.0.1_amd64.deb
```

After installation, confirm:

```bash
cedra --version
```

### Option 4 – Build from source

If you prefer compiling yourself or contributing to Cedra:

```bash
git clone https://github.com/cedra-labs/cedra-network
cd cedra-network/devtools/cedra-cargo-cli
cargo build --release
```

The compiled binary will be at `target/release/cedra` (or `.exe` on Windows). Add it to your **PATH** and run `cedra --version` to confirm.

### Option 5 – Install via Homebrew (coming soon)

:::info
The Cedra CLI for Homebrew is currently under review by the Homebrew community. Once approved and merged, it will be available via the standard Homebrew package manager.
:::


## What's next?
* **Dive depper into the CLI** - via [CLI guide](/cli/usage)
* **Start your write your first contract** - via [CLI guide](/getting-started/counter)
* **Build your first DApp** - via our [Real World Guides](/real-world-guides)
