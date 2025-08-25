# Running Your Validator and Joining the Network

This guide continues from your validator setup journey, walking you through the final steps to activate your validator on the Cedra testnet. By completing these steps, you'll create a stake pool, configure your validator's network identity, and join the active validator set to begin earning rewards.

:::info Prerequisites
Before proceeding, ensure you have:
- Completed the [Validator Setup and Configuration](./validator-setup) guide
- Met the [system requirements](./requirements) for running a validator node
- Funded your validator account with at least 100,001 CEDRA (100,000 for staking + 1 for transaction fees)
:::

## Create Your Staking Contract

Your validator needs a staking contract to manage delegated stakes and define commission rates. This contract establishes the economic relationship between your validator and potential delegators.

```bash
# Create a staking contract with your validator configuration
cargo run --release -p cedra stake create-staking-contract \
  --operator <account_address> \
  --voter <account_address> \
  --amount <amount_in_octas> \
  --commission-percentage <percentage> \
  --profile owner
```

**Example with minimum stake (100,000 CEDRA):**
```bash
cargo run --release -p cedra stake create-staking-contract \
  --operator c8817e17ce3fabaacb695bbf6a3b600c6afbabf797960f29eaf8b88016a3f9d8 \
  --voter c8817e17ce3fabaacb695bbf6a3b600c6afbabf797960f29eaf8b88016a3f9d8 \
  --amount 10000000000000 \
  --commission-percentage 10 \
  --profile owner
```

**What's happening:** This command creates a staking contract that:
- Designates your account as both the operator (who runs the validator) and voter (who participates in governance)
- Stakes 100,000 CEDRA (the minimum required amount for testnet validators)
- Sets a 10% commission on rewards earned by delegators
- Establishes your validator's economic presence on the network

## Verify Your Stake Pool Creation

After creating the staking contract, a stake pool is automatically generated. You need to retrieve and save this pool address as it will be your validator's primary identifier on the network.

```bash
# Retrieve your stake pool address using your owner address
cargo run --release -p cedra node get-stake-pool --owner-address <stake_pool>
```

**Example:**
```bash
cargo run --release -p cedra node get-stake-pool \
  --owner-address 0x0d74d101cc2b0b435ceef55ee7bf3af2c7658055e2ccd02d33c11f6b89d864ff
```

**What's happening:** This command queries the blockchain for your stake pool details. The returned `pool_address` is crucial - it represents your validator's staking identity and will be used in all subsequent configuration steps. Save this address securely as you'll need it throughout the setup process.

## Update Validator Network Addresses

Your validator needs to broadcast its network endpoints to other validators. This step registers your validator's communication addresses with the stake pool.

```bash
# Update network addresses for your stake pool
cargo run --release -p cedra node update-validator-network-addresses \
  --pool-address <pool_address> \
  --operator-config-file <path-to-operator>/genesis/v1/operator.yaml \
  --profile owner
```

**Example:**
```bash
cargo run --release -p cedra node update-validator-network-addresses \
  --pool-address 0x0d74d101cc2b0b435ceef55ee7bf3af2c7658055e2ccd02d33c11f6b89d864ff \
  --operator-config-file cedra-network/net/v1/operator.yaml \
  --profile owner
```

**What's happening:** This command publishes your validator's network configuration on-chain, allowing other validators to discover and connect to your node. It uses the operator configuration file generated during initial setup to ensure consistent network identity.

## Update Consensus Key for the Pool

Your validator's consensus key enables participation in the block production process. You'll need to extract this key from your operator configuration and register it with your stake pool.

First, locate your consensus public key:
```bash
# Navigate to your validator configuration directory
cd net/v1

# Open operator.yaml and find the consensus_public_key value
cat operator.yaml | grep consensus_public_key
```

Now update your stake pool with this consensus key:

```bash
# Register the consensus key with your stake pool
cargo run --release -p cedra node update-consensus-key \
  --consensus-public-key <consensus_public_key> \
  --pool-address <pool_address> \
  --operator-config-file <path-to-operator>/genesis/v1/operator.yaml \
  --profile owner
```

**Example:**
```bash
cargo run --release -p cedra node update-consensus-key \
  --consensus-public-key 0x85a21ab7c8850b1fc49da0520d490e9cbb71e4a0ebd0d68aa6aeea8d3932810eda91dabbdcf44537b207ee0e66fef03e \
  --pool-address 0x0d74d101cc2b0b435ceef55ee7bf3af2c7658055e2ccd02d33c11f6b89d864ff \
  --operator-config-file cedra-network/net/v1/operator.yaml \
  --profile owner
```

**What's happening:** This command links your validator's consensus key to your stake pool, enabling your validator to sign blocks and participate in consensus. This cryptographic binding ensures only your validator can act on behalf of your stake pool.

## Join the Validator Set

With all configurations in place, it's time to officially request admission to the validator set. This is the moment your validator becomes eligible to participate in consensus.

```bash
# Submit your request to join the active validator set
cargo run --release -p cedra node join-validator-set \
  --pool-address <pool_address> \
  --profile owner
```

**Example:**
```bash
cargo run --release -p cedra node join-validator-set \
  --pool-address 0x0d74d101cc2b0b435ceef55ee7bf3af2c7658055e2ccd02d33c11f6b89d864ff \
  --profile owner
```

**What's happening:** This command submits a transaction to add your stake pool to the pending validator set. Your validator will become active at the beginning of the next epoch, when the network rotates its validator set.

## Wait for Epoch Transition

The Cedra network operates in epochs, with validator set changes occurring at epoch boundaries. Your validator won't become active immediately - you must wait for the next epoch to begin.

