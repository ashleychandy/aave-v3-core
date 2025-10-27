# Quick Start: Deploy AAVE V3 to XDC Apothem

## TL;DR

```bash
# 1. Use Node 16
nvm use 16.13.0

# 2. Install dependencies
npm install

# 3. Deploy everything (one command!)
npm run deploy:xdc
```

That's it! The script handles everything automatically.

## What You Get

After 10-15 minutes, you'll have:
- ✅ Fully deployed AAVE V3 protocol on XDC Apothem
- ✅ Test tokens (USDT, WXDC) with initial supply
- ✅ Configured reserves ready for lending/borrowing
- ✅ Working oracle using existing XDC/USDT price feed
- ✅ All contract addresses saved to `deployments/xdc-apothem/`
- ✅ Automated tests confirming everything works

## Prerequisites

1. **Node.js v16** (check with `node --version`)
2. **10 XDC** in your wallet for gas (get from https://faucet.apothem.network/)
3. **Private key** already configured in `.env`

## Contract Addresses

After deployment, find all addresses in:
- `deployments/xdc-apothem/addresses.json` (JSON format)
- `deployments/xdc-apothem/deployed.env` (ENV format)

## Key Contracts

The most important addresses you'll need:
- **Pool**: Main contract for supply/borrow/repay/withdraw
- **PoolConfigurator**: Admin functions
- **AaveOracle**: Price feeds
- **Test_USDT**: Test USDT token
- **Test_WXDC**: Test wrapped XDC token

## Quick Test

```typescript
// After deployment, test it:
const pool = await ethers.getContractAt('Pool', POOL_ADDRESS);
const usdt = await ethers.getContractAt('Test_USDT', USDT_ADDRESS);

// Supply
await usdt.approve(pool.address, amount);
await pool.supply(usdt.address, amount, yourAddress, 0);

// Borrow
await pool.borrow(wxdcAddress, borrowAmount, 2, 0, yourAddress);
```

## Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed documentation.

## Network Info

- **RPC**: https://erpc.apothem.network
- **Chain ID**: 51
- **Explorer**: https://explorer.apothem.network/
- **Faucet**: https://faucet.apothem.network/
