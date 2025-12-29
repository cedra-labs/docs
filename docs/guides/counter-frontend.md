---
title: Build a React App for Your Counter Contract
description: Connect your counter contract to a React application and interact with it using the TypeScript SDK.

---

# Build a React App for Your Counter Contract

This guide demonstrates how to connect an existing smart contract to a React frontend. We shall build a basic interface for the simple counter contract [here](/getting-started/counter). By the end of this guide, you'll have a React app that lets you view the current counter value and interact with it using increment, decrement, and reset actions.

---

## Prerequisites

Before we begin, make sure you have:

1. A deployed counter contract on Cedra testnet. You'll need the contract address and module name.
2. [A funded Cedra testnet account](/getting-started/faucet).  
3. [Node.js and npm installed](/getting-started/libs).

---

## Step 1: Initialize a React project

Inside your existing `counter-project` directory (or anywhere you prefer really), create a new directory for the frontend:

```bash
mkdir frontend
cd frontend
```
Next, initialise a new React TypeScript project using Vite:

```bash
npm create vite@latest . -- --template react-ts
```
When prompted:

```bash
◇ Use rolldown-vite (Experimental)? → No
◇ Install with npm and start now? → Yes
```

This will create a new React project inside the frontend directory, install the necessary dependencies, and start the server on http://localhost:5173. Head over there to see your scaffolded React app.

## Step 2: Install Cedra TypeScript SDK

The SDK provides the methods we will use to interact with the contract, build transactions, and sign and submit them from your frontend interface.

Still in the frontend directory, install the Cedra SDK:

```bash
npm install @cedra-labs/ts-sdk@2.2.8

# Confirm the installation was successful

npm list @cedra-labs/ts-sdk

```

## Step 3: Create the service module

Now that we have our React project set up, we may then proceed to connect it to the deployed counter contract. First, we'll create a service module that initializes the TypeScript SDK and provides reusable functions for interacting with our contract.

```bash
touch src/counter.ts
```

Next, paste this code in your newly created file:

```ts
import { Cedra, CedraConfig, Network, Account, Ed25519PrivateKey } from "@cedra-labs/ts-sdk";

// Initialize Cedra client for testnet
const config = new CedraConfig({ 
  network: Network.TESTNET 
});
export const cedraClient = new Cedra(config);

// Your deployed contract configuration
export const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
export const MODULE_NAME = "simple_counter";
// Your account's private key (loaded from ~/.cedra/config.yaml)
// TESTNET ONLY. Do NOT put mainnet private keys in frontend code!
const PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE";

// Helper to build the full function ID
export const getFunctionId = (functionName: string) => {
  return `${CONTRACT_ADDRESS}::${MODULE_NAME}::${functionName}`;
};

// Create your account from the private key
export const getAccount = () => {
  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
  return Account.fromPrivateKey({ privateKey });
};
```

Looking at the code block above, we have:

`import { Cedra, CedraConfig, Network, Account, Ed25519PrivateKey } from "@cedra-labs/ts-sdk";`

- `Cedra`: the main client for interacting with the network.
- `CedraConfig`: the network configuration settings
- `Network` to specify the network options (testnet, devnet, mainnet).
- `Account` and `Ed25519PrivateKey` to manage signing transactions with your private key.

```ts
const config = new CedraConfig({ network: Network.TESTNET });
const cedraClient = new Cedra(config);
```
This creates our connection to the Cedra testnet. Every component will use this client ro read data and submit transactions

