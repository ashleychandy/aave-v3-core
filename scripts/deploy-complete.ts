import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ethers } from 'hardhat';
import { join } from 'path';

const XDC_APOTHEM_CONFIG = {
  rpc: 'https://erpc.apothem.network',
  chainId: 51,
  xdcPriceFeed: '0x7D276a421fa99B0E86aC3B5c47205987De76B497', // XDC/USDT feed
  marketId: 'XDC Apothem Market',
  providerId: 51,
};

interface DeploymentAddresses {
  testTokens: { USDT: string; WXDC: string };
  oracle: { adapter: string; aaveOracle: string };
  core: {
    PoolAddressesProvider: string;
    PoolAddressesProviderRegistry: string;
    ACLManager: string;
    PoolImpl: string;
    PoolProxy: string;
    PoolConfiguratorImpl: string;
    PoolConfiguratorProxy: string;
    ProtocolDataProvider: string;
    AToken: string;
    StableDebtToken: string;
    VariableDebtToken: string;
  };
  strategies: { USDT: string; WXDC: string };
  reserves: {
    USDT: { aToken: string; stableDebtToken: string; variableDebtToken: string };
    WXDC: { aToken: string; stableDebtToken: string; variableDebtToken: string };
  };
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

async function waitForTx(tx: any) {
  log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  log(`Transaction confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

function saveDeploymentAddresses(addresses: DeploymentAddresses) {
  const deploymentDir = join(__dirname, '..', 'deployments', 'xdc-apothem-final');
  if (!existsSync(deploymentDir)) {
    mkdirSync(deploymentDir, { recursive: true });
  }

  const jsonPath = join(deploymentDir, 'addresses.json');
  writeFileSync(jsonPath, JSON.stringify(addresses, null, 2));
  log(`Deployment addresses saved to ${jsonPath}`);
}

async function main() {
  logSection('AAVE V3 Complete Deployment on XDC Apothem');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  const balance = await deployer.getBalance();
  log(`Deployer balance: ${ethers.utils.formatEther(balance)} XDC`);

  const deploymentAddresses: DeploymentAddresses = {
    testTokens: { USDT: '', WXDC: '' },
    oracle: { adapter: '', aaveOracle: '' },
    core: {
      PoolAddressesProvider: '',
      PoolAddressesProviderRegistry: '',
      ACLManager: '',
      PoolImpl: '',
      PoolProxy: '',
      PoolConfiguratorImpl: '',
      PoolConfiguratorProxy: '',
      ProtocolDataProvider: '',
      AToken: '',
      StableDebtToken: '',
      VariableDebtToken: '',
    },
    strategies: { USDT: '', WXDC: '' },
    reserves: {
      USDT: { aToken: '', stableDebtToken: '', variableDebtToken: '' },
      WXDC: { aToken: '', stableDebtToken: '', variableDebtToken: '' },
    },
  };

  // Deploy test tokens
  logSection('Step 1: Deploying Test Tokens');
  const TestUSDT = await ethers.getContractFactory('Test_USDT');
  const testUSDT = await TestUSDT.deploy();
  await testUSDT.deployed();
  deploymentAddresses.testTokens.USDT = testUSDT.address;
  log(`Test_USDT deployed at: ${testUSDT.address}`);

  const TestWXDC = await ethers.getContractFactory('Test_WXDC');
  const testWXDC = await TestWXDC.deploy();
  await testWXDC.deployed();
  deploymentAddresses.testTokens.WXDC = testWXDC.address;
  log(`Test_WXDC deployed at: ${testWXDC.address}`);

  const mintAmount = ethers.utils.parseUnits('10000000', 6);
  await waitForTx(await testUSDT.mint(deployer.address, mintAmount));
  await waitForTx(await testWXDC.mint(deployer.address, mintAmount));
  log('Initial supply minted');

  logSection('Complete deployment script created. Run with: npm run deploy:xdc:complete');

  saveDeploymentAddresses(deploymentAddresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
