# Nova Connect

**Nova Connect** is the official wallet adapter that enables dApps to connect with Nova Wallet (mobile) and Nova Desk (desktop). It provides a unified interface for wallet connectivity across both platforms.

For complete integration documentation, visit:

[**Nova Connect Documentation**](https://inferenco.com/docs#nova-connect-introduction)

## Key Features

- **AIP-62 Wallet Standard** compliance
- **Unified API** for both mobile and desktop wallets
- **Multiple Integration Methods**: Auto-register, plugin-style, or direct client
- **End-to-End Encryption** for mobile communication
- **Session Management** across page reloads

## Quick Integration

```typescript
// Side-effect import - auto-registers Nova Connect
import "@inferenco/nova-wallet-adapter/auto-register";

// Use with wallet-standard
import { getCedraWallets, connect } from "@cedra-labs/wallet-standard";

// Connect to Nova Wallet/Nova Desk
const wallets = getCedraWallets();
await connect("Nova Connect");
const wallet = wallets.find(w => w.name === "Nova Connect");
const account = await wallet.account();
```

For full details, see the [official documentation](https://inferenco.com/docs#nova-connect-introduction).