**Check the current epoch:**
```bash
# Query the network for current epoch information
curl https://testnet.cedra.dev/v1
```

Look for the `"epoch"` field in the JSON response. Epochs on testnet rotate approximately every 2 hours.

**What's happening:** The network processes validator set changes in batches at epoch boundaries to maintain stability. This prevents constant network disruptions from validators joining or leaving. Monitor the epoch number and wait for it to increment before proceeding.

## Prepare Validator Identity Configuration

Your validator needs a modified identity file that references the stake pool instead of your personal account. This separation enhances security by removing sensitive keys from the operational configuration.

```bash
# Navigate to your validator directory
cd net/v1

# Create a copy of your validator identity for pool operations
cp validator-identity.yaml validator-identity-v2.yaml

# Edit the new file to:
# 1. Remove the line containing 'account_private_key' (for security)
# 2. Replace the account_address value with your pool_address
nano validator-identity-v2.yaml
```

**What's happening:** You're creating a specialized identity file for your validator that:
- Removes the private key to prevent accidental exposure
- Links your validator directly to the stake pool address
- Maintains all necessary public keys for network operations

This configuration allows your validator to operate without exposing sensitive account credentials.

## Create Validator Configuration

Your validator needs a comprehensive configuration file that defines how it operates, connects to the network, and manages consensus participation.

```bash
# Navigate to your validator directory
cd net/v1

# Create the main validator configuration file
nano validator.yaml
```

Add the following configuration:

```yaml
base:
  data_dir: "data_validator"
  role: "validator"
  waypoint:
    from_file: "../genesis/waypoint.txt"
consensus:
  safety_rules:
    service:
      type: "local"
    backend:
      type: "on_disk_storage"
      path: "./secure-data.json"
      namespace: ~
    initial_safety_rules_config:
      from_file:
        waypoint:
          from_file: "../genesis/waypoint.txt"
        identity_blob_path: "validator-identity-v2.yaml"
execution:
  genesis_file_location: "../genesis/genesis.blob"
validator_network:
  discovery_method: "onchain"
  listen_address: "/ip4/0.0.0.0/tcp/6182"
  identity:
    type: "from_file"
    path: "validator-identity-v2.yaml"
  network_id: "validator"
  mutual_authentication: true
  max_frame_size: 4194304 # 4 MiB
  seeds:
    31f1ff7f7bb3761f26db76abbc80a8be42a16d2c031801b8c9704f4e7a747a24:
      addresses:
      - "/dns/t-seed.cedra.dev/tcp/6174/noise-ik/0x1a9410775bec1fa1b8ad771a6e70ca66a4451f22045420dd88c4b134c23bec27/handshake/0"
      role: "Validator"
admin_service:
  port: 9107
inspection_service:
  port: 9108
api:
  enabled: true
  address: 127.0.0.1:8080
```

**What's happening:** This configuration file orchestrates your entire validator operation:
- **Base**: Defines data storage location and network waypoint for synchronization
- **Consensus**: Configures the safety rules that prevent double-signing and slashing
- **Execution**: Points to the genesis file for initial state
- **Validator Network**: Sets up peer discovery, authentication, and seed nodes
- **Services**: Enables admin, inspection, and API endpoints for monitoring

## Launch Your Validator Node

With all configurations complete, it's time to start your validator and begin participating in network consensus.

```bash
# Start your validator node
cedra-node --config validator.yaml
```

**What's happening:** Your validator node is now:
- Connecting to the Cedra testnet through seed nodes
- Synchronizing with the current blockchain state
- Preparing to participate in consensus once your stake pool is active
- Listening for incoming connections from other validators
- Ready to propose and validate blocks

:::success Validator Activated
Your validator is now running and will begin participating in consensus at the next epoch! Monitor your logs to ensure successful synchronization and network connectivity.
:::

## Verify Your Validator Status

Once your validator is running, verify its operational status and stake pool configuration:

```bash
# Check your validator's stake pool status
cargo run --release -p cedra node get-stake-pool \
  --owner-address 0x0d74d101cc2b0b435ceef55ee7bf3af2c7658055e2ccd02d33c11f6b89d864ff
```

This command displays:
- Your pool's current stake amount
- Active/inactive status
- Current delegations
- Earned rewards

## Verify Node Operation

To confirm your validator node is running correctly and synchronized with the network:

```bash
# Check your local node's API endpoint
curl http://localhost:8080/v1
```

Or open `http://localhost:8080/v1` in your browser.

**What to look for:**
- The `"epoch"` field should show a value greater than 1 within 2 hours after starting your node
- The `"ledger_version"` should be increasing, indicating your node is processing blocks
- The `"chain_id"` should match the testnet chain identifier

If the epoch remains at 0 or 1 after 2 hours, your node may still be synchronizing. Check your validator logs for any connection or synchronization issues.

## Your Validator is Live!

Congratulations! You've successfully:
- ✅ Created a staking contract with your initial stake
- ✅ Configured your stake pool for delegation
- ✅ Registered your validator's network addresses
- ✅ Updated consensus keys for block production
- ✅ Joined the pending validator set
- ✅ Prepared secure operational configurations
- ✅ Launched your validator node

Your validator is now an active participant in securing the Cedra testnet, validating transactions, producing blocks, and earning staking rewards for you and your delegators.

## Next Steps

Monitor your validator's performance and maintain high uptime to maximize rewards. Consider:
- Setting up monitoring and alerting systems
- Implementing automatic restart mechanisms
- Backing up your validator keys securely
- Engaging with the validator community for best practices

Welcome to the Cedra validator ecosystem! 🎉