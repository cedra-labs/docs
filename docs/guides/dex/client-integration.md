# DEX Client Integration Guide

## Introduction

Building a user-friendly client is crucial for DEX adoption. This tutorial walks through creating a TypeScript client that interacts with your Cedra DEX, demonstrating best practices for wallet integration, transaction handling, and user experience.

## What You'll Learn

- Setting up Cedra TypeScript SDK
- Implementing core DEX operations
- Building educational examples
- Error handling and user feedback
- Best practices for production clients

## Prerequisites

- Completed DEX smart contract deployment
- Node.js 18+ installed
- Basic TypeScript knowledge
- Understanding of DEX operations

## Project Setup

### Dependencies

```json
{
  "dependencies": {
    "@cedra-labs/ts-sdk": "^2.2.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Configuration Structure

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

## Core Client Implementation

### 1. Display Utilities

Creating clear, informative displays is essential for user understanding:

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

### 2. Account Management

Handle account creation and funding:

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

### 3. Token Operations

Implement token metadata retrieval and minting:

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
  });

  const pendingTxn = await cedra.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
  console.log(`   ✓ Minted successfully (tx: ${pendingTxn.hash.slice(0, 10)}...)`);
}
```

### 4. Pool Management

Create and manage trading pairs:

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

### 5. Liquidity Operations

Add liquidity with automatic slippage protection:

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

### 6. Swap Implementation

Execute swaps with output tracking:

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

## Educational Examples

### Example 1: Price Impact Visualization

```typescript
async function demonstratePriceImpact(lpToken: string) {
  separator("📈 Understanding Price Impact");
  
  console.log("\n💡 Larger trades have exponentially higher price impact");
  
  const [reserveIn, reserveOut] = await getReserves(lpToken);
  
  const tradeSizes = [
    { percent: 0.1, amount: Math.floor(reserveIn * 0.001) },
    { percent: 1, amount: Math.floor(reserveIn * 0.01) },
    { percent: 10, amount: Math.floor(reserveIn * 0.1) },
  ];
  
  console.log("\n📊 Price Impact Analysis:");
  console.log("┌──────────┬─────────────┬─────────────┬─────────────┐");
  console.log("│ % Pool   │ Input       │ Output      │ Impact      │");
  console.log("├──────────┼─────────────┼─────────────┼─────────────┤");
  
  for (const trade of tradeSizes) {
    const output = await calculateSwapOutput(trade.amount, reserveIn, reserveOut);
    const spotPrice = reserveOut / reserveIn;
    const executionPrice = output / trade.amount;
    const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
    
    console.log(
      `│ ${trade.percent.toString().padEnd(8)} │ ` +
      `${formatAmount(trade.amount).padEnd(11)} │ ` +
      `${formatAmount(output).padEnd(11)} │ ` +
      `${priceImpact.toFixed(2).padStart(10)}% │`
    );
  }
  
  console.log("└──────────┴─────────────┴─────────────┴─────────────┘");
}
```

### Example 2: Liquidity Ratio Management

```typescript
async function demonstrateLiquidityRatios(
  bob: Account,
  lpToken: string,
  tokenX: string,
  tokenY: string
) {
  separator("💧 Adding Liquidity to Existing Pool");
  
  console.log("\n💡 Liquidity must match pool ratio");
  
  const [reserveX, reserveY] = await getReserves(lpToken);
  const currentRatio = reserveY / reserveX;
  
  console.log("📊 Current Pool State:");
  console.log(`   • Ratio: 1 X = ${currentRatio.toFixed(4)} Y`);
  
  const desiredX = 50_000_000;  // 0.5 ETH
  const desiredY = 30_000_000;  // 0.3 BTC (more than needed)
  
  const optimalY = Math.floor((desiredX * reserveY) / reserveX);
  const optimalX = Math.floor((desiredY * reserveX) / reserveY);
  
  console.log(`\n📐 Optimal amounts calculation:`);
  console.log(`   • For ${formatAmount(desiredX)} X, optimal Y = ${formatAmount(optimalY)}`);
  console.log(`   • For ${formatAmount(desiredY)} Y, optimal X = ${formatAmount(optimalX)}`);
  
  // Show which token will be returned
  if (desiredY > optimalY) {
    console.log(`   • Excess Y returned: ${formatAmount(desiredY - optimalY)}`);
  } else {
    console.log(`   • Excess X returned: ${formatAmount(desiredX - optimalX)}`);
  }
  
  await addLiquidity(bob, lpToken, tokenX, tokenY, desiredX, desiredY);
}
```

### Example 3: Error Handling

```typescript
async function demonstrateErrorHandling(
  bob: Account,
  lpToken: string,
  tokenIn: string,
  tokenOut: string
) {
  separator("⚠️  Common Errors and Solutions");
  
  // Zero amount swap
  console.log("\n❌ Attempting to swap 0 tokens:");
  try {
    await executeSwap(bob, lpToken, tokenIn, tokenOut, 0);
  } catch (error: any) {
    console.log(`   Error: ${error.message}`);
    console.log("   ✓ Solution: Always validate amounts > 0");
  }
  
  // Insufficient balance
  console.log("\n❌ Attempting to swap more than balance:");
  const balance = await getTokenBalance(bob.accountAddress.toString(), tokenIn);
  try {
    await executeSwap(bob, lpToken, tokenIn, tokenOut, balance * 2);
  } catch (error: any) {
    console.log(`   Error: Insufficient balance`);
    console.log("   ✓ Solution: Check balance before swapping");
  }
  
  // Slippage protection
  console.log("\n✅ Using slippage protection:");
  const swapAmount = Math.floor(balance * 0.1);
  const [reserveIn, reserveOut] = await getReserves(lpToken);
  const expectedOut = await calculateSwapOutput(swapAmount, reserveIn, reserveOut);
  const minAcceptable = Math.floor(expectedOut * 0.99); // 1% slippage
  
  console.log(`   • Expected: ${formatAmount(expectedOut)}`);
  console.log(`   • Minimum: ${formatAmount(minAcceptable)}`);
  console.log("   • Protects against front-running");
}
```