```ts
export const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
export const MODULE_NAME = "simple_counter";
const PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE";
```
- `CONTRACT_ADDRESS` and `MODULE_NAME` are used to call contract functions (they'll be passed as arguments to our counter contract functions)
- `PRIVATE_KEY` is used by the helper function `getAccount()` to create a signing account for sending transactions



```ts
export const getAccount = () => {
  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
  return Account.fromPrivateKey({ privateKey });
};
```
This creates the signing account which we'll use in our React components whenever we need to sign and submit transactions (increment, decrement, reset).

:::warning
Do not expose mainnet keys in frontend code. Since Cedra does not yet provide a browser wallet adapter, we have to load a testnet key directly. This is just for demo purposes.
:::

## Step 4: Implement the counter interface

Next, let's build the component you'll interact with. Replace the content of `src/App.tsx` with:

```ts
import { useState, useEffect } from "react";
import { cedraClient, CONTRACT_ADDRESS, getFunctionId, getAccount } from "./counter";
import { Account } from "@cedra-labs/ts-sdk";
import "./App.css";

function App() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>("");
  const [account, setAccount] = useState<Account | null>(null);

  // Initialize account on mount
  useEffect(() => {
    const myAccount = getAccount();
    setAccount(myAccount);
    console.log("Using account:", myAccount.accountAddress.toString());
  }, []);

  // Fetch the current counter value
  const fetchCount = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await cedraClient.view({
        payload: {
          function: getFunctionId("get_count"),
          functionArguments: [CONTRACT_ADDRESS],
        },
      });
      
      const counterValue = Number(result[0]);
      setCount(counterValue);
      console.log("Counter value:", counterValue);
    } catch (err: any) {
      setError(err.message || "Failed to fetch count");
      console.error("Error fetching count:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Cedra Counter dApp</h1>
      
      <div className="card">
        <h2>Current Count</h2>
        {count !== null ? (
          <p className="count-display">{count}</p>
        ) : (
          <p className="count-display">--</p>
        )}
        
        <button 
          onClick={fetchCount} 
          disabled={loading}
          className="refresh-btn"
        >
          {loading ? "Loading..." : "Refresh Count"}
        </button>
      </div>

      {txStatus && (
        <div className="status-card">
          <p>{txStatus}</p>
        </div>
      )}

      {error && (
        <div className="error-card">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="info-card">
        <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
        {account && (
          <p><strong>Your Address:</strong> {account.accountAddress.toString()}</p>
        )}
      </div>
    </div>
  );
}

export default App;
```

Our first large code block! Let's actually understand what we did here:

```ts
const [count, setCount] = useState<number | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [txStatus, setTxStatus] = useState<string>("");
const [account, setAccount] = useState<Account | null>(null);
```

- `count` & `setCount` - Stores and updates the counter value from the blockchain
- `loading` & `setLoading` -  Tracks and updates whether we're fetching data or processing a transaction
- `error` & `setError` - Stores and updates any error messages to display to the user
- `txStatus` & `setTxStatus`- Stores and updates transaction progress (building, signing, confirmation)
- `account` & `setAccount` - Stores and updates the user's account object for signing transactions

```ts
useEffect(() => {
  const myAccount = getAccount();
  setAccount(myAccount);
  console.log("Using account:", myAccount.accountAddress.toString());
}, []);
```
Runs once when the component loads. Creates the account we will use from your private key and stores it in state so we can use it to sign transactions later.

```ts
const fetchCount = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await cedraClient.view({
      payload: {
        function: getFunctionId("get_count"),
        functionArguments: [CONTRACT_ADDRESS],
      },
    });
    
    const counterValue = Number(result[0]);
    setCount(counterValue);
    console.log("Counter value:", counterValue);
  } catch (err: any) {
    setError(err.message || "Failed to fetch count");
    console.error("Error fetching count:", err);
  } finally {
    setLoading(false);
  }
};
```
Calls the `get_count` function from your contract to read the current counter value, and updates the count state with the result.

```ts
<div className="card">
  <h2>Current Count</h2>
  {count !== null ? (
    <p className="count-display">{count}</p>
  ) : (
    <p className="count-display">--</p>
  )}
  
  <button 
    onClick={fetchCount} 
    disabled={loading}
    className="refresh-btn"
  >
    {loading ? "Loading..." : "Refresh Count"}
  </button>
</div>
```
Displays the counter value (or "--" if not loaded yet) and a button to get the latest count value.

```ts
{txStatus && (
  <div className="status-card">
    <p>{txStatus}</p>
  </div>
)}

{error && (
  <div className="error-card">
    <p>❌ Error: {error}</p>
  </div>
)}
```
Conditionally displays transaction status messages and error messages if something goes wrong.

```ts
<div className="info-card">
  <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
  {account && (
    <p><strong>Your Address:</strong> {account.accountAddress.toString()}</p>
  )}
</div>
```
Displays the contract address you're interacting with and your account address.

At this stage, you can see the count value in your browser and also refresh it with the "Refresh Count" button. We can then proceed to add the entry functions from our contract (increment, decrement, and reset).

In `src/App.tsx` around line 44 after `fetchCount` (before the `return` statement), add the following code:

```ts
// Call increment function
const handleIncrement = async () => {
  if (!account) return;
  setLoading(true);
  setError(null);
  setTxStatus("Building transaction...");

  try {
    const transaction = await cedraClient.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: getFunctionId("increment"),
        functionArguments: [],
      },
    });

    setTxStatus("Signing transaction...");
    const committedTxn = await cedraClient.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    setTxStatus("Waiting for confirmation...");
    await cedraClient.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    setTxStatus(`Transaction Successful! Hash: ${committedTxn.hash}`);
    await fetchCount();
  } catch (err: any) {
    setError(err.message || "Failed to increment");
    setTxStatus("");
    console.error("Error incrementing:", err);
  } finally {
    setLoading(false);
  }
};

// Call decrement function
const handleDecrement = async () => {
  if (!account) return;
  setLoading(true);
  setError(null);
  setTxStatus("Building transaction...");

  try {
    const transaction = await cedraClient.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: getFunctionId("decrement"),
        functionArguments: [],
      },
    });

    setTxStatus("Signing transaction...");
    const committedTxn = await cedraClient.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    setTxStatus("Waiting for confirmation...");
    await cedraClient.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    setTxStatus(`Transaction Successful! Hash: ${committedTxn.hash}`);
    await fetchCount();
  } catch (err: any) {
    setError(err.message || "Failed to decrement");
    setTxStatus("");
    console.error("Error decrementing:", err);
  } finally {
    setLoading(false);
  }
};

// Call reset function
const handleReset = async () => {
  if (!account) return;
  setLoading(true);
  setError(null);
  setTxStatus("Building transaction...");

  try {
    const transaction = await cedraClient.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: getFunctionId("reset"),
        functionArguments: [],
      },
    });

    setTxStatus("Signing transaction...");
    const committedTxn = await cedraClient.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    setTxStatus("Waiting for confirmation...");
    await cedraClient.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    setTxStatus(`Transaction Successful! Hash: ${committedTxn.hash}`);
    await fetchCount();
  } catch (err: any) {
    setError(err.message || "Failed to reset");
    setTxStatus("");
    console.error("Error resetting:", err);
  } finally {
    setLoading(false);
  }
};
```

Let's break this down:

```ts
setLoading(true);
setError(null);
setTxStatus("Building transaction...");
```

Sets loading state, clears any previous errors, and shows that we're building the transaction.

```ts
const transaction = await cedraClient.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: getFunctionId("increment"),
    functionArguments: [],
  },
});
```
Creates a transaction object that calls the increment function. The sender is your account address and `functionArguments` is empty because increment takes no parameters (besides the implicit &signer).

```ts
setTxStatus("Signing transaction...");
const committedTxn = await cedraClient.signAndSubmitTransaction({
  signer: account,
  transaction,
});
```
Signs the transaction with your private key and submits it to the blockchain. Returns a transaction object with the hash which you can view on the [explorer](https://cedrascan.com/).

```ts
setTxStatus("Waiting for confirmation...");
await cedraClient.waitForTransaction({
  transactionHash: committedTxn.hash,
});
```
Waits for the transaction to be confirmed on the blockchain before proceeding. This ensures the counter was actually updated.

```ts
setTxStatus(`Transaction Successful! Hash: ${committedTxn.hash}`);
await fetchCount();
```
Shows success message with the transaction hash and refreshes the counter value to display the latest value.


```ts
catch (err: any) {
  setError(err.message || "Failed to increment");
  setTxStatus("");
  console.error("Error incrementing:", err);
}
```
Catches any errors (like insufficient gas, network issues) and displays them.

```ts
finally {
  setLoading(false);
}
```
Always runs after try/catch, sets loading back to false so buttons become enabled again.

:::tip
The `handleDecrement` and `handleReset` functions work exactly the same way, just calling different contract functions (decrement and reset).
:::

If you've made it this far, you're doing absolutely great! Now, our entry functions are ready, but there's no way for us to trigger them yet. The final step is to add interactive buttons to the interface.

In `src/App.tsx` around line 186, update the `<div className="card">` section in your return statement to:

```ts
<div className="card">
  <h3>Contract Actions</h3>
  <div className="button-group">
    <button 
      onClick={handleIncrement} 
      disabled={loading || !account}
      className="action-btn increment"
    >
      ➕ Increment
    </button>
    
    <button 
      onClick={handleDecrement} 
      disabled={loading || !account}
      className="action-btn decrement"
    >
      ➖ Decrement
    </button>
    
    <button 
      onClick={handleReset} 
      disabled={loading || !account}
      className="action-btn reset"
    >
      🔄 Reset
    </button>
  </div>
</div>
```

And with that, we're done! Now the frontend interface has Increment, Decrement, and Reset buttons and everything else from our counter contract. Open your browser and refresh the page. You should see an interface with the following:

- Current counter value
- Refresh button
- Increment / Decrement / Reset buttons
- Transaction status updates

Try it out and see if you run into any errors!

If you see:

```
Error: Request ... INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE
```
it means that your account has too little testnet funds and you need to request tokens from the faucet.


## Next Steps

Now that you have a fully functional dApp, here are some suggestions to improve it it:

1. **Improve the UI**: Add loading animations, better error messages, and a transaction history view
2. **Add more features**: Extend the counter contract with custom increment amounts, multiple counters per user, or access controls

You may also explore other contracts and apply these same patterns to build a frontend for the other [guides](/real-world-guides)
