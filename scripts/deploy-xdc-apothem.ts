import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ethers } from 'hardhat';
import { join } from 'path';
import { oracle } from '../types/mocks';

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

interface DeploymentAddresses {
  testTokens: {
    USDT: string;
    WXDC: string;
  };
  core: {
    PoolAddressesProvider: string;
    PoolAddressesProviderRegistry: string;
    SupplyLogic: string;
    BorrowLogic: string;
    LiquidationLogic: string;
    EModeLogic: string;
    BridgeLogic: string;
    ConfiguratorLogic: string;
    FlashLoanLogic: string;
    PoolImpl: string;
    PoolConfiguratorImpl: string;
    PoolProxy: string;
    PoolConfiguratorProxy: string;
    ReservesSetupHelper: string;
    ACLManager: string;
    AaveOracle: string;
    ProtocolDataProvider: string;
    AToken: string;
    DelegationAwareAToken: string;
    StableDebtToken: string;
    VariableDebtToken: string;
  };
  strategies: {
    USDT: string;
    WXDC: string;
  };
  reserves: {
    USDT: {
      aToken: string;
      stableDebtToken: string;
      variableDebtToken: string;
    };
    WXDC: {
      aToken: string;
      stableDebtToken: string;
      variableDebtToken: string;
    };
  };
}

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

function saveDeploymentAddresses(addresses: DeploymentAddresses) {
  const deploymentDir = join(__dirname, '..', 'deployments', 'xdc-apothem');
  if (!existsSync(deploymentDir)) {
    mkdirSync(deploymentDir, { recursive: true });
  }

  // Save as JSON
  const jsonPath = join(deploymentDir, 'addresses.json');
  writeFileSync(jsonPath, JSON.stringify(addresses, null, 2));
  log(`Deployment addresses saved to ${jsonPath}`);

  // Save as .env format
  const envPath = join(deploymentDir, 'deployed.env');
  const envContent = generateEnvFile(addresses);
  writeFileSync(envPath, envContent);
  log(`Environment variables saved to ${envPath}`);
}

function generateEnvFile(addresses: DeploymentAddresses): string {
  const lines = [
    '# XDC Apothem Deployment Addresses',
    `# Deployed at: ${new Date().toISOString()}`,
    '',
    '# Test Tokens',
    `TEST_USDT_ADDRESS=${addresses.testTokens.USDT}`,
    `TEST_WXDC_ADDRESS=${addresses.testTokens.WXDC}`,
    '',
    '# Core Protocol',
    `POOL_ADDRESSES_PROVIDER=${addresses.core.PoolAddressesProvider}`,
    `POOL_PROXY=${addresses.core.PoolProxy}`,
    `POOL_CONFIGURATOR_PROXY=${addresses.core.PoolConfiguratorProxy}`,
    `ACL_MANAGER=${addresses.core.ACLManager}`,
    `AAVE_ORACLE=${addresses.core.AaveOracle}`,
    `PROTOCOL_DATA_PROVIDER=${addresses.core.ProtocolDataProvider}`,
    '',
    '# Token Implementations',
    `ATOKEN_IMPL=${addresses.core.AToken}`,
    `STABLE_DEBT_TOKEN_IMPL=${addresses.core.StableDebtToken}`,
    `VARIABLE_DEBT_TOKEN_IMPL=${addresses.core.VariableDebtToken}`,
    '',
    '# Interest Rate Strategies',
    `USDT_STRATEGY=${addresses.strategies.USDT}`,
    `WXDC_STRATEGY=${addresses.strategies.WXDC}`,
    '',
    '# USDT Reserve Tokens',
    `USDT_ATOKEN=${addresses.reserves.USDT.aToken}`,
    `USDT_STABLE_DEBT=${addresses.reserves.USDT.stableDebtToken}`,
    `USDT_VARIABLE_DEBT=${addresses.reserves.USDT.variableDebtToken}`,
    '',
    '# WXDC Reserve Tokens',
    `WXDC_ATOKEN=${addresses.reserves.WXDC.aToken}`,
    `WXDC_STABLE_DEBT=${addresses.reserves.WXDC.stableDebtToken}`,
    `WXDC_VARIABLE_DEBT=${addresses.reserves.WXDC.variableDebtToken}`,
  ];
  return lines.join('\n');
}

