# <img src="/img/infer-ecosystem/infer-logo.png" alt="Infer Connect Logo" width="64" style={{display: 'inline', verticalAlign: 'middle', marginRight: '12px', transform: 'translateY(-2px)'}} />Infer Connect

**Infer Connect** is the official wallet adapter that enables dApps to connect with Infer Wallet (mobile) and Infer Desk (desktop). It provides a unified interface for wallet connectivity across both platforms.

![Infer Connect Screenshot](/img/infer-ecosystem/infer-connect/connect-to-infer-desk.png)

For complete integration documentation, visit:

[**Infer Connect Documentation**](https://inferenco.com/docs#infer-connect-introduction)

## Quick Integration

```typescript
// Side-effect import - auto-registers Infer Connect
import "@inferenco/infer-wallet-adapter/auto-register";

// Use with wallet-standard
import { getCedraWallets, connect } from "@cedra-labs/wallet-standard";

// Connect to Infer Wallet/Infer Desk
const wallets = getCedraWallets();
await connect("Infer Connect");
const wallet = wallets.find(w => w.name === "Infer Connect");
const account = await wallet.account();
```

For full details, see the [official documentation](https://inferenco.com/docs#infer-connect-introduction).
