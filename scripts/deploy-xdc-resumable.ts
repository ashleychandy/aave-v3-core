import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ethers } from 'hardhat';
import { join } from 'path';

// Load deployment configuration
const configPath = join(__dirname, 'deployment-config.json');
let config: any = {};

if (existsSync(configPath)) {
  config = JSON.parse(readFileSync(configPath, 'utf-8'));
  console.log('Loaded existing deployment configuration');
} else {
  console.log('No existing configuration found, starting fresh deployment');
}

// Deployment configuration
const XDC_APOTHEM_CONFIG = {
  rpc: 'https://erpc.apothem.network',
  chainId: 51,
  priceFeeds: {
    XDC_USDT: '0x7D276a421fa99B0E86aC3B5c47205987De76B497',
  },
  marketId: 'XDC Apothem Market',
  providerId: 51,
};

// Utility functions
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

function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  log(`Configuration saved to ${configPath}`);
}

function shouldSkipStep(stepNumber: number): boolean {
  return config.skipSteps && config.skipSteps.includes(stepNumber);
}

function isContractDeployed(address: string): boolean {
  return address && address !== '' && address !== ethers.constants.AddressZero;
}

async function main() {
  logSection('AAVE V3 Resumable Deployment on XDC Apothem');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  const balance = await deployer.getBalance();
  log(`Deployer balance: ${ethers.utils.formatEther(balance)} XDC`);

  if (balance.lt(ethers.utils.parseEther('5'))) {
    throw new Error('Insufficient XDC balance. Need at least 5 XDC for deployment.');
  }

  // Initialize config if empty
  if (!config.deployedContracts) {
    config = {
      network: 'xdcApothem',
      skipSteps: [],
      deployedContracts: {
        testTokens: { USDT: '', WXDC: '' },
        libraries: {
          PoolLogic: '',
          SupplyLogic: '',
          BorrowLogic: '',
          LiquidationLogic: '',
          EModeLogic: '',
          BridgeLogic: '',
          FlashLoanLogic: '',
          ConfiguratorLogic: '',
        },
        core: {
          PoolAddressesProviderRegistry: '',
          PoolAddressesProvider: '',
          ACLManager: '',
          AaveOracle: XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT,
          PoolImpl: '',
          PoolProxy: '',
          PoolConfiguratorImpl: '',
          PoolConfiguratorProxy: '',
          ProtocolDataProvider: '',
          ReservesSetupHelper: '',
          AToken: '',
          DelegationAwareAToken: '',
          StableDebtToken: '',
          VariableDebtToken: '',
        },
        strategies: { USDT: '', WXDC: '' },
        reserves: {
          USDT: { aToken: '', stableDebtToken: '', variableDebtToken: '', initialized: false },
          WXDC: { aToken: '', stableDebtToken: '', variableDebtToken: '', initialized: false },
        },
      },
    };
  }

  let testUSDT: any, testWXDC: any;
  let poolLogic: any,
    supplyLogic: any,
    borrowLogic: any,
    liquidationLogic: any,
    eModeLogic: any,
    bridgeLogic: any,
    flashLoanLogic: any,
    configuratorLogic: any;
  let registry: any, addressesProvider: any, aclManager: any;
  let poolImpl: any, poolProxy: any, poolConfigurator: any;
  let dataProvider: any, reservesSetupHelper: any;
  let aTokenImpl: any,
    delegationAwareATokenImpl: any,
    stableDebtTokenImpl: any,
    variableDebtTokenImpl: any;
  let usdtStrategy: any, wxdcStrategy: any;

  // Step 1: Deploy Test Tokens
  if (!shouldSkipStep(1)) {
    logSection('Step 1: Deploying Test Tokens');

    if (!isContractDeployed(config.deployedContracts.testTokens.USDT)) {
      log('Deploying Test_USDT...');
      const TestUSDT = await ethers.getContractFactory('Test_USDT');
      testUSDT = await TestUSDT.deploy();
      await testUSDT.deployed();
      config.deployedContracts.testTokens.USDT = testUSDT.address;
      log(`Test_USDT deployed at: ${testUSDT.address}`);
      saveConfig();
    } else {
      log(`Test_USDT already deployed at: ${config.deployedContracts.testTokens.USDT}`);
      testUSDT = await ethers.getContractAt('Test_USDT', config.deployedContracts.testTokens.USDT);
    }

    if (!isContractDeployed(config.deployedContracts.testTokens.WXDC)) {
      log('Deploying Test_WXDC...');
      const TestWXDC = await ethers.getContractFactory('Test_WXDC');
      testWXDC = await TestWXDC.deploy();
      await testWXDC.deployed();
      config.deployedContracts.testTokens.WXDC = testWXDC.address;
      log(`Test_WXDC deployed at: ${testWXDC.address}`);
      saveConfig();
    } else {
      log(`Test_WXDC already deployed at: ${config.deployedContracts.testTokens.WXDC}`);
      testWXDC = await ethers.getContractAt('Test_WXDC', config.deployedContracts.testTokens.WXDC);
    }

    log('Minting initial token supply if needed...');
    const deployerBalance = await testUSDT.balanceOf(deployer.address);
    if (deployerBalance.eq(0)) {
      const mintAmount = ethers.utils.parseUnits('1000000', 6);
      await waitForTx(await testUSDT.mint(deployer.address, mintAmount));
      await waitForTx(await testWXDC.mint(deployer.address, mintAmount));
      log('Initial supply minted successfully');
    } else {
      log('Tokens already minted, skipping');
    }
  } else {
    log('Step 1 skipped - loading existing test tokens');
    testUSDT = await ethers.getContractAt('Test_USDT', config.deployedContracts.testTokens.USDT);
    testWXDC = await ethers.getContractAt('Test_WXDC', config.deployedContracts.testTokens.WXDC);
  }

  // Step 2: Deploy Libraries
  if (!shouldSkipStep(2)) {
    logSection('Step 2: Deploying Protocol Libraries');

    const libraries = [
      'PoolLogic',
      'SupplyLogic',
      'BorrowLogic',
      'LiquidationLogic',
      'EModeLogic',
      'BridgeLogic',
    ];

    for (const libName of libraries) {
      if (!isContractDeployed(config.deployedContracts.libraries[libName])) {
        log(`Deploying ${libName}...`);
        const Library = await ethers.getContractFactory(libName);
        const library = await Library.deploy();
        await library.deployed();
        config.deployedContracts.libraries[libName] = library.address;
        log(`${libName} deployed at: ${library.address}`);
        saveConfig();
      } else {
        log(`${libName} already deployed at: ${config.deployedContracts.libraries[libName]}`);
      }
    }

    // FlashLoanLogic needs BorrowLogic
    if (!isContractDeployed(config.deployedContracts.libraries.FlashLoanLogic)) {
      log('Deploying FlashLoanLogic...');
      const FlashLoanLogic = await ethers.getContractFactory('FlashLoanLogic', {
        libraries: {
          BorrowLogic: config.deployedContracts.libraries.BorrowLogic,
        },
      });
      flashLoanLogic = await FlashLoanLogic.deploy();
      await flashLoanLogic.deployed();
      config.deployedContracts.libraries.FlashLoanLogic = flashLoanLogic.address;
      log(`FlashLoanLogic deployed at: ${flashLoanLogic.address}`);
      saveConfig();
    } else {
      log(
        `FlashLoanLogic already deployed at: ${config.deployedContracts.libraries.FlashLoanLogic}`
      );
    }

    if (!isContractDeployed(config.deployedContracts.libraries.ConfiguratorLogic)) {
      log('Deploying ConfiguratorLogic...');
      const ConfiguratorLogic = await ethers.getContractFactory('ConfiguratorLogic');
      configuratorLogic = await ConfiguratorLogic.deploy();
      await configuratorLogic.deployed();
      config.deployedContracts.libraries.ConfiguratorLogic = configuratorLogic.address;
      log(`ConfiguratorLogic deployed at: ${configuratorLogic.address}`);
      saveConfig();
    } else {
      log(
        `ConfiguratorLogic already deployed at: ${config.deployedContracts.libraries.ConfiguratorLogic}`
      );
    }
  } else {
    log('Step 2 skipped - using existing libraries');
  }

  // Step 3: Deploy Pool Addresses Provider
  if (!shouldSkipStep(3)) {
    logSection('Step 3: Deploying Pool Addresses Provider');

    if (!isContractDeployed(config.deployedContracts.core.PoolAddressesProviderRegistry)) {
      log('Deploying PoolAddressesProviderRegistry...');
      const PoolAddressesProviderRegistry = await ethers.getContractFactory(
        'PoolAddressesProviderRegistry'
      );
      registry = await PoolAddressesProviderRegistry.deploy(deployer.address);
      await registry.deployed();
      config.deployedContracts.core.PoolAddressesProviderRegistry = registry.address;
      log(`PoolAddressesProviderRegistry deployed at: ${registry.address}`);
      saveConfig();
    } else {
      log(
        `PoolAddressesProviderRegistry already deployed at: ${config.deployedContracts.core.PoolAddressesProviderRegistry}`
      );
      registry = await ethers.getContractAt(
        'PoolAddressesProviderRegistry',
        config.deployedContracts.core.PoolAddressesProviderRegistry
      );
    }

    if (!isContractDeployed(config.deployedContracts.core.PoolAddressesProvider)) {
      log('Deploying PoolAddressesProvider...');
      const PoolAddressesProvider = await ethers.getContractFactory('PoolAddressesProvider');
      addressesProvider = await PoolAddressesProvider.deploy(
        XDC_APOTHEM_CONFIG.marketId,
        deployer.address
      );
      await addressesProvider.deployed();
      config.deployedContracts.core.PoolAddressesProvider = addressesProvider.address;
      log(`PoolAddressesProvider deployed at: ${addressesProvider.address}`);
      saveConfig();

      log('Registering PoolAddressesProvider in registry...');
      await waitForTx(
        await registry.registerAddressesProvider(
          addressesProvider.address,
          XDC_APOTHEM_CONFIG.providerId
        )
      );

      log('Setting ACL admin in AddressesProvider...');
      await waitForTx(await addressesProvider.setACLAdmin(deployer.address));
      log(`ACL admin set to: ${deployer.address}`);
    } else {
      log(
        `PoolAddressesProvider already deployed at: ${config.deployedContracts.core.PoolAddressesProvider}`
      );
      addressesProvider = await ethers.getContractAt(
        'PoolAddressesProvider',
        config.deployedContracts.core.PoolAddressesProvider
      );
    }
  } else {
    log('Step 3 skipped - using existing PoolAddressesProvider');
    addressesProvider = await ethers.getContractAt(
      'PoolAddressesProvider',
      config.deployedContracts.core.PoolAddressesProvider
    );
  }

  // Step 4: Deploy ACLManager
  if (!shouldSkipStep(4)) {
    logSection('Step 4: Deploying ACL Manager');

    if (!isContractDeployed(config.deployedContracts.core.ACLManager)) {
      log('Deploying ACLManager...');
      const ACLManager = await ethers.getContractFactory('ACLManager');
      aclManager = await ACLManager.deploy(addressesProvider.address);
      await aclManager.deployed();
      config.deployedContracts.core.ACLManager = aclManager.address;
      log(`ACLManager deployed at: ${aclManager.address}`);
      saveConfig();

      log('Setting ACLManager in AddressesProvider...');
      await waitForTx(await addressesProvider.setACLManager(aclManager.address));
    } else {
      log(`ACLManager already deployed at: ${config.deployedContracts.core.ACLManager}`);
    }
  } else {
    log('Step 4 skipped - using existing ACLManager');
  }

  // Step 5: Configure Oracle
  if (!shouldSkipStep(5)) {
    logSection('Step 5: Configuring Oracle');

    log('Using existing XDC/USDT oracle at: ' + XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT);
    const currentOracle = await addressesProvider.getPriceOracle();
    if (currentOracle !== XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT) {
      log('Setting PriceOracle in AddressesProvider...');
      await waitForTx(
        await addressesProvider.setPriceOracle(XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT)
      );
      log('Oracle configured successfully');
    } else {
      log('Oracle already configured');
    }
  } else {
    log('Step 5 skipped - oracle already configured');
  }

  // Step 6: Deploy Pool Implementation
  if (!shouldSkipStep(6)) {
    logSection('Step 6: Deploying Pool Implementation');

    if (!isContractDeployed(config.deployedContracts.core.PoolImpl)) {
      log('Deploying Pool implementation...');
      const Pool = await ethers.getContractFactory('Pool', {
        libraries: {
          PoolLogic: config.deployedContracts.libraries.PoolLogic,
          SupplyLogic: config.deployedContracts.libraries.SupplyLogic,
          BorrowLogic: config.deployedContracts.libraries.BorrowLogic,
          LiquidationLogic: config.deployedContracts.libraries.LiquidationLogic,
          EModeLogic: config.deployedContracts.libraries.EModeLogic,
          BridgeLogic: config.deployedContracts.libraries.BridgeLogic,
          FlashLoanLogic: config.deployedContracts.libraries.FlashLoanLogic,
        },
      });
      poolImpl = await Pool.deploy(addressesProvider.address);
      await poolImpl.deployed();
      config.deployedContracts.core.PoolImpl = poolImpl.address;
      log(`Pool implementation deployed at: ${poolImpl.address}`);
      saveConfig();

      log('Setting Pool implementation in AddressesProvider...');
      await waitForTx(await addressesProvider.setPoolImpl(poolImpl.address));

      const poolProxyAddress = await addressesProvider.getPool();
      config.deployedContracts.core.PoolProxy = poolProxyAddress;
      log(`Pool proxy deployed at: ${poolProxyAddress}`);
      saveConfig();
    } else {
      log(`Pool already deployed at: ${config.deployedContracts.core.PoolImpl}`);
    }
  } else {
    log('Step 6 skipped - using existing Pool');
  }

  log('\n✅ Deployment configuration saved!');
  log(`Edit ${configPath} to:`);
  log('  - Skip specific steps: add step numbers to "skipSteps" array');
  log('  - Resume from failure: addresses are automatically saved');
  log('\nRun the script again to continue from where it left off.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    saveConfig();
    process.exit(1);
  });