## Production Best Practices

### 1. Transaction Management

```typescript
class TransactionManager {
  private pendingTxs: Map<string, Promise<any>> = new Map();
  
  async executeTransaction(
    id: string,
    builder: () => Promise<any>
  ): Promise<any> {
    // Prevent duplicate transactions
    if (this.pendingTxs.has(id)) {
      console.log("⏳ Transaction already pending...");
      return this.pendingTxs.get(id);
    }
    
    const txPromise = builder()
      .finally(() => this.pendingTxs.delete(id));
    
    this.pendingTxs.set(id, txPromise);
    return txPromise;
  }
}
```

### 2. Price Feed Integration

```typescript
class PriceOracle {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private CACHE_DURATION = 30_000; // 30 seconds
  
  async getPrice(lpToken: string): Promise<number> {
    const cached = this.priceCache.get(lpToken);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }
    
    const [reserveX, reserveY] = await getReserves(lpToken);
    const price = reserveY / reserveX;
    
    this.priceCache.set(lpToken, { price, timestamp: Date.now() });
    return price;
  }
}
```

### 3. User Experience Enhancements

```typescript
class DEXClient {
  async swapWithFeedback(
    account: Account,
    lpToken: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<void> {
    // Pre-flight checks
    console.log("🔍 Checking swap parameters...");
    
    const balance = await getTokenBalance(account.accountAddress.toString(), tokenIn);
    if (balance < amountIn) {
      throw new Error(`Insufficient balance: ${formatAmount(balance)} < ${formatAmount(amountIn)}`);
    }
    
    // Calculate expected output
    const [reserveIn, reserveOut] = await getReserves(lpToken);
    const expectedOut = await calculateSwapOutput(amountIn, reserveIn, reserveOut);
    
    // Show preview
    console.log("\n📋 Swap Preview:");
    console.log(`   • Input: ${formatAmount(amountIn)}`);
    console.log(`   • Expected Output: ${formatAmount(expectedOut)}`);
    console.log(`   • Rate: ${(expectedOut / amountIn).toFixed(6)}`);
    
    // Execute with loading indicator
    console.log("\n⏳ Executing swap...");
    const actualOut = await executeSwap(
      account, 
      lpToken, 
      tokenIn, 
      tokenOut, 
      amountIn,
      Math.floor(expectedOut * 0.99) // 1% slippage
    );
    
    // Show results
    console.log("\n✅ Swap Complete!");
    console.log(`   • Received: ${formatAmount(actualOut)}`);
    console.log(`   • Slippage: ${((1 - actualOut / expectedOut) * 100).toFixed(2)}%`);
  }
}
```

### 4. Error Recovery

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on user errors
      if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

## Testing Your Client

### Integration Test Example

```typescript
describe("DEX Client Integration", () => {
  let alice: Account;
  let bob: Account;
  let lpToken: string;
  
  beforeAll(async () => {
    // Setup
    alice = Account.generate();
    bob = Account.generate();
    await fundAccount(alice);
    await fundAccount(bob);
    
    // Create pool
    const ethMetadata = await getTokenMetadata("ETH");
    const btcMetadata = await getTokenMetadata("BTC");
    lpToken = await createTradingPair(alice, ethMetadata, btcMetadata);
  });
  
  test("should execute complete flow", async () => {
    // Add liquidity
    await addLiquidity(alice, lpToken, ethMetadata, btcMetadata, 
      100_000_000, 50_000_000);
    
    // Execute swap
    const output = await executeSwap(bob, lpToken, ethMetadata, btcMetadata, 
      10_000_000, 4_900_000);
    
    expect(output).toBeGreaterThan(4_900_000);
    expect(output).toBeLessThan(5_000_000);
  });
});
```

## Deployment Checklist

Before deploying your client:

- [ ] Environment variables properly configured
- [ ] Error handling for all operations
- [ ] Loading states for async operations
- [ ] Transaction confirmation UI
- [ ] Slippage settings accessible
- [ ] Price impact warnings
- [ ] Balance validation
- [ ] Network status indicator
- [ ] Transaction history
- [ ] Analytics integration

## Summary

You've learned how to build a comprehensive DEX client:

- **SDK Integration**: Using Cedra TypeScript SDK effectively
- **Core Operations**: Implementing all DEX functions
- **User Experience**: Clear feedback and error handling
- **Educational Examples**: Teaching users through code
- **Production Patterns**: Scalable, maintainable architecture

Your DEX client is now ready to provide a smooth trading experience!

## Next Steps

1. **Add Features**: Implement charts, order history, favorites
2. **Mobile Support**: Build React Native client
3. **Advanced Orders**: Add limit orders, stop-loss
4. **Analytics**: Track user behavior and pool performance

Happy building on Cedra!