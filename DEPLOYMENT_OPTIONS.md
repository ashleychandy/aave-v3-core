# AAVE V3 XDC Deployment Options

You now have two deployment scripts to choose from:

## Option 1: Full Deployment (Original)

**Script**: `scripts/deploy-xdc-apothem.ts`  
**Command**: `npm run deploy:xdc`

**Best for**:

- First-time deployment
- Clean deployment from scratch
- When you want everything deployed in one go

**Features**:

- Deploys everything A to Z
- Runs post-deployment tests
- Saves addresses to `deployments/xdc-apothem/`
- Takes 10-15 minutes

**Usage**:

```bash
npm run deploy:xdc
```

---

## Option 2: Resumable Deployment (New!)

**Script**: `scripts/deploy-xdc-resumable.ts`  
**Command**: `npm run deploy:xdc:resume`

**Best for**:

- Resuming after failures
- Deploying only specific components
- Iterative development
- Saving gas by skipping already deployed contracts

**Features**:

- ✅ Automatically resumes from where it left off
- ✅ Skip any steps you want
- ✅ Use existing contract addresses
- ✅ Saves progress after each deployment
- ✅ No need to redeploy everything

**Usage**:

```bash
# First time or resume
npm run deploy:xdc:resume

# To skip specific steps, edit scripts/deployment-config.json first
```

**Configuration**: `scripts/deployment-config.json`

### Quick Examples

**Resume after failure**:

```bash
npm run deploy:xdc:resume
```

That's it! It automatically continues.

**Skip test tokens (already deployed)**:
Edit `scripts/deployment-config.json`:

```json
{
  "skipSteps": [1],
  "deployedContracts": {
    "testTokens": {
      "USDT": "0xYourAddress",
      "WXDC": "0xYourAddress"
    }
  }
}
```

**Deploy only reserves**:

```json
{
  "skipSteps": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}
```

---

## Comparison

| Feature                | Full Deployment | Resumable Deployment |
| ---------------------- | --------------- | -------------------- |
| Deploy everything      | ✅              | ✅                   |
| Resume after failure   | ❌              | ✅                   |
| Skip specific steps    | ❌              | ✅                   |
| Use existing contracts | ❌              | ✅                   |
| Post-deployment tests  | ✅              | ⏳ (coming)          |
| Configuration file     | ❌              | ✅                   |
| Save progress          | End only        | After each step      |

---

## Which Should I Use?

### Use Full Deployment if:

- First time deploying
- Want everything in one command
- Don't need to customize

### Use Resumable Deployment if:

- Deployment failed and you want to continue
- Some contracts are already deployed
- Want to deploy only specific components
- Iterating on deployment process
- Want to save gas

---

## Step Numbers Reference

For `skipSteps` in config:

1. Test Tokens (USDT, WXDC)
2. Protocol Libraries (PoolLogic, SupplyLogic, etc.)
3. Pool Addresses Provider
4. ACL Manager
5. Oracle Configuration
6. Pool Implementation
7. Pool Configurator
8. Token Implementations (AToken, DebtTokens)
9. Protocol Data Provider
10. Interest Rate Strategies
11. USDT Reserve Initialization
12. WXDC Reserve Initialization
13. Post-Deployment Tests

---

## Documentation

- **Full Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Resumable Deployment**: See `scripts/RESUMABLE_DEPLOYMENT.md`
- **Quick Start**: See `QUICK_START.md`

---

## Current Deployment Status

Check your current deployment status:

```bash
cat scripts/deployment-config.json
```

Or view saved addresses:

```bash
cat deployments/xdc-apothem/addresses.json
```

---

## Tips

1. **Always save your config**: The resumable script auto-saves, but keep backups
2. **Test locally first**: Use Hardhat network for testing
3. **Monitor gas**: Check deployer balance before starting
4. **Use resumable for production**: More control and safer
5. **Keep deployment logs**: Redirect output to a file for records

```bash
npm run deploy:xdc:resume 2>&1 | tee deployment.log
```
