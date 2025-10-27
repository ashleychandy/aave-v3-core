# AAVE V3 XDC Apothem Deployment Guide

Complete guide for deploying AAVE V3 protocol to XDC Network Apothem testnet.

## Overview

This deployment script handles everything from A to Z:
- ✅ Deploys test tokens (USDT, WXDC)
- ✅ Deploys all core protocol contracts
- ✅ Configures oracle with existing XDC/USDT price feed
- ✅ Initializes reserves with proper parameters
- ✅ Sets up interest rate strategies
- ✅ Configures access control
- ✅ Runs comprehensive post-deployment tests
- ✅ Saves all contract addresses to files

## Prerequisites

### 1. Node.js Version
This project requires Node.js v16.x (specified in `.nvmrc`):

```bash
# If using nvm
nvm use

# Or install Node 16
nvm install 16.13.0
nvm use 16.13.0
```

### 2. XDC Tokens
Ensure your deployer wallet has at least **10 XDC** on Apothem testnet for gas fees.

Get testnet XDC from: https://faucet.apothem.network/

### 3. Environment Configuration
The `.env` file is already configured with the private key from requirements:

```bash
XDC_PRIVATE_KEY=0x3586398ab1ca37968ff09ddb2d7bed31501491d2e0dfd8ebccdb70876328e2ac
XDC_RPC=https://erpc.apothem.network
```

## Deployment Methods

### Method 1: Using NPM Script (Recommended)

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy everything
npm run deploy:xdc
```

### Method 2: Using Bash Script

```bash
# Make script executable (already done)
chmod +x deploy-xdc.sh

# Run deployment
./deploy-xdc.sh
```

### Method 3: Direct Hardhat Command

```bash
# Install and compile
npm install
npm run compile

# Deploy
npx hardhat run scripts/deploy-xdc-apothem.ts --network xdcApothem
```

## What Gets Deployed

### Phase 1: Test Tokens
- **Test_USDT**: ERC20 token with 6 decimals
- **Test_WXDC**: ERC20 token with 6 decimals
- Initial supply: 1,000,000 tokens each minted to deployer

### Phase 2: Protocol Libraries
- SupplyLogic
- BorrowLogic
- LiquidationLogic
- EModeLogic
- BridgeLogic
- FlashLoanLogic
- ConfiguratorLogic

### Phase 3: Core Infrastructure
- PoolAddressesProviderRegistry
- PoolAddressesProvider
- ACLManager
- AaveOracle (using existing price feed at 0x7D276a421fa99B0E86aC3B5c47205987De76B497)

### Phase 4: Pool Contracts
- Pool Implementation (with all libraries linked)
- Pool Proxy
- PoolConfigurator Implementation
- PoolConfigurator Proxy

### Phase 5: Token Implementations
- AToken
- DelegationAwareAToken
- StableDebtToken
- VariableDebtToken

### Phase 6: Supporting Contracts
- AaveProtocolDataProvider
- ReservesSetupHelper

### Phase 7: Interest Rate Strategies
- **USDT Strategy** (Stablecoin parameters):
  - Optimal utilization: 80%
  - Base rate: 0%
  - Slope 1: 4%
  - Slope 2: 75%

- **WXDC Strategy** (Volatile asset parameters):
  - Optimal utilization: 65%
  - Base rate: 0%
  - Slope 1: 8%
  - Slope 2: 100%

### Phase 8: Reserve Initialization

**USDT Reserve:**
- LTV: 75%
- Liquidation Threshold: 80%
- Liquidation Bonus: 5%
- Reserve Factor: 10%
- Borrow Cap: 1,000,000
- Supply Cap: 2,000,000
- Stable Borrowing: ✅ Enabled
- Variable Borrowing: ✅ Enabled

**WXDC Reserve:**
- LTV: 70%
- Liquidation Threshold: 75%
- Liquidation Bonus: 7%
- Reserve Factor: 10%
- Borrow Cap: 500,000
- Supply Cap: 1,000,000
- Stable Borrowing: ❌ Disabled
- Variable Borrowing: ✅ Enabled

### Phase 9: Post-Deployment Tests

The script automatically runs these tests:
1. ✅ Oracle price retrieval for both assets
2. ✅ Supply 1,000 USDT
3. ✅ Supply 1,000 WXDC
4. ✅ Borrow 100 WXDC
5. ✅ Repay 50 WXDC
6. ✅ Withdraw 500 USDT
7. ✅ Verify reserve data and interest rates

## Deployment Output

### Console Output
The script provides detailed logging:
- Transaction hashes for all deployments
- Block confirmations
- Contract addresses
- Test results with ✓ or ✗ indicators

### Saved Files

**1. `deployments/xdc-apothem/addresses.json`**
Complete JSON structure with all contract addresses:
```json
{
  "testTokens": {
    "USDT": "0x...",
    "WXDC": "0x..."
  },
  "core": {
    "PoolAddressesProvider": "0x...",
    "Pool": "0x...",
    ...
  },
  ...
}
```

**2. `deployments/xdc-apothem/deployed.env`**
Environment variable format for easy integration:
```bash
TEST_USDT_ADDRESS=0x...
TEST_WXDC_ADDRESS=0x...
POOL_PROXY=0x...
...
```

## Estimated Deployment Time

- **Total Duration**: 10-15 minutes
- **Gas Cost**: ~8-10 XDC (varies with network congestion)
- **Number of Transactions**: ~40-50

## Post-Deployment

### Verify Deployment
Check the test results in the console output. All tests should show ✓.

### Load Contract Addresses
```bash
# Source the environment file
source deployments/xdc-apothem/deployed.env

