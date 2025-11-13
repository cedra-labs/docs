# Cedra CLI Installation Guide

The Cedra Command Line Interface (CLI) is the primary tool for developers and users to interact with the Cedra blockchain. It lets you manage accounts, deploy Move modules, test code, execute transactions, and query network state.

:::tip Prerequisites
Before installing the Cedra CLI, make sure you have:
- ✅ [Installed Rust and Node.js](/getting-started/libs) - Required for building from source and running JavaScript/TypeScript clients
:::


## Installation

#### Recommended Installation Methods.
We recommend using your operating system's package manager for the easiest installation experience:
- **Linux (Ubuntu/Debian)**: Use APT repository
- **Windows**: Use Chocolatey
- **macOS**: Use pre-built binaries until Homebrew is approved


### Option 1 - Install via APT repository (Ubuntu/Debian - recommended)

:::tip Ubuntu Version
We recommend using Ubuntu 22.04 or later for the best compatibility.
:::

For Ubuntu/Debian users, install via the official PPA:

```bash
sudo add-apt-repository ppa:cedra-network/deps
sudo apt update
sudo apt install cedra-cli
```

Alternatively, you can download and install the `.deb` file directly. **Choose the version that matches your Ubuntu release:**

**For Ubuntu 24.04 (Noble Numbat):**
```bash
wget https://launchpad.net/~cedra-network/+archive/ubuntu/deps/+files/cedra-cli_1.0.4~noble3_amd64.deb
sudo dpkg -i cedra-cli_1.0.4~noble3_amd64.deb
```

**For Ubuntu 22.04 (Jammy Jellyfish):**
```bash
wget https://launchpad.net/~cedra-network/+archive/ubuntu/deps/+files/cedra-cli_1.0.4~jammy3_amd64.deb
sudo dpkg -i cedra-cli_1.0.4~jammy3_amd64.deb
```

:::warning Ubuntu Version Compatibility
Make sure to download the correct package for your Ubuntu version. Using the wrong package may cause compatibility issues. Check your Ubuntu version with:
```bash
lsb_release -a
```
:::

After installation, confirm:

```bash
cedra --version
```

### Option 2 – Install via Chocolatey (Windows - recommended)

1. Run the following command:

```powershell
choco install cedra
```

2. Once installed, verify:

```powershell
cedra --version
```

More details available here: [Chocolatey Cedra CLI Package](https://community.chocolatey.org/packages/cedra/1.0.4)

### Option 3 – Download a pre‑built binary (fallback option)

:::info When to use pre-built binaries
Use pre-built binaries if:
- Your OS package manager is not available
- You're on macOS (while waiting for Homebrew approval)
- You need a specific version not available in package managers
:::

1. Visit the latest **Cedra CLI v1.0.4** release page: [https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.4](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.4).

   For older versions, see [v1.0.3 release](https://github.com/cedra-labs/cedra-network/releases/tag/cedra-cli-v1.0.3).
2. In the **Assets** section, choose the file that matches your platform
3. Extract the archive.
4. Move the `cedra` (or `cedra.exe` on Windows) executable to a folder that is in your **PATH**:

   * **macOS / Linux**: `/usr/local/bin` or `$HOME/.local/bin`
   * **Windows**: `C:\Windows\System32` or any folder listed in *Environment Variables → Path*

:::warning macOS Security
On macOS, you may need to approve the CLI in System Settings:
1. When you first run `cedra`, macOS may block it as an unidentified developer
2. Go to **System Settings → Privacy & Security**
3. Find the blocked app notification and click **"Open Anyway"**
4. Alternatively, you can run: `xattr -d com.apple.quarantine /path/to/cedra`
:::

5. Check current CLI version:

```bash
cedra --version
```

### Option 4 – Build from source

If you prefer compiling yourself or contributing to Cedra:

```bash
git clone https://github.com/cedra-labs/cedra-network
cd cedra-network
cargo build --release -p cedra
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