# Nova Desk

**Nova Desk** is the official desktop wallet for the Cedra blockchain. Built for power users and developers, Nova Desk combines enterprise-grade security with a seamless user interface.

## Features

### Core Features
- **Multi-Platform**: Available for Windows, Linux, and Linux ARM64
- **Secure Encryption**: AES-256-GCM encryption with Argon2 key derivation for superior security
- **Embedded DApp Browser**: Full-featured browser with direct bridge to connected dApps
- **Session Management**: Configurable session timeout with automatic locking

### Advanced Security
- **Brute Force Protection**: Automatic lockout after 5 failed attempts (5-minute cooldown)
- **Secure Memory Management**: Zeroized memory for sensitive data (private keys, passwords)
- **Storage Isolation**: Each account has isolated encrypted storage
- **Audit Logging**: Comprehensive security event logging for monitoring

### DApp Integration
- **Full Browser Integration**: Embedded browser on Linux
- **Bridge API**: REST API for dApp communication via local server
- **Transaction Signing**: Sign and submit transactions directly from browser
- **Message Signing**: Sign arbitrary messages for authentication

### User Experience
- **Modern UI**: Built with Dioxus framework for reactive, native-feeling interface
- **Dark/Light Theme**: Customizable theme system
- **System Tray**: Minimize to system tray for quick access
- **QR Code Support**: Generate and scan QR codes for addresses and transactions
- **NFT Gallery**: Built-in NFT viewing and management
- **Transaction History**: Detailed transaction records with filtering

## Download

Get Nova Desk for your platform:

[**Download Nova Desk**](https://inferenco.com/nova-desk)

## Supported Platforms
- Windows (x64)
- Linux (x64)
- Linux (ARM64 / Raspberry Pi)

## Getting Started

### Installation
1. Download Nova Desk for your operating system from the link above
2. Run the installer:
   - **Windows**: Run the `.exe` installer
   - **Linux x64**: Extract the AppImage or use the `.deb` package
   - **Linux ARM64**: Use the ARM64-specific build
3. Launch Nova Desk from your applications menu

### Create Your First Vault and Account
1. Open Nova Desk
2. On the **Vault Selection** screen, choose a folder location for your new vault or select an existing vault
3. Click **Continue to Create or Import**
4. Enter and confirm a strong **Wallet password** to encrypt your vault data
5. Click **Continue to Account Options**
6. Choose to create a new account or import an existing one
7. If creating new: securely store your 12 or 24-word recovery phrase
8. Verify your recovery phrase
9. Your vault and first account are ready to use!

## Supported Networks

Nova Desk currently supports:
- **Testnet** - For development and testing
- **Devnet** - For early feature testing

## Security Features

### Encryption Stack
- **Key Derivation**: Argon2id with configurable parameters
- **Symmetric Encryption**: AES-256-GCM for data at rest
- **Secure Randomness**: Uses OS-provided CSPRNG

### Protection Mechanisms
- **Brute Force Protection**: 5 attempts max, 5-minute lockout with exponential backoff
- **Session Timeout**: Configurable timeout (default: 30 minutes)
- **Memory Zeroization**: Sensitive data is cleared from memory when no longer needed
- **Storage Isolation**: Each account has its own encrypted storage tree

## Connecting to dApps

Nova Desk provides multiple ways for dApps to connect:

### Deep Link
```
inferenco://login?redirect=https://dapp.example.com/callback
```

### Browser Bridge
- dApps can communicate via local HTTP server at `http://127.0.0.1:21984`
- Full REST API for signing, account management, and more

### JavaScript API
```javascript
// In dApp
if (window.novaDesk) {
    const publicKey = await window.novaDesk.requestPublicKey();
    const signature = await window.novaDesk.requestSignTransaction(txPayload);
}
```

## Platform-Specific Notes

### Windows
- Uses named pipes for inter-process communication
- Native window management

### Linux
- Requires WebKitGTK 4.1 for browser functionality
- Uses Unix domain sockets for deep link communication
- X11 backend forced for WebKitGTK compatibility
- ARM64 builds available for Raspberry Pi and other ARM devices