async function main() {
  logSection('AAVE V3 Deployment on XDC Apothem');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  const balance = await deployer.getBalance();
  log(`Deployer balance: ${ethers.utils.formatEther(balance)} XDC`);

  if (balance.lt(ethers.utils.parseEther('10'))) {
    throw new Error('Insufficient XDC balance. Need at least 10 XDC for deployment.');
  }

  const deploymentAddresses: DeploymentAddresses = {
    testTokens: { USDT: '', WXDC: '' },
    core: {
      PoolAddressesProvider: '',
      PoolAddressesProviderRegistry: '',
      SupplyLogic: '',
      BorrowLogic: '',
      LiquidationLogic: '',
      EModeLogic: '',
      BridgeLogic: '',
      ConfiguratorLogic: '',
      FlashLoanLogic: '',
      PoolImpl: '',
      PoolConfiguratorImpl: '',
      PoolProxy: '',
      PoolConfiguratorProxy: '',
      ReservesSetupHelper: '',
      ACLManager: '',
      AaveOracle: '',
      ProtocolDataProvider: '',
      AToken: '',
      DelegationAwareAToken: '',
      StableDebtToken: '',
      VariableDebtToken: '',
    },
    strategies: { USDT: '', WXDC: '' },
    reserves: {
      USDT: { aToken: '', stableDebtToken: '', variableDebtToken: '' },
      WXDC: { aToken: '', stableDebtToken: '', variableDebtToken: '' },
    },
  };

  // Step 1: Deploy Test Tokens
  logSection('Step 1: Deploying Test Tokens');

  log('Deploying Test_USDT...');
  const TestUSDT = await ethers.getContractFactory('Test_USDT');
  const testUSDT = await TestUSDT.deploy();
  await testUSDT.deployed();
  deploymentAddresses.testTokens.USDT = testUSDT.address;
  log(`Test_USDT deployed at: ${testUSDT.address}`);

  log('Deploying Test_WXDC...');
  const TestWXDC = await ethers.getContractFactory('Test_WXDC');
  const testWXDC = await TestWXDC.deploy();
  await testWXDC.deployed();
  deploymentAddresses.testTokens.WXDC = testWXDC.address;
  log(`Test_WXDC deployed at: ${testWXDC.address}`);

  // Mint initial supply
  log('Minting initial token supply...');
  const mintAmount = ethers.utils.parseUnits('1000000', 6); // 1M tokens
  await waitForTx(await testUSDT.mint(deployer.address, mintAmount));
  await waitForTx(await testWXDC.mint(deployer.address, mintAmount));
  log('Initial supply minted successfully');

  // Step 2: Deploy Libraries
  logSection('Step 2: Deploying Protocol Libraries');

  log('Deploying PoolLogic...');
  const PoolLogic = await ethers.getContractFactory('PoolLogic');
  const poolLogic = await PoolLogic.deploy();
  await poolLogic.deployed();
  log(`PoolLogic deployed at: ${poolLogic.address}`);

  log('Deploying SupplyLogic...');
  const SupplyLogic = await ethers.getContractFactory('SupplyLogic');
  const supplyLogic = await SupplyLogic.deploy();
  await supplyLogic.deployed();
  deploymentAddresses.core.SupplyLogic = supplyLogic.address;
  log(`SupplyLogic deployed at: ${supplyLogic.address}`);

  log('Deploying BorrowLogic...');
  const BorrowLogic = await ethers.getContractFactory('BorrowLogic');
  const borrowLogic = await BorrowLogic.deploy();
  await borrowLogic.deployed();
  deploymentAddresses.core.BorrowLogic = borrowLogic.address;
  log(`BorrowLogic deployed at: ${borrowLogic.address}`);

  log('Deploying LiquidationLogic...');
  const LiquidationLogic = await ethers.getContractFactory('LiquidationLogic');
  const liquidationLogic = await LiquidationLogic.deploy();
  await liquidationLogic.deployed();
  deploymentAddresses.core.LiquidationLogic = liquidationLogic.address;
  log(`LiquidationLogic deployed at: ${liquidationLogic.address}`);

  log('Deploying EModeLogic...');
  const EModeLogic = await ethers.getContractFactory('EModeLogic');
  const eModeLogic = await EModeLogic.deploy();
  await eModeLogic.deployed();
  deploymentAddresses.core.EModeLogic = eModeLogic.address;
  log(`EModeLogic deployed at: ${eModeLogic.address}`);

  log('Deploying BridgeLogic...');
  const BridgeLogic = await ethers.getContractFactory('BridgeLogic');
  const bridgeLogic = await BridgeLogic.deploy();
  await bridgeLogic.deployed();
  deploymentAddresses.core.BridgeLogic = bridgeLogic.address;
  log(`BridgeLogic deployed at: ${bridgeLogic.address}`);

  log('Deploying FlashLoanLogic...');
  const FlashLoanLogic = await ethers.getContractFactory('FlashLoanLogic', {
    libraries: {
      BorrowLogic: borrowLogic.address,
    },
  });
  const flashLoanLogic = await FlashLoanLogic.deploy();
  await flashLoanLogic.deployed();
  deploymentAddresses.core.FlashLoanLogic = flashLoanLogic.address;
  log(`FlashLoanLogic deployed at: ${flashLoanLogic.address}`);

  log('Deploying ConfiguratorLogic...');
  const ConfiguratorLogic = await ethers.getContractFactory('ConfiguratorLogic');
  const configuratorLogic = await ConfiguratorLogic.deploy();
  await configuratorLogic.deployed();
  deploymentAddresses.core.ConfiguratorLogic = configuratorLogic.address;
  log(`ConfiguratorLogic deployed at: ${configuratorLogic.address}`);

  // Step 3: Deploy PoolAddressesProvider and Registry
  logSection('Step 3: Deploying Pool Addresses Provider');

  log('Deploying PoolAddressesProviderRegistry...');
  const PoolAddressesProviderRegistry = await ethers.getContractFactory(
    'PoolAddressesProviderRegistry'
  );
  const registry = await PoolAddressesProviderRegistry.deploy(deployer.address);
  await registry.deployed();
  deploymentAddresses.core.PoolAddressesProviderRegistry = registry.address;
  log(`PoolAddressesProviderRegistry deployed at: ${registry.address}`);

  log('Deploying PoolAddressesProvider...');
  const PoolAddressesProvider = await ethers.getContractFactory('PoolAddressesProvider');
  const addressesProvider = await PoolAddressesProvider.deploy(
    XDC_APOTHEM_CONFIG.marketId,
    deployer.address
  );
  await addressesProvider.deployed();
  deploymentAddresses.core.PoolAddressesProvider = addressesProvider.address;
  log(`PoolAddressesProvider deployed at: ${addressesProvider.address}`);

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

  // Step 4: Deploy ACLManager
  logSection('Step 4: Deploying ACL Manager');

  log('Deploying ACLManager...');
  const ACLManager = await ethers.getContractFactory('ACLManager');
  const aclManager = await ACLManager.deploy(addressesProvider.address);
  await aclManager.deployed();
  deploymentAddresses.core.ACLManager = aclManager.address;
  log(`ACLManager deployed at: ${aclManager.address}`);

  log('Setting ACLManager in AddressesProvider...');
  await waitForTx(await addressesProvider.setACLManager(aclManager.address));

  // Step 5: Configure Oracle (Using existing XDC oracle)
  logSection('Step 5: Configuring Oracle');

  log('Using existing XDC/USDT oracle at: ' + XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT);
  deploymentAddresses.core.AaveOracle = XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT;

  log('Setting PriceOracle in AddressesProvider...');
  await waitForTx(await addressesProvider.setPriceOracle(XDC_APOTHEM_CONFIG.priceFeeds.XDC_USDT));
  log('Oracle configured successfully');

  // Step 6: Deploy Pool Implementation
  logSection('Step 6: Deploying Pool Implementation');

  log('Deploying Pool implementation...');
  const Pool = await ethers.getContractFactory('Pool', {
    libraries: {
      PoolLogic: poolLogic.address,
      SupplyLogic: supplyLogic.address,
      BorrowLogic: borrowLogic.address,
      LiquidationLogic: liquidationLogic.address,
      EModeLogic: eModeLogic.address,
      BridgeLogic: bridgeLogic.address,
      FlashLoanLogic: flashLoanLogic.address,
    },
  });
  const poolImpl = await Pool.deploy(addressesProvider.address);
  await poolImpl.deployed();
  deploymentAddresses.core.PoolImpl = poolImpl.address;
  log(`Pool implementation deployed at: ${poolImpl.address}`);

  log('Setting Pool implementation in AddressesProvider...');
  await waitForTx(await addressesProvider.setPoolImpl(poolImpl.address));

  const poolProxyAddress = await addressesProvider.getPool();
  deploymentAddresses.core.PoolProxy = poolProxyAddress;
  log(`Pool proxy deployed at: ${poolProxyAddress}`);

  // Step 7: Deploy PoolConfigurator Implementation
  logSection('Step 7: Deploying Pool Configurator');

  log('Deploying PoolConfigurator implementation...');
  const PoolConfigurator = await ethers.getContractFactory('PoolConfigurator', {
    libraries: {
      ConfiguratorLogic: configuratorLogic.address,
    },
  });
  const configuratorImpl = await PoolConfigurator.deploy();
  await configuratorImpl.deployed();
  deploymentAddresses.core.PoolConfiguratorImpl = configuratorImpl.address;
  log(`PoolConfigurator implementation deployed at: ${configuratorImpl.address}`);

  log('Setting PoolConfigurator implementation in AddressesProvider...');
  await waitForTx(await addressesProvider.setPoolConfiguratorImpl(configuratorImpl.address));

  const configuratorProxyAddress = await addressesProvider.getPoolConfigurator();
  deploymentAddresses.core.PoolConfiguratorProxy = configuratorProxyAddress;
  log(`PoolConfigurator proxy deployed at: ${configuratorProxyAddress}`);

  const poolConfigurator = await ethers.getContractAt('PoolConfigurator', configuratorProxyAddress);

  // Step 8: Deploy Token Implementations
  logSection('Step 8: Deploying Token Implementations');

  log('Deploying AToken implementation...');
  const AToken = await ethers.getContractFactory('AToken');
  const aTokenImpl = await AToken.deploy(poolProxyAddress);
  await aTokenImpl.deployed();
  deploymentAddresses.core.AToken = aTokenImpl.address;
  log(`AToken implementation deployed at: ${aTokenImpl.address}`);

  log('Deploying DelegationAwareAToken implementation...');
  const DelegationAwareAToken = await ethers.getContractFactory('DelegationAwareAToken');
  const delegationAwareATokenImpl = await DelegationAwareAToken.deploy(poolProxyAddress);
  await delegationAwareATokenImpl.deployed();
  deploymentAddresses.core.DelegationAwareAToken = delegationAwareATokenImpl.address;
  log(`DelegationAwareAToken implementation deployed at: ${delegationAwareATokenImpl.address}`);

  log('Deploying StableDebtToken implementation...');
  const StableDebtToken = await ethers.getContractFactory('StableDebtToken');
  const stableDebtTokenImpl = await StableDebtToken.deploy(poolProxyAddress);
  await stableDebtTokenImpl.deployed();
  deploymentAddresses.core.StableDebtToken = stableDebtTokenImpl.address;
  log(`StableDebtToken implementation deployed at: ${stableDebtTokenImpl.address}`);

  log('Deploying VariableDebtToken implementation...');
  const VariableDebtToken = await ethers.getContractFactory('VariableDebtToken');
  const variableDebtTokenImpl = await VariableDebtToken.deploy(poolProxyAddress);
  await variableDebtTokenImpl.deployed();
  deploymentAddresses.core.VariableDebtToken = variableDebtTokenImpl.address;
  log(`VariableDebtToken implementation deployed at: ${variableDebtTokenImpl.address}`);

  // Step 9: Deploy Protocol Data Provider
  logSection('Step 9: Deploying Protocol Data Provider');

  log('Deploying AaveProtocolDataProvider...');
  const AaveProtocolDataProvider = await ethers.getContractFactory('AaveProtocolDataProvider');
  const dataProvider = await AaveProtocolDataProvider.deploy(addressesProvider.address);
  await dataProvider.deployed();
  deploymentAddresses.core.ProtocolDataProvider = dataProvider.address;
  log(`AaveProtocolDataProvider deployed at: ${dataProvider.address}`);

  log('Setting PoolDataProvider in AddressesProvider...');
  await waitForTx(await addressesProvider.setPoolDataProvider(dataProvider.address));

  // Step 10: Deploy ReservesSetupHelper
  logSection('Step 10: Deploying Reserves Setup Helper');

  log('Deploying ReservesSetupHelper...');
  const ReservesSetupHelper = await ethers.getContractFactory('ReservesSetupHelper');
  const reservesSetupHelper = await ReservesSetupHelper.deploy();
  await reservesSetupHelper.deployed();
  deploymentAddresses.core.ReservesSetupHelper = reservesSetupHelper.address;
  log(`ReservesSetupHelper deployed at: ${reservesSetupHelper.address}`);

  // Step 11: Deploy Interest Rate Strategies
  logSection('Step 11: Deploying Interest Rate Strategies');

  // USDT Strategy (Stablecoin)
  log('Deploying USDT Interest Rate Strategy...');
  const DefaultReserveInterestRateStrategy = await ethers.getContractFactory(
    'DefaultReserveInterestRateStrategy'
  );
  const usdtStrategy = await DefaultReserveInterestRateStrategy.deploy(
    addressesProvider.address,
    ethers.utils.parseUnits('0.80', 27), // Optimal usage ratio: 80%
    ethers.utils.parseUnits('0', 27), // Base variable borrow rate: 0%
    ethers.utils.parseUnits('0.04', 27), // Variable rate slope 1: 4%
    ethers.utils.parseUnits('0.75', 27), // Variable rate slope 2: 75%
    ethers.utils.parseUnits('0.02', 27), // Stable rate slope 1: 2%
    ethers.utils.parseUnits('0.75', 27), // Stable rate slope 2: 75%
    ethers.utils.parseUnits('0.02', 27), // Base stable rate offset: 2%
    ethers.utils.parseUnits('0.05', 27), // Stable rate excess offset: 5%
    ethers.utils.parseUnits('0.20', 27) // Optimal stable to total debt ratio: 20%
  );
  await usdtStrategy.deployed();
  deploymentAddresses.strategies.USDT = usdtStrategy.address;
  log(`USDT Strategy deployed at: ${usdtStrategy.address}`);

  // WXDC Strategy (Volatile asset)
  log('Deploying WXDC Interest Rate Strategy...');
  const wxdcStrategy = await DefaultReserveInterestRateStrategy.deploy(
    addressesProvider.address,
    ethers.utils.parseUnits('0.65', 27), // Optimal usage ratio: 65%
    ethers.utils.parseUnits('0', 27), // Base variable borrow rate: 0%
    ethers.utils.parseUnits('0.08', 27), // Variable rate slope 1: 8%
    ethers.utils.parseUnits('1.00', 27), // Variable rate slope 2: 100%
    ethers.utils.parseUnits('0.10', 27), // Stable rate slope 1: 10%
    ethers.utils.parseUnits('1.00', 27), // Stable rate slope 2: 100%
    ethers.utils.parseUnits('0.03', 27), // Base stable rate offset: 3%
    ethers.utils.parseUnits('0.08', 27), // Stable rate excess offset: 8%
    ethers.utils.parseUnits('0.20', 27) // Optimal stable to total debt ratio: 20%
  );
  await wxdcStrategy.deployed();
  deploymentAddresses.strategies.WXDC = wxdcStrategy.address;
  log(`WXDC Strategy deployed at: ${wxdcStrategy.address}`);

  // Grant necessary roles to deployer
  log('\nGranting ASSET_LISTING_ADMIN and POOL_ADMIN roles to deployer...');
  const ASSET_LISTING_ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('ASSET_LISTING_ADMIN')
  );
  const POOL_ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('POOL_ADMIN'));

  await waitForTx(await aclManager.addAssetListingAdmin(deployer.address));
  await waitForTx(await aclManager.addPoolAdmin(deployer.address));
  log('Roles granted successfully');

  // Step 12: Initialize USDT Reserve
  logSection('Step 12: Initializing USDT Reserve');

  log('Initializing USDT reserve...');
  const usdtInitTx = await poolConfigurator.initReserves([
    {
      aTokenImpl: aTokenImpl.address,
      stableDebtTokenImpl: stableDebtTokenImpl.address,
      variableDebtTokenImpl: variableDebtTokenImpl.address,
      underlyingAssetDecimals: 6,
      interestRateStrategyAddress: usdtStrategy.address,
      underlyingAsset: testUSDT.address,
      treasury: deployer.address,
      incentivesController: ethers.constants.AddressZero,
      aTokenName: 'Aave XDC USDT',
      aTokenSymbol: 'aXDCUSDT',
      variableDebtTokenName: 'Aave XDC Variable Debt USDT',
      variableDebtTokenSymbol: 'variableDebtXDCUSDT',
      stableDebtTokenName: 'Aave XDC Stable Debt USDT',
      stableDebtTokenSymbol: 'stableDebtXDCUSDT',
      params: '0x10',
    },
  ]);
  await waitForTx(usdtInitTx);

  // Get USDT reserve token addresses
  const usdtReserveData = await dataProvider.getReserveTokensAddresses(testUSDT.address);
  deploymentAddresses.reserves.USDT.aToken = usdtReserveData.aTokenAddress;
  deploymentAddresses.reserves.USDT.stableDebtToken = usdtReserveData.stableDebtTokenAddress;
  deploymentAddresses.reserves.USDT.variableDebtToken = usdtReserveData.variableDebtTokenAddress;
  log(`USDT aToken: ${usdtReserveData.aTokenAddress}`);
  log(`USDT Stable Debt Token: ${usdtReserveData.stableDebtTokenAddress}`);
  log(`USDT Variable Debt Token: ${usdtReserveData.variableDebtTokenAddress}`);

  // Configure USDT reserve parameters
  log('Configuring USDT reserve parameters...');
  await waitForTx(
    await poolConfigurator.configureReserveAsCollateral(
      testUSDT.address,
      7500, // 75% LTV
      8000, // 80% Liquidation Threshold
      10500 // 105% Liquidation Bonus
    )
  );

  await waitForTx(await poolConfigurator.setReserveBorrowing(testUSDT.address, true));
  await waitForTx(await poolConfigurator.setReserveStableRateBorrowing(testUSDT.address, true));
  await waitForTx(await poolConfigurator.setReserveFactor(testUSDT.address, 1000)); // 10%
  await waitForTx(await poolConfigurator.setBorrowCap(testUSDT.address, 1000000)); // 1M cap
  await waitForTx(await poolConfigurator.setSupplyCap(testUSDT.address, 2000000)); // 2M cap
  log('USDT reserve configured successfully');

  // Step 13: Initialize WXDC Reserve
  logSection('Step 13: Initializing WXDC Reserve');

  log('Initializing WXDC reserve...');
  const wxdcInitTx = await poolConfigurator.initReserves([
    {
      aTokenImpl: aTokenImpl.address,
      stableDebtTokenImpl: stableDebtTokenImpl.address,
      variableDebtTokenImpl: variableDebtTokenImpl.address,
      underlyingAssetDecimals: 6,
      interestRateStrategyAddress: wxdcStrategy.address,
      underlyingAsset: testWXDC.address,
      treasury: deployer.address,
      incentivesController: ethers.constants.AddressZero,
      aTokenName: 'Aave XDC WXDC',
      aTokenSymbol: 'aXDCWXDC',
      variableDebtTokenName: 'Aave XDC Variable Debt WXDC',
      variableDebtTokenSymbol: 'variableDebtXDCWXDC',
      stableDebtTokenName: 'Aave XDC Stable Debt WXDC',
      stableDebtTokenSymbol: 'stableDebtXDCWXDC',
      params: '0x10',
    },
  ]);
  await waitForTx(wxdcInitTx);

  // Get WXDC reserve token addresses
  const wxdcReserveData = await dataProvider.getReserveTokensAddresses(testWXDC.address);
  deploymentAddresses.reserves.WXDC.aToken = wxdcReserveData.aTokenAddress;
  deploymentAddresses.reserves.WXDC.stableDebtToken = wxdcReserveData.stableDebtTokenAddress;
  deploymentAddresses.reserves.WXDC.variableDebtToken = wxdcReserveData.variableDebtTokenAddress;
  log(`WXDC aToken: ${wxdcReserveData.aTokenAddress}`);
  log(`WXDC Stable Debt Token: ${wxdcReserveData.stableDebtTokenAddress}`);
  log(`WXDC Variable Debt Token: ${wxdcReserveData.variableDebtTokenAddress}`);

  // Configure WXDC reserve parameters
  log('Configuring WXDC reserve parameters...');
  await waitForTx(
    await poolConfigurator.configureReserveAsCollateral(
      testWXDC.address,
      7000, // 70% LTV
      7500, // 75% Liquidation Threshold
      10700 // 107% Liquidation Bonus
    )
  );

  await waitForTx(await poolConfigurator.setReserveBorrowing(testWXDC.address, true));
  await waitForTx(await poolConfigurator.setReserveStableRateBorrowing(testWXDC.address, false)); // No stable borrow for volatile asset
  await waitForTx(await poolConfigurator.setReserveFactor(testWXDC.address, 1000)); // 10%
  await waitForTx(await poolConfigurator.setBorrowCap(testWXDC.address, 500000)); // 500K cap
  await waitForTx(await poolConfigurator.setSupplyCap(testWXDC.address, 1000000)); // 1M cap
  log('WXDC reserve configured successfully');

  // Step 14: Save Deployment Addresses
  logSection('Step 14: Saving Deployment Addresses');
  saveDeploymentAddresses(deploymentAddresses);

  // Step 15: Post-Deployment Testing
  logSection('Step 15: Post-Deployment Testing');

  const pool = await ethers.getContractAt('Pool', poolProxyAddress);

  // Test 1: Check oracle configuration
  log('Test 1: Checking oracle configuration...');
  try {
    const oracleAddress = await addressesProvider.getPriceOracle();
    log(`Oracle configured at: ${oracleAddress}`);
    log('✓ Oracle configuration verified');
  } catch (error) {
    log(`✗ Oracle configuration check failed: ${error}`);
  }

  // Test 2: Supply USDT
  log('\nTest 2: Testing USDT supply...');
  try {
    const supplyAmount = ethers.utils.parseUnits('1000', 6); // 1000 USDT
    await waitForTx(await testUSDT.approve(pool.address, supplyAmount));
    await waitForTx(await pool.supply(testUSDT.address, supplyAmount, deployer.address, 0));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Available Borrow: ${ethers.utils.formatUnits(userData.availableBorrowsBase, 8)} USD`);
    log('✓ USDT supply successful');
  } catch (error) {
    log(`✗ USDT supply failed: ${error}`);
  }

  // Test 3: Supply WXDC
  log('\nTest 3: Testing WXDC supply...');
  try {
    const supplyAmount = ethers.utils.parseUnits('1000', 6); // 1000 WXDC
    await waitForTx(await testWXDC.approve(pool.address, supplyAmount));
    await waitForTx(await pool.supply(testWXDC.address, supplyAmount, deployer.address, 0));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Available Borrow: ${ethers.utils.formatUnits(userData.availableBorrowsBase, 8)} USD`);
    log('✓ WXDC supply successful');
  } catch (error) {
    log(`✗ WXDC supply failed: ${error}`);
  }

  // Test 4: Borrow WXDC
  log('\nTest 4: Testing WXDC borrow...');
  try {
    const borrowAmount = ethers.utils.parseUnits('100', 6); // 100 WXDC
    await waitForTx(await pool.borrow(testWXDC.address, borrowAmount, 2, 0, deployer.address)); // Variable rate

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Debt: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);
    log('✓ WXDC borrow successful');
  } catch (error) {
    log(`✗ WXDC borrow failed: ${error}`);
  }

  // Test 5: Repay WXDC
  log('\nTest 5: Testing WXDC repay...');
  try {
    const repayAmount = ethers.utils.parseUnits('50', 6); // 50 WXDC
    await waitForTx(await testWXDC.approve(pool.address, repayAmount));
    await waitForTx(await pool.repay(testWXDC.address, repayAmount, 2, deployer.address));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Debt: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);
    log('✓ WXDC repay successful');
  } catch (error) {
    log(`✗ WXDC repay failed: ${error}`);
  }

  // Test 6: Withdraw USDT
  log('\nTest 6: Testing USDT withdraw...');
  try {
    const withdrawAmount = ethers.utils.parseUnits('500', 6); // 500 USDT
    await waitForTx(await pool.withdraw(testUSDT.address, withdrawAmount, deployer.address));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);
    log('✓ USDT withdraw successful');
  } catch (error) {
    log(`✗ USDT withdraw failed: ${error}`);
  }

  // Test 7: Check reserve data
  log('\nTest 7: Checking reserve data...');
  try {
    const usdtReserve = await dataProvider.getReserveData(testUSDT.address);
    const wxdcReserve = await dataProvider.getReserveData(testWXDC.address);

    log('USDT Reserve:');
    log(`  Liquidity Rate: ${ethers.utils.formatUnits(usdtReserve.liquidityRate, 27)}%`);
    log(`  Variable Borrow Rate: ${ethers.utils.formatUnits(usdtReserve.variableBorrowRate, 27)}%`);
    log(`  Stable Borrow Rate: ${ethers.utils.formatUnits(usdtReserve.stableBorrowRate, 27)}%`);

    log('WXDC Reserve:');
    log(`  Liquidity Rate: ${ethers.utils.formatUnits(wxdcReserve.liquidityRate, 27)}%`);
    log(`  Variable Borrow Rate: ${ethers.utils.formatUnits(wxdcReserve.variableBorrowRate, 27)}%`);
    log(`  Stable Borrow Rate: ${ethers.utils.formatUnits(wxdcReserve.stableBorrowRate, 27)}%`);

    log('✓ Reserve data retrieved successfully');
  } catch (error) {
    log(`✗ Reserve data check failed: ${error}`);
  }

  // Final Summary
  logSection('Deployment Complete!');
  log('All contracts deployed and configured successfully.');
  log(`Deployment addresses saved to: deployments/xdc-apothem/`);
  log('\nKey Addresses:');
  log(`  Pool: ${poolProxyAddress}`);
  log(`  PoolConfigurator: ${configuratorProxyAddress}`);
  log(`  Oracle: ${oracle.address}`);
  log(`  USDT: ${testUSDT.address}`);
  log(`  WXDC: ${testWXDC.address}`);
  log('\nYou can now interact with the AAVE V3 protocol on XDC Apothem!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
