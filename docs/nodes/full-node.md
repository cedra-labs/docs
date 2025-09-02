# Running a Cedra Full Node

This guide walks you through setting up and running a Cedra full node to help distribute blockchain data and provide API access to the network. Full nodes are essential infrastructure that enable wallets, explorers, and dApps to interact with the Cedra blockchain.

:::info Prerequisites
Before proceeding, ensure you have:
- Installed the [Cedra Node binary](/nodes/cedra-node)
- Met the [system requirements](/nodes/requirements) for running a full node
:::

## Why Run a Full Node?

Full nodes ensure that blockchain data remains widely accessible and the network stays resilient against failures or censorship attempts.

**For the Network:**
Running a full node strengthens the entire Cedra ecosystem. Each additional node increases the network's redundancy and makes it harder for any single entity to control or manipulate blockchain data.

**For Developers:**
A local full node transforms your development experience by providing unrestricted access to blockchain data without the constraints of public endpoints. Instead of dealing with rate limits, network latency, or API quotas, you have direct access to the entire blockchain state on your own hardware.

## Prepare Your Node Environment

Your full node needs a workspace to store configuration files and blockchain data. Let's set up the directory structure.

#### Clone the Cedra Network Repository

```bash
# Clone the official repository
git clone https://github.com/cedra-labs/cedra-network.git
cd cedra-network

# Switch to the testnet branch
git checkout testnet
```

**What's happening:** You're obtaining the Cedra Network repository which contains essential configuration examples and tools for running nodes.

#### Create the Node Directory

```bash
# Create the main network directory in the repository root
mkdir net
cd net
```

**What's happening:** The `net` directory will be your full node's workspace, containing all configuration files, genesis data, and the blockchain database.

### Download Network Genesis Files

```bash
# Download the genesis blob (initial network state)
wget https://github.com/cedra-labs/cedra-networks/raw/main/testnet/genesis.blob

# Download the waypoint (trusted synchronization checkpoint)
wget https://github.com/cedra-labs/cedra-networks/raw/main/testnet/waypoint.txt
```

**What's happening:** These files ensure your full node:
- Starts with the correct network state (genesis.blob)
- Can verify it's connecting to the legitimate Cedra testnet (waypoint.txt)
- Has a trusted checkpoint for fast synchronization

:::caution File Verification
Always download genesis files from the official Cedra Networks repository to avoid connecting to malicious networks.
:::

## Create Your Full Node Configuration

Now we'll create the configuration file `fullnode.yaml` that defines how your full node operates.

```bash
# Create fullnode.yaml with the full node configuration
cat > fullnode.yaml << 'EOF'
base:
    # Directory where the node stores its database
    data_dir: "public-node-data"
    role: "full_node"
    waypoint:
        # References the waypoint file for trusted synchronization
        from_file: "waypoint.txt"

execution:
    # Location of the genesis blob file
    genesis_file_location: "genesis.blob"

full_node_networks:
    # Public network configuration
  - listen_address: "/ip4/0.0.0.0/tcp/6176"
    discovery_method: "onchain"
    network_id: "public"

admin_service:
  port: 9107

inspection_service:
  port: 9108

api:
    enabled: true
    address: 127.0.0.1:8081

storage:
    backup_service_address: "0.0.0.0:6187"
    enable_indexer: false
    # Storage pruning configuration to manage disk usage
    storage_pruner_config:
        ledger_pruner_config:
            enable: true
EOF
```

**What's happening:** This configuration sets up your full node with:
- **Data storage**: Local directory for blockchain data
- **Network settings**: Port 6176 for peer connections
- **API service**: REST API on port 8081 for client requests
- **Admin services**: Monitoring and inspection endpoints
- **Storage pruning**: Automatic cleanup of old data to manage disk space

## Launch Your Full Node

With all configurations in place, it's time to start your full node and begin synchronizing with the network.
Let's start the Node

```bash
# Launch the full node with your configuration
./cedra-node --config fullnode.yaml
```

**What's happening:** Your full node is now:
- Connecting to the Cedra testnet through peer discovery
- Downloading and verifying blockchain data from other nodes
- Building its local database of the blockchain state
- Preparing to serve API requests once synchronized

:::info Initial Synchronization
The first sync can take several hours depending on your internet speed and the current blockchain size. You'll see log messages indicating sync progress.
:::

### Monitor Synchronization Progress

Open a new terminal to check your node's status:

```bash
# Check if your node is running and syncing
curl http://localhost:8081/v1
```

Look for these key indicators:
- `"ledger_version"` - Should be increasing (shows sync progress)
- `"block_height"` - Current block number
- `"node_role"` - Should show "full_node"

## Verify Your Full Node Operation

Once your node has synchronized with the network, verify it's functioning correctly.

#### Check Sync Status

```bash
# Compare your node's state with the public testnet
echo "Your node:"
curl -s http://localhost:8081/v1

echo "Testnet:"
curl -s https://testnet.cedra.dev/v1
```

**What to look for:**
- The ledger versions should be close
- Your node's ledger_version should be constantly increasing
- Once caught up, your node stays synchronized with testnet

#### Test API Endpoints

```bash
# Get validator set information
curl -s "http://localhost:8081/v1/accounts/0x1/resource/0x1::stake::ValidatorSet"

# Query an account balance (example)
curl -s "http://localhost:8081/v1/accounts/0x1/resource/0x1::coin::CoinInfo<0x1::cedra_coin::CedraCoin>"
```

:::success Node Successfully Running
If you see the ledger_version changing in your browser at http://localhost:8081/v1 and API queries returning data, congratulations! Your full node is successfully running and serving blockchain data.
:::

## Monitor and Maintain Your Full Node

Keep your full node healthy and up-to-date with these monitoring and maintenance practices.

### Monitor Node Health

```bash
# Check node metrics
curl http://localhost:9108/metrics

# Check disk space regularly
df -h public-node-data/
```

## Your Full Node Journey Complete!

Congratulations! You've successfully:
- ✅ Set up the Cedra node environment
- ✅ Downloaded and verified genesis files
- ✅ Configured your full node settings
- ✅ Launched and synchronized your node
- ✅ Verified API functionality

## Next Steps

Now that your full node is running:

- **Integrate Applications**: Use your node's API endpoint for dApp development
- **Consider Validating**: If interested, explore [becoming a validator](/nodes/validator-setup)
- **Join the Community**: Share your experience and help other node operators