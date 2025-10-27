# DEX Client Integration Guide

Building a user-friendly client is crucial for DEX adoption. This tutorial walks through creating a TypeScript client that interacts with your Cedra DEX, demonstrating best practices for wallet integration, transaction handling, and user experience.

:::tip Complete DEX Source Code
View the full Move implementation: [`cedra-labs/move-contract-examples/dex`](https://github.com/cedra-labs/move-contract-examples/tree/main/dex)
:::

### What You'll Learn
- Setting up Cedra TypeScript SDK
- Implementing core DEX operations
- Building educational examples
- Error handling and user feedback
- Best practices for production clients

### Configuration Structure
Our story begins with project setup. You'll create a clean TypeScript configuration that connects to the Cedra network. The `config.ts` file becomes your command center, defining network endpoints and module addresses. Think of it as setting up your workshop before crafting something beautiful.

```typescript
// config.ts
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

export const NETWORK: Network = Network.TESTNET;
export const NODE_URL = "https://testnet.cedra.network/v1";
export const MODULE_ADDRESS = "0x..."; // Your deployed DEX address

const config: CedraConfig = {
  network: NETWORK,
  nodeUrl: NODE_URL,
};

export const cedra = new Cedra(config);

export const MODULES = {
  math_amm: `${MODULE_ADDRESS}::math_amm`,
  swap: `${MODULE_ADDRESS}::swap`,
  slippage: `${MODULE_ADDRESS}::slippage`,
  multihop: `${MODULE_ADDRESS}::multihop`,
  test_tokens: `${MODULE_ADDRESS}::test_tokens`,
};
```

---

### Display Utilities

Raw blockchain data is intimidating - numbers like 1000000000 don't mean much to users. Your first set of functions transforms these machine values into human-readable formats. The `formatAmount()` function turns those scary numbers into friendly "10.5 ETH". The `displayBalances()` function creates beautiful ASCII tables that make users smile when checking their tokens.

```typescript
// Format token amounts for display
export function formatAmount(amount: number, symbol: string = ""): string {
  const formatted = (amount / Math.pow(10, TOKEN_DECIMALS)).toFixed(4);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

// Display token balances in a table format
export async function displayBalances(
  account: string,
  tokens: Array<{ symbol: string; metadata: string; decimals: number }>
): Promise<void> {
  console.log("\n💰 Token Balances:");
  console.log("┌─────────┬──────────────────┐");
  console.log("│ Token   │ Balance          │");
  console.log("├─────────┼──────────────────┤");
  
  for (const token of tokens) {
    const balance = await getTokenBalance(account, token.metadata);
    const formatted = formatAmount(balance, token.symbol);
    console.log(`│ ${token.symbol.padEnd(7)} │ ${formatted.padStart(16)} │`);
  }
  
  console.log("└─────────┴──────────────────┘");
}
```
---
###  Account Management

Next, you'll implement account creation and funding. The `setupAccounts()` function generates test wallets - Alice and Bob become your first traders. The funding functions ensure they have tokens to play with. This is where users first feel the magic - watching their newly created account receive its first tokens.

```typescript
// Fund account with test tokens
export async function fundAccount(account: Account): Promise<void> {
  console.log(`\n💳 Funding account ${account.accountAddress.toString().slice(0, 6)}...`);
  await cedra.fundAccount({
    accountAddress: account.accountAddress,
    amount: 1_000_000_000, // 10 CEDRA
  });
  console.log("   ✓ Account funded with 10 CEDRA");
}

// Create and prepare test accounts
async function setupAccounts(): Promise<{ alice: Account; bob: Account }> {
  const alice = Account.generate();
  const bob = Account.generate();
  
  console.log("📝 Creating test accounts:");
  console.log(`   • Alice: ${alice.accountAddress.toString()}`);
  console.log(`   • Bob: ${bob.accountAddress.toString()}`);
  
  await fundAccount(alice);
  await fundAccount(bob);
  
  return { alice, bob };
}
```
---

### Token Operations

The token functions are where things get interesting. `getTokenMetadata()` navigates the complex world of token standards, extracting the addresses your DEX needs. The `mintTestTokens()` function gives users their trading ammunition. Each successful mint shows a satisfying confirmation message, making users feel in control.

```typescript
// Get token metadata address
export async function getTokenMetadata(tokenType: string): Promise<string> {
  const functionName = tokenType === "ETH" ? "get_eth_metadata" :
                      tokenType === "BTC" ? "get_btc_metadata" :
                      "get_usdc_metadata";
  
  const result = await cedra.view({
    payload: {
      function: `${MODULES.test_tokens}::${functionName}`,
      typeArguments: [],
      functionArguments: [],
    }
  });
  
  // Handle nested metadata object
  const metadata = result[0];
  if (typeof metadata === 'object' && metadata !== null && 'inner' in metadata) {
    const inner = metadata.inner as string;
    return inner.startsWith('0x') ? inner : `0x${inner}`;
  }
  return metadata.toString();
}

// Mint test tokens
export async function mintTestTokens(
  account: Account,
  tokenType: string,
  amount: number
): Promise<void> {
  console.log(`\n🪙  Minting ${formatAmount(amount)} test ${tokenType}...`);
  
  const transaction = await cedra.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULES.test_tokens}::mint_${tokenType.toLowerCase()}`,
      typeArguments: [],
      functionArguments: [amount],
    },
    options: {
      maxGasAmount: 5000,
      faAddress: parseTypeTag("0x1::CedraCoin::cedra"),
    },
  });

  const pendingTxn = await cedra.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`   ✓ Minted successfully (tx: ${pendingTxn.hash.slice(0, 10)}...)`);
}
```
---

### Pool Management

This is where your DEX comes alive. The `createTradingPair()` function births new markets with a single call. Users watch as their transaction creates a whole new trading opportunity. The `getReserves()` function becomes their window into pool health, showing real-time liquidity depths.

```typescript
// Create a new trading pair
export async function createTradingPair(
  account: Account,
  tokenX: string,
  tokenY: string
): Promise<string> {
  console.log("\n🔄 Creating trading pair...");
  
  const transaction = await cedra.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULES.swap}::create_pair_entry`,
      typeArguments: [],
      functionArguments: [tokenX, tokenY],
    },
    options: {
      maxGasAmount: 5000,
      faAddress: parseTypeTag("0x1::CedraCoin::cedra"),
    },
  });

  const pendingTxn = await cedra.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  const result = await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  
  // Extract LP token address from state changes
  let lpToken = "";
  if ('changes' in result && Array.isArray(result.changes)) {
    for (const change of result.changes) {
      if (change.type === 'write_resource' && 
          change.data?.type?.includes('::swap::TradingPair')) {
        lpToken = change.address;
        break;
      }
    }
  }
  
  console.log(`   ✓ Trading pair created`);
  console.log(`   • LP Token: ${lpToken}`);
  
  return lpToken;
}

// Get pool reserves
export async function getReserves(lpMetadata: string): Promise<[number, number]> {
  try {
    const result = await cedra.view({
      payload: {
        function: `${MODULES.swap}::reserves`,
        typeArguments: [],
        functionArguments: [lpMetadata],
      }
    });
    
    return [Number(result[0]), Number(result[1])];
  } catch (error) {
    return [0, 0];
  }
}
```
---