# Or use in your scripts
cat deployments/xdc-apothem/addresses.json
```

### Interact with Protocol

```typescript
import { ethers } from 'hardhat';

// Load addresses
const addresses = require('./deployments/xdc-apothem/addresses.json');

// Get contract instances
const pool = await ethers.getContractAt('Pool', addresses.core.PoolProxy);
const usdt = await ethers.getContractAt('Test_USDT', addresses.testTokens.USDT);

// Supply USDT
const amount = ethers.utils.parseUnits('100', 6);
await usdt.approve(pool.address, amount);
await pool.supply(usdt.address, amount, userAddress, 0);

// Borrow WXDC
const borrowAmount = ethers.utils.parseUnits('50', 6);
await pool.borrow(addresses.testTokens.WXDC, borrowAmount, 2, 0, userAddress);
```

## Troubleshooting

### Error: "Insufficient XDC balance"
**Solution**: Get more XDC from https://faucet.apothem.network/

### Error: "EBADENGINE - Unsupported engine"
**Solution**: Switch to Node.js v16
```bash
nvm use 16.13.0
```

### Error: "Transaction failed"
**Solution**: 
- Check RPC connectivity
- Verify private key has funds
- Try increasing gas limit in hardhat.config.ts

### Error: "Contract compilation failed"
**Solution**:
```bash
npm run ci:clean
npm install
npm run compile
```

### Deployment Hangs
**Solution**:
- Check network connectivity
- Try alternative RPC: `XDC_RPC=https://rpc.apothem.network`
- Restart deployment (script is idempotent for most operations)

## Network Information

- **Network Name**: XDC Apothem
- **Chain ID**: 51
- **RPC URL**: https://erpc.apothem.network
- **Block Explorer**: https://explorer.apothem.network/
- **Faucet**: https://faucet.apothem.network/
- **Price Feed**: 0x7D276a421fa99B0E86aC3B5c47205987De76B497 (XDC/USDT)

## Security Notes

⚠️ **Important Security Considerations**:

1. The private key in `.env` is for **testnet only**
2. Never commit `.env` files to version control
3. For production, use hardware wallets or secure key management
4. The deployed contracts use testnet parameters
5. Audit all contracts before mainnet deployment

## Next Steps

After successful deployment:

1. **Test the Protocol**: Use the deployed contracts to test lending/borrowing flows
2. **Build Frontend**: Integrate with AAVE UI or build custom interface
3. **Monitor**: Set up monitoring for contract interactions
4. **Document**: Keep track of all deployed addresses
5. **Verify Contracts**: Submit contracts for verification on XDC explorer

## Support

- **AAVE Documentation**: https://docs.aave.com/developers/
- **XDC Documentation**: https://docs.xdc.org/
- **Hardhat Documentation**: https://hardhat.org/docs

## License

BUSL-1.1 - See LICENSE.md for details
