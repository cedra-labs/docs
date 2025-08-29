# Running a Validator via Delegation Pool

This guide walks you through setting up a Cedra validator node using a delegation pool structure. Unlike direct staking, delegation pools allow multiple users to combine their stakes under a single validator, democratizing network participation and enabling smaller token holders to contribute to network security.

:::info Prerequisites
Before proceeding, ensure you have:
- Completed the [Validator Setup and Configuration](./validator-setup) guide through Step 7
- Met the [system requirements](./requirements) for running a validator node
- Funded your delegator account with at least 10,001 CEDRA (10,000 for delegation + 1 for transaction fees)
- Initialized a delegator profile using `cedra init --profile delegator`
:::

## Understanding Delegation Pools vs Direct Staking

Before we dive into the setup, it's crucial to understand the key differences between these two validator operation models:

| Aspect | Direct Staking (Stake Pool) | Delegation Pool |
|--------|---------------------------|-----------------|
| **Minimum Stake** | 100,000 CEDRA (all from owner) | 10,000 CEDRA (can be combined from multiple delegators) |
| **Participants** | Single owner/operator | Multiple delegators + operator |
| **Commission Structure** | Fixed commission percentage | Dynamic commission, shared rewards |
| **Management** | Centralized (owner controls all) | Decentralized (delegators can add/withdraw) |
| **Use Case** | Individual validators with sufficient capital | Community validators, staking services |

:::tip Why Choose Delegation Pools?
Delegation pools are ideal for:
- **Community validators** where multiple participants want to contribute
- **Lower barrier to entry** with reduced minimum stake requirements
- **Staking services** that manage validators on behalf of multiple users
- **Decentralized governance** where stake distribution matters
:::

## Generate Your Delegation Pool Address

Every delegation pool needs a unique address that will serve as its identifier on the network. This address is deterministically generated from your account and a random seed number.