### Liquidity Operations

The `addLiquidity()` function transforms users from traders to market makers. The code automatically calculates slippage protection - users don't need to understand the math, they just see their liquidity being added safely. The function returns LP tokens as proof of their contribution, like receiving shares in the market they're helping create.

```typescript
export async function addLiquidity(
  account: Account,
  lpToken: string,
  tokenX: string,
  tokenY: string,
  amountX: number,
  amountY: number,
  minAmountX?: number,
  minAmountY?: number
): Promise<void> {
  console.log(`\n💧 Adding liquidity: ${formatAmount(amountX)} + ${formatAmount(amountY)}...`);
  
  // Default 1% slippage if not specified
  const slippageFactor = 0.99;
  const actualMinX = minAmountX ?? Math.floor(amountX * slippageFactor);
  const actualMinY = minAmountY ?? Math.floor(amountY * slippageFactor);
  
  const transaction = await cedra.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULES.swap}::add_liquidity`,
      typeArguments: [],
      functionArguments: [
        lpToken, tokenX, tokenY, 
        amountX, amountY, 
        actualMinX, actualMinY
      ],
    },
    options: {
      maxGasAmount: 5000,
      faAddress: parseTypeTag("0x1::CedraCoin::cedra"),
    },
  });

  const pendingTxn = await cedra.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  
  const lpBalance = await getTokenBalance(account.accountAddress.toString(), lpToken);
  console.log(`   ✓ Liquidity added successfully`);
  console.log(`   • LP tokens received: ${formatAmount(lpBalance)}`);
}
```

---

### Swap Implementation

The crown jewel - `executeSwap()`. This function orchestrates the entire trading experience:

1. **Balance Check**: Verifies sufficient funds (no embarrassing failed transactions)
2. **Output Preview**: Calculates expected returns (users see what they'll get)
3. **Protected Execution**: Applies slippage limits (keeps trades safe)
4. **Transparent Results**: Shows actual outcomes (builds user trust)

The `calculateSwapOutput()` helper lets users preview their trades. They can experiment with different amounts, watching how price impact changes, learning by doing rather than reading formulas.

```typescript
export async function executeSwap(
  account: Account,
  lpToken: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  minAmountOut: number = 0
): Promise<number> {
  console.log(`\n🔄 Swapping ${formatAmount(amountIn)} tokens...`);
  
  // Get initial balance to calculate actual output
  const initialBalance = await getTokenBalance(
    account.accountAddress.toString(), 
    tokenOut
  );
  
  const transaction = await cedra.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULES.swap}::swap_exact_input`,
      typeArguments: [],
      functionArguments: [lpToken, tokenIn, tokenOut, amountIn, minAmountOut],
    },
    options: {
      maxGasAmount: 5000,
      faAddress: parseTypeTag("0x1::CedraCoin::cedra"),
    },
  });

  const pendingTxn = await cedra.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  
  const finalBalance = await getTokenBalance(
    account.accountAddress.toString(), 
    tokenOut
  );
  const actualOutput = finalBalance - initialBalance;
  
  console.log(`   ✓ Swap completed`);
  console.log(`   • Amount out: ${formatAmount(actualOutput)}`);
  
  return actualOutput;
}

// Calculate expected swap output
export async function calculateSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number
): Promise<number> {
  const [amountOut] = await cedra.view({
    payload: {
      function: `${MODULES.math_amm}::get_amount_out`,
      typeArguments: [],
      functionArguments: [amountIn, reserveIn, reserveOut],
    }
  });
  return Number(amountOut);
}
```
Your DEX client is now ready to provide a smooth trading experience!

## 🎉 Congratulations, DEX Builder!
You've completed the entire Cedra DEX Development Course!
From your first Move contract to this polished TypeScript client, you've built a complete decentralized exchange. You understand not just how DEXs work, but how to make them work for real users.
Your DEX can now:

- Create markets for any token pair

- Execute swaps with professional-grade safety features
- Manage liquidity with automatic optimization
- Teach users through interactive examples
- Handle errors gracefully and informatively

You're no longer just learning about DeFi - you're building it. Every line of code in this client represents knowledge earned through the course.
### Continue Your Journey

Now that you've mastered DEX development, explore these related challenges:

* **Token Creation**: Ready to create your own trading pairs? Start with our [First FA Guide](/guides/first-fa) to mint custom tokens for your DEX
* **Advanced Patterns**: Dive into our [Move examples repository](https://github.com/cedra-labs/move-contract-examples) for governance, staking, and other DeFi primitives to enhance your DEX