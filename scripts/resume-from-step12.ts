import { ethers } from 'hardhat';

// Deployed contract addresses from previous run
const DEPLOYED = {
  testUSDT: '0x84e2D47A110DC9db2f74Ab6510B4Bf1044e018ba',
  testWXDC: '0xa6b99397474f93C7D41bC461B6F030Bde9aB196b',
  poolAddressesProvider: '0x0932e44AfA92137355c156513588d0712c320CA2',
  aclManager: '0x6F08a8Cc608D68BC9027E8ec05b13DC0847eb2D3',
  poolProxy: '0xa1d7f9B47D5fF6d752f6A41Ea14c1c14D1616463',
  poolConfiguratorProxy: '0x0bA7E38F3c28168D3De244Db87113f77ADcDC936',
  dataProvider: '0xb500F24DA94f8e71fB350F5c1177400B31E4E12B',
  aTokenImpl: '0x4FF659966C411f91344F548d932d55D2D23c4cb7',
  stableDebtTokenImpl: '0xB359C6CA6e038aC13A95F43Ea05726642997bEdf',
  variableDebtTokenImpl: '0x7Ec1aE8657aF4d9aE05D603c3c8DBA378f092D74',
  usdtStrategy: '0xB5441e0Ad5654cCfd81F5Eb8A86518ae358C8219',
  wxdcStrategy: '0x9C275F38B7eFbc21C50b4a41dB94C9490D4187A2',
};

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function waitForTx(tx: any) {
  log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  log(`Transaction confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  Resuming AAVE V3 Deployment from Step 12');
  console.log('='.repeat(80) + '\n');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  // Load contracts
  const testUSDT = await ethers.getContractAt('Test_USDT', DEPLOYED.testUSDT);
  const testWXDC = await ethers.getContractAt('Test_WXDC', DEPLOYED.testWXDC);
  const addressesProvider = await ethers.getContractAt(
    'PoolAddressesProvider',
    DEPLOYED.poolAddressesProvider
  );
  const aclManager = await ethers.getContractAt('ACLManager', DEPLOYED.aclManager);
  const poolConfigurator = await ethers.getContractAt(
    'PoolConfigurator',
    DEPLOYED.poolConfiguratorProxy
  );
  const dataProvider = await ethers.getContractAt(
    'AaveProtocolDataProvider',
    DEPLOYED.dataProvider
  );
  const pool = await ethers.getContractAt('Pool', DEPLOYED.poolProxy);

  // Grant necessary roles
  log('\nGranting ASSET_LISTING_ADMIN and POOL_ADMIN roles to deployer...');
  await waitForTx(await aclManager.addAssetListingAdmin(deployer.address));
  await waitForTx(await aclManager.addPoolAdmin(deployer.address));
  log('Roles granted successfully');

  // Step 12: Initialize USDT Reserve
  console.log('\n' + '='.repeat(80));
  console.log('  Step 12: Initializing USDT Reserve');
  console.log('='.repeat(80) + '\n');

  log('Initializing USDT reserve...');
  const usdtInitTx = await poolConfigurator.initReserves([
    {
      aTokenImpl: DEPLOYED.aTokenImpl,
      stableDebtTokenImpl: DEPLOYED.stableDebtTokenImpl,
      variableDebtTokenImpl: DEPLOYED.variableDebtTokenImpl,
      underlyingAssetDecimals: 6,
      interestRateStrategyAddress: DEPLOYED.usdtStrategy,
      underlyingAsset: DEPLOYED.testUSDT,
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

  const usdtReserveData = await dataProvider.getReserveTokensAddresses(DEPLOYED.testUSDT);
  log(`USDT aToken: ${usdtReserveData.aTokenAddress}`);
  log(`USDT Stable Debt Token: ${usdtReserveData.stableDebtTokenAddress}`);
  log(`USDT Variable Debt Token: ${usdtReserveData.variableDebtTokenAddress}`);

  log('Configuring USDT reserve parameters...');
  await waitForTx(
    await poolConfigurator.configureReserveAsCollateral(
      DEPLOYED.testUSDT,
      7500, // 75% LTV
      8000, // 80% Liquidation Threshold
      10500 // 105% Liquidation Bonus
    )
  );

  await waitForTx(await poolConfigurator.setReserveBorrowing(DEPLOYED.testUSDT, true));
  await waitForTx(await poolConfigurator.setReserveStableRateBorrowing(DEPLOYED.testUSDT, true));
  await waitForTx(await poolConfigurator.setReserveFactor(DEPLOYED.testUSDT, 1000)); // 10%
  await waitForTx(await poolConfigurator.setBorrowCap(DEPLOYED.testUSDT, 1000000));
  await waitForTx(await poolConfigurator.setSupplyCap(DEPLOYED.testUSDT, 2000000));
  log('USDT reserve configured successfully');

  // Step 13: Initialize WXDC Reserve
  console.log('\n' + '='.repeat(80));
  console.log('  Step 13: Initializing WXDC Reserve');
  console.log('='.repeat(80) + '\n');

  log('Initializing WXDC reserve...');
  const wxdcInitTx = await poolConfigurator.initReserves([
    {
      aTokenImpl: DEPLOYED.aTokenImpl,
      stableDebtTokenImpl: DEPLOYED.stableDebtTokenImpl,
      variableDebtTokenImpl: DEPLOYED.variableDebtTokenImpl,
      underlyingAssetDecimals: 6,
      interestRateStrategyAddress: DEPLOYED.wxdcStrategy,
      underlyingAsset: DEPLOYED.testWXDC,
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

  const wxdcReserveData = await dataProvider.getReserveTokensAddresses(DEPLOYED.testWXDC);
  log(`WXDC aToken: ${wxdcReserveData.aTokenAddress}`);
  log(`WXDC Stable Debt Token: ${wxdcReserveData.stableDebtTokenAddress}`);
  log(`WXDC Variable Debt Token: ${wxdcReserveData.variableDebtTokenAddress}`);

  log('Configuring WXDC reserve parameters...');
  await waitForTx(
    await poolConfigurator.configureReserveAsCollateral(
      DEPLOYED.testWXDC,
      7000, // 70% LTV
      7500, // 75% Liquidation Threshold
      10700 // 107% Liquidation Bonus
    )
  );

  await waitForTx(await poolConfigurator.setReserveBorrowing(DEPLOYED.testWXDC, true));
  await waitForTx(await poolConfigurator.setReserveStableRateBorrowing(DEPLOYED.testWXDC, false));
  await waitForTx(await poolConfigurator.setReserveFactor(DEPLOYED.testWXDC, 1000)); // 10%
  await waitForTx(await poolConfigurator.setBorrowCap(DEPLOYED.testWXDC, 500000));
  await waitForTx(await poolConfigurator.setSupplyCap(DEPLOYED.testWXDC, 1000000));
  log('WXDC reserve configured successfully');

  // Post-deployment tests
  console.log('\n' + '='.repeat(80));
  console.log('  Step 14: Post-Deployment Tests');
  console.log('='.repeat(80) + '\n');

  log('Test 1: Supply USDT...');
  try {
    const supplyAmount = ethers.utils.parseUnits('1000', 6);
    await waitForTx(await testUSDT.approve(pool.address, supplyAmount));
    await waitForTx(await pool.supply(testUSDT.address, supplyAmount, deployer.address, 0));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Available Borrow: ${ethers.utils.formatUnits(userData.availableBorrowsBase, 8)} USD`);
    log('✓ USDT supply successful');
  } catch (error) {
    log(`✗ USDT supply failed: ${error}`);
  }

  log('\nTest 2: Supply WXDC...');
  try {
    const supplyAmount = ethers.utils.parseUnits('1000', 6);
    await waitForTx(await testWXDC.approve(pool.address, supplyAmount));
    await waitForTx(await pool.supply(testWXDC.address, supplyAmount, deployer.address, 0));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log('✓ WXDC supply successful');
  } catch (error) {
    log(`✗ WXDC supply failed: ${error}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  Deployment Complete!');
  console.log('='.repeat(80) + '\n');

  log('All contracts deployed and configured successfully.');
  log('\nKey Addresses:');
  log(`  Pool: ${DEPLOYED.poolProxy}`);
  log(`  PoolConfigurator: ${DEPLOYED.poolConfiguratorProxy}`);
  log(`  Oracle: 0x7D276a421fa99B0E86aC3B5c47205987De76B497`);
  log(`  USDT: ${DEPLOYED.testUSDT}`);
  log(`  WXDC: ${DEPLOYED.testWXDC}`);
  log(`  USDT aToken: ${usdtReserveData.aTokenAddress}`);
  log(`  WXDC aToken: ${wxdcReserveData.aTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
