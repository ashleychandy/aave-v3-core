# Resumable AAVE V3 Deployment

This deployment script allows you to:

- Resume deployment from any point if it fails
- Skip specific steps that are already deployed
- Deploy only what's needed

## Quick Start

### First Time Deployment

```bash
npm run deploy:xdc:resume
```

### Resume After Failure

If the deployment fails or is interrupted, simply run it again:

```bash
npm run deploy:xdc:resume
```

The script automatically:

- Loads previously deployed contract addresses
- Skips contracts that are already deployed
- Continues from where it left off

## Configuration

Edit `scripts/deployment-config.json` to control the deployment:

### Skip Specific Steps

```json
{
  "skipSteps": [1, 2, 5],
  ...
}
```

Step numbers:

- **1**: Test Tokens (USDT, WXDC)
- **2**: Protocol Libraries
- **3**: Pool Addresses Provider
- **4**: ACL Manager
- **5**: Oracle Configuration
- **6**: Pool Implementation
- **7**: Pool Configurator
- **8**: Token Implementations
- **9**: Protocol Data Provider
- **10**: Interest Rate Strategies
- **11**: Reserve Initialization (USDT)
- **12**: Reserve Initialization (WXDC)
- **13**: Post-Deployment Tests

### Use Existing Contracts

Fill in addresses of already deployed contracts:

```json
{
  "deployedContracts": {
    "testTokens": {
      "USDT": "0x522AB92CB4AB21b2a5ceBFD3465BDA0F32DA69dF",
      "WXDC": "0xfC16F654030E41cE19b26011F570eb96d530A85B"
    },
    "libraries": {
      "PoolLogic": "0x80bcc526bd8e37eAC6a1783c399C1AD8A5680533",
      ...
    },
    ...
  }
}
```

The script will:

- Use existing addresses instead of deploying new contracts
- Automatically save new deployments to the config
- Skip minting if tokens already have balance

## Examples

### Example 1: Deploy Everything Fresh

```bash
# Delete config to start fresh
rm scripts/deployment-config.json

# Run deployment
npm run deploy:xdc:resume
```

### Example 2: Resume After Network Error

```bash
# Just run again - it will continue from where it stopped
npm run deploy:xdc:resume
```

### Example 3: Skip Test Tokens (Already Deployed)

Edit `scripts/deployment-config.json`:

```json
{
  "skipSteps": [1],
  "deployedContracts": {
    "testTokens": {
      "USDT": "0xYourUSDTAddress",
      "WXDC": "0xYourWXDCAddress"
    },
    ...
  }
}
```

Then run:

```bash
npm run deploy:xdc:resume
```

### Example 4: Deploy Only Reserves (Skip Everything Else)

```json
{
  "skipSteps": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "deployedContracts": {
    // Fill in all existing addresses
    ...
  }
}
```

## How It Works

1. **Loads Configuration**: Reads `deployment-config.json` if it exists
2. **Checks Each Step**: Before deploying, checks if:
   - Step is in `skipSteps` array
   - Contract address already exists in config
3. **Deploys Missing Contracts**: Only deploys what's needed
4. **Saves Progress**: After each deployment, saves address to config
5. **Continues**: Moves to next step

## Benefits

✅ **Save Time**: Don't redeploy everything after a failure  
✅ **Save Gas**: Only deploy what's needed  
✅ **Flexible**: Skip any step you want  
✅ **Safe**: Automatically tracks what's deployed  
✅ **Resumable**: Pick up exactly where you left off

## Troubleshooting

### Config File Corrupted

```bash
# Delete and start fresh
rm scripts/deployment-config.json
npm run deploy:xdc:resume
```

### Want to Redeploy Everything

```bash
# Delete config
rm scripts/deployment-config.json

# Or edit config and clear all addresses
# Then run
npm run deploy:xdc:resume
```

### Specific Contract Failed

1. Note which step failed
2. Edit config to skip previous steps
3. Clear the failed contract's address
4. Run again

## Configuration File Structure

```json
{
  "network": "xdcApothem",
  "skipSteps": [],
  "deployedContracts": {
    "testTokens": { "USDT": "", "WXDC": "" },
    "libraries": {
      "PoolLogic": "",
      "SupplyLogic": "",
      "BorrowLogic": "",
      "LiquidationLogic": "",
      "EModeLogic": "",
      "BridgeLogic": "",
      "FlashLoanLogic": "",
      "ConfiguratorLogic": ""
    },
    "core": {
      "PoolAddressesProviderRegistry": "",
      "PoolAddressesProvider": "",
      "ACLManager": "",
      "AaveOracle": "0x7D276a421fa99B0E86aC3B5c47205987De76B497",
      "PoolImpl": "",
      "PoolProxy": "",
      "PoolConfiguratorImpl": "",
      "PoolConfiguratorProxy": "",
      "ProtocolDataProvider": "",
      "ReservesSetupHelper": "",
      "AToken": "",
      "DelegationAwareAToken": "",
      "StableDebtToken": "",
      "VariableDebtToken": ""
    },
    "strategies": {
      "USDT": "",
      "WXDC": ""
    },
    "reserves": {
      "USDT": {
        "aToken": "",
        "stableDebtToken": "",
        "variableDebtToken": "",
        "initialized": false
      },
      "WXDC": {
        "aToken": "",
        "stableDebtToken": "",
        "variableDebtToken": "",
        "initialized": false
      }
    }
  }
}
```

## Notes

- Oracle address is pre-filled with existing XDC oracle
- Config is automatically saved after each successful deployment
- If deployment fails, config still saves progress up to that point
- You can manually edit the config file at any time
