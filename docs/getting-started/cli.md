# Cedra CLI Installation Guide

The Cedra Command Line Interface (CLI) is the primary tool for developers and users to interact with the Cedra blockchain. It lets you manage accounts, deploy Move modules, test code, execute transactions, and query network state.

> **Next step:** After installation, open a terminal and run `cedra --version` to confirm your setup, then explore the [CLI guide](/cli/usage) for all available commands.

## Installation

### Prerequisites

* **Operating System**: macOS, Linux, or Windows
* **Git** *(optional)*: Only required if you plan to build from source

### Option 1 – Download a pre‑built binary (recommended)

1. Visit the **Cedra CLI v0.9.0** release page: [https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v0.9.0](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v0.9.0).
2. In the **Assets** section, choose the file that matches your platform:

| OS           | Architecture          | File name                                 |
| ------------ | --------------------- | ----------------------------------------- |
| macOS        | arm64 (Apple Silicon) | `cedra-cli-0.9.0-macOS-arm64.zip`         |
| macOS        | x86\_64               | `cedra-cli-0.9.0-macOS-x86_64.zip`        |
| Linux        | x86\_64               | `cedra-cli-0.9.0-Linux-x86_64.zip`        |
| Linux        | aarch64               | `cedra-cli-0.9.0-Linux-aarch64.zip`       |
| Windows      | x86\_64               | `cedra-cli-0.9.0-Windows-x86_64.zip`      |
| Ubuntu 22.04 | x86\_64               | `cedra-cli-0.9.0-Ubuntu-22.04-x86_64.zip` |
| Ubuntu 24.04 | x86\_64               | `cedra-cli-0.9.0-Ubuntu-24.04-x86_64.zip` |


3. Extract the archive.
4. Move the `cedra` (or `cedra.exe` on Windows) executable to a folder that is in your **PATH**:

   * **macOS / Linux**: `/usr/local/bin` or `$HOME/.local/bin`
   * **Windows**: `C:\\Windows\\System32` or any folder listed in *Environment Variables → Path*
5. Open a new terminal or command prompt and verify the installation:

```bash
cedra --version
# cedra 0.9.0
```

### Option 2 – Build from source

If you prefer compiling yourself or contributing to Cedra:

```bash
git clone https://github.com/cedra-network/cedra-core.git
cd cedra-core/cedra-cli
cargo build --release
```

The compiled binary will be at `target/release/cedra` (or `.exe` on Windows). Add it to your **PATH** and run `cedra --version` to confirm.

## What's next?
* **Dive depper into the CLI** - via [CLI guide](/cli/usage)
* **Start your write your first contract** - via [CLI guide](/getting-started/counter)
* **Build your first DApp** - via our [Real World Guides](/real-world-guides)