First, generate a random number for your pool (we'll use 12345 as an example):

```bash
# Generate the delegation pool address using a random seed
# Replace 12345 with your own random number
cargo run --release -p cedra account derive-resource-account-address \
  --address <your_account_address> \
  --seed "cedra_framework::delegation_pool12345" \
  --seed-encoding utf8
```

**Example with a real address:**
```bash
cargo run --release -p cedra account derive-resource-account-address \
  --address c8817e17ce3fabaacb695bbf6a3b600c6afbabf797960f29eaf8b88016a3f9d8 \
  --seed "cedra_framework::delegation_pool12345" \
  --seed-encoding utf8
```

**What's happening:** This command generates a unique, deterministic address for your delegation pool. The seed ensures that your pool address is unique and can be recreated if needed. Save the returned pool address - you'll need it for all subsequent steps.

## Initialize Your Delegation Pool

With your pool address generated, it's time to create the actual delegation pool on-chain. This establishes the pool's smart contract and sets its initial parameters.

```bash
# Initialize the delegation pool with minimum stake and your seed number
cargo run --release -p cedra move run \
  --profile delegator \
  --function-id 0x1::delegation_pool::initialize_delegation_pool \
  --args u64:1000 string:<your_random_number>
```

**Example:**
```bash
cargo run --release -p cedra move run \
  --profile delegator \
  --function-id 0x1::delegation_pool::initialize_delegation_pool \
  --args u64:1000 string:12345
```

**What's happening:** This transaction creates your delegation pool smart contract on-chain with:
- A minimum delegation amount of 1000 octas (smallest unit)
- Your unique seed number for pool identification
- Initial pool parameters and governance settings
- The contract infrastructure for accepting delegations

The pool is now ready to receive stakes and manage delegator funds, but it's not yet configured for validation.

## Configure Validator Network Addresses

Your delegation pool needs to broadcast its network endpoints so other validators can connect to it. This step registers your validator's communication addresses with the delegation pool.

```bash
# Update network addresses for your delegation pool
cargo run --release -p cedra node update-validator-network-addresses \
  --pool-address <pool_address> \
  --operator-config-file <path_to_operator>/genesis/v1/operator.yaml \
  --profile delegator
```

**Example:**
```bash
cargo run --release -p cedra node update-validator-network-addresses \
  --pool-address 3905c8d82bf28dae1eda06996bf3ddc79fa8753194e864b0e57aa9e00ae89577 \
  --operator-config-file cedra-network/net/delegation-pool/genesis/v1/operator.yaml \
  --profile delegator
```

**What's happening:** This command publishes your validator's network configuration on-chain, including:
- Validator network endpoints for consensus participation
- Full node endpoints for public network access
- Network identity information for peer discovery
- Authentication credentials for secure validator communication

## Register Your Consensus Key

The consensus key is crucial for block production and validation. You'll need to extract this key from your operator configuration and register it with the delegation pool.

First, retrieve your consensus public key:
```bash
# Navigate to your validator configuration
cd net/genesis/v1

# Find and copy the consensus_public_key value
cat operator.yaml | grep consensus_public_key
```

Now register this key with your delegation pool:

```bash
# Update the consensus key for your pool
cargo run --release -p cedra node update-consensus-key \
  --consensus-public-key <consensus_public_key> \
  --pool-address <pool_address> \
  --operator-config-file <path_to_operator>/genesis/v1/operator.yaml \
  --profile delegator
```

**Example:**
```bash
cargo run --release -p cedra node update-consensus-key \
  --consensus-public-key 0x87e8d96f7a5d35f65939bcdeada4815ba87b6630413f16ba90b470fa4fad876e6491add6d32f73242df75d10512f2573 \
  --pool-address 3905c8d82bf28dae1eda06996bf3ddc79fa8753194e864b0e57aa9e00ae89577 \
  --operator-config-file cedra-network/net/delegation-pool/genesis/v1/operator.yaml \
  --profile delegator
```

**What's happening:** This transaction links your validator's consensus key to the delegation pool, enabling:
- Block signing capabilities for your validator
- Participation in the consensus protocol
- Cryptographic proof of your validator's identity
- Prevention of unauthorized validators using your pool

## Add Initial Stake to Your Pool

Before your delegation pool can join the validator set, it needs to meet the minimum staking requirement. As the pool operator, you'll typically provide the initial stake.

```bash
# Add stake to your delegation pool
cargo run --release -p cedra move run \
  --profile delegator \
  --function-id 0x1::delegation_pool::add_stake \
  --args address:<pool_address> u64:<amount_in_octas>
```

**Example with 10,000 CEDRA (minimum for delegation pools):**
```bash
cargo run --release -p cedra move run \
  --profile delegator \
  --function-id 0x1::delegation_pool::add_stake \
  --args address:3905c8d82bf28dae1eda06996bf3ddc79fa8753194e864b0e57aa9e00ae89577 \
        u64:1000000000000
```

**What's happening:** This transaction:
- Transfers 10,000 CEDRA from your account to the delegation pool
- Registers you as the first delegator with your stake amount
- Updates the pool's total stake balance
- Prepares the pool to meet validator requirements

:::info Accepting Additional Delegations
After initialization, other users can delegate to your pool using the same `add_stake` function. Each delegator's stake is tracked separately, and rewards are distributed proportionally.
:::

## Join the Validator Set

With your delegation pool configured and funded, it's time to request admission to the active validator set.

```bash
# Request to join the validator set
cargo run --release -p cedra node join-validator-set \
  --pool-address <pool_address> \
  --profile delegator
```

**Example:**
```bash
cargo run --release -p cedra node join-validator-set \
  --pool-address 3905c8d82bf28dae1eda06996bf3ddc79fa8753194e864b0e57aa9e00ae89577 \
  --profile delegator
```

**What's happening:** This command submits a transaction to add your delegation pool to the pending validator set. Your validator will become active at the beginning of the next epoch (approximately 2 hours on testnet).

## Monitor Epoch Transition

The Cedra network processes validator set changes at epoch boundaries. You must wait for the next epoch (2 hours) before your validator becomes active.

```bash
# Check current epoch and validator set status
curl https://testnet.cedra.dev/v1

# Verify your pool is in the validator set
curl -s "https://testnet.cedra.dev/v1/accounts/0x1/resource/0x1::stake::ValidatorSet" | jq
```

**What's happening:** During the epoch transition:
- The network evaluates all pending validator requests
- Validators meeting requirements are added to the active set
- Your delegation pool begins participating in consensus
- Rewards start accumulating for your delegators

## Configure Validator Identity for Pool Operation

Your validator needs a modified identity file that references the delegation pool instead of your personal account.

```bash
# Navigate to your validator directory
cd net/v1

# Create a pool-specific identity file
cp validator-identity.yaml validator-identity-v2.yaml

# Edit validator-identity-v2.yaml:
# 1. Remove the line containing 'account_private_key'
# 2. Replace account_address with your pool_address
nano validator-identity-v2.yaml
```

**What's happening:** You're creating a specialized identity configuration that:
- Removes sensitive private keys from operational files
- Links your validator to the delegation pool address
- Maintains necessary public keys for network operations
- Ensures secure validator operation without exposing account credentials

## Create Validator Configuration File

Create a comprehensive configuration file for your delegation pool validator. This configuration is slightly different from direct staking validators.

```bash
# Navigate to your validator directory
cd net/v1

# Create the validator configuration
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
      - "/dns/t-seed.cedra.dev/tcp/6163/noise-ik/0x2e103609b65a9369eb7c73aaf94e7f0f8da5c7883a3f0f359ef12fcf70161a30/handshake/0"
      role: "Validator"
admin_service:
  port: 9107
inspection_service:
  port: 9108
api:
  enabled: true
  address: 127.0.0.1:8080
state_sync:
  state_sync_driver:
    enable_auto_bootstrapping: true
    bootstrapping_mode: "ApplyTransactionOutputsFromGenesis"
```

**What's happening:** This configuration includes:
- **State Sync**: Auto-bootstrapping enabled for faster initial sync
- **Different Seed Node**: Uses port 6163 for delegation pool validators
- **Bootstrap Mode**: ApplyTransactionOutputsFromGenesis for optimized sync
- All other standard validator configurations remain the same

## Launch Your Delegation Pool Validator

With all configurations complete, start your validator node:

```bash
# Start the validator node
cedra-node --config validator.yaml
```

**What's happening:** Your delegation pool validator is now:
- Connecting to the Cedra testnet through specialized seed nodes
- Synchronizing with the blockchain using optimized bootstrapping
- Managing stakes from multiple delegators
- Participating in consensus on behalf of all pool participants
- Distributing rewards proportionally to all delegators

:::success Delegation Pool Validator Activated
Your delegation pool validator is now running! It will begin participating in consensus at the next epoch, securing the network on behalf of all your delegators.
:::

## Verify Your Delegation Pool Status

Monitor your delegation pool's operation and delegator information:

```bash
# Check delegation pool status
cargo run --release -p cedra move view \
  --function-id 0x1::delegation_pool::get_pool_info \
  --args address:<pool_address>

# View your delegation balance
cargo run --release -p cedra move view \
  --function-id 0x1::delegation_pool::get_stake \
  --args address:<pool_address> address:<delegator_address>

# Check total pool stake
cargo run --release -p cedra move view \
  --function-id 0x1::delegation_pool::get_total_stake \
  --args address:<pool_address>
```

## Managing Your Delegation Pool

As a pool operator, you have additional responsibilities:

### Accepting New Delegators
Other users can delegate to your pool by calling:
```bash
cargo run --release -p cedra move run \
  --function-id 0x1::delegation_pool::add_stake \
  --args address:<pool_address> u64:<amount>
```

## Next Steps

- **Monitor Performance**: Set up monitoring dashboards for your pool's performance
- **Attract Delegators**: Promote your pool to attract more delegators
- **Maintain Uptime**: Ensure high availability to maximize rewards for delegators
- **Community Engagement**: Build relationships with your delegator community
- **Security Hardening**: Implement additional security measures for production deployment