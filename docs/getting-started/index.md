---
slug: /
sidebar_position: 1
---

# Getting Started with Cedra
Cedra is the first community-owned blockchain built on the Move language that lets anyone spin up and govern their own sovereign networks. Designed as a public good, Cedra fuses protocol development, funding, and growth into open collaboration among core contributors, a non-profit foundation, and a worldwide guild of builders.



:::tip 🎉 Testnet is Live!

**Congratulations!** Cedra testnet is now live and available for testing and development.

**🚀 Testnet API Endpoint:** [https://testnet.cedra.dev/v1](https://testnet.cedra.dev/v1)

### 🔍 Explore the Network

- **🔎 Block Explorer:** [View live blocks on Cedrascan](https://cedrascan.com)
- **👥 Check Validators:** [View current validator set](https://testnet.cedra.dev/v1/accounts/0x1/resource/0x1::stake::ValidatorSet)
- **🪙 Cedra Coin Info:** [Default coin information](https://testnet.cedra.dev/v1/accounts/0x1/resource/0x1::coin::CoinInfo%3C0x1::cedra_coin::CedraCoin%3E)

### 📚 Ready to Build?

If you want to dive deeper, check our [**full node documentation**](/full-node) and learn how to get test tokens from our [**faucet**](/getting-started/faucet).

:::


### 1. 📋 Prerequisites
Before you begin, ensure you have the necessary development tools installed.

[**Install Rust and Node.js →**](/getting-started/libs)

### 2. 🛠️ Install CLI
Once prerequisites are ready, install the Cedra Command Line Interface, which is essential for all development activities.

[**CLI Installation Guide →**](/getting-started/cli)

### 3. 🔧 Set Up IDE Extension
Install Move language support for your preferred IDE to get syntax highlighting, code completion, and error detection.

**For VSCode:**
- Install the [Move Language Extension](https://marketplace.visualstudio.com/items?itemName=MoveBit.aptos-move-analyzer) from the marketplace

**For JetBrains IDEs:**
- Install the [Move Language Plugin](https://plugins.jetbrains.com/plugin/14721-move-on-aptos) for IntelliJ IDEA, CLion, or other JetBrains IDEs

### 4. 🚀 Initialize Your First Project
Create your first Move project to start building smart contracts.

```bash
cedra move init --name first_smart_contract
```

This command creates a new Move project with the basic structure needed for smart contract development.

### 5. 💰 Get Test Tokens
Learn about faucets and how to get test tokens for development and testing.

[**Faucet Guide →**](/getting-started/faucet)

### 6. 📚 Explore Real World Guides
Ready to build something practical? Check out our comprehensive guides for building real applications.

[**Real World Guides →**](/real-world-guides)

## Next Steps

Once you've completed the getting started guides:

1. **Build Your First App**: Follow our [Counter guide](/getting-started/counter) to build first app
2. **Explore Architecture**: Learn about [Cedra's architecture](/architecture) and design principles
3. **Read the Handbook**: Check out our [Handbook for Newcomers](/handbook-for-newcomers) for deeper understanding of Cedra concepts
4. **Join the Community**: Connect with other developers and get support
