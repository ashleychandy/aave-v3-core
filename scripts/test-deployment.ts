import { ethers } from 'hardhat';

// Deployed contract addresses from latest deployment
const DEPLOYED = {
  pool: '0x3b0cde3Ad72Bd16D145EAEe2D1106d1DC870a170',
  poolConfigurator: '0x77C4Cd790AF55f71224DEd4EA6f8ca124657ee86',
  dataProvider: '0x619400100f048D09cFa69f8ebe323B796c52B27F',
  oracle: '0x6f31cD1C38DF4C4E287d714E208F469157Bc8C4d',
  testUSDT: '0x1c82dDcaD3A4d144866ef5B0f2CC12Af240E2b2c',
  testWXDC: '0x2E947A72D8AD884128371ff7DCFae89190fC6602',
  usdtAToken: '0x924Fc5761578FA190F59EAbdd668410030395960',
  wxdcAToken: '0x39130FB7fD7f89cdb7eFaA636a8EEA8856bbD2d0',
};

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

async function waitForTx(tx: any) {
  const receipt = await tx.wait();
  return receipt;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  AAVE V3 XDC Apothem - Deployment Test');
  console.log('='.repeat(80) + '\n');

  const [deployer] = await ethers.getSigners();
  log(`Testing with address: ${deployer.address}`);

  // Load contracts
  const pool = await ethers.getContractAt('Pool', DEPLOYED.pool);
  const dataProvider = await ethers.getContractAt(
    'AaveProtocolDataProvider',
    DEPLOYED.dataProvider
  );
  const testUSDT = await ethers.getContractAt('Test_USDT', DEPLOYED.testUSDT);
  const testWXDC = await ethers.getContractAt('Test_WXDC', DEPLOYED.testWXDC);
  const usdtAToken = await ethers.getContractAt('AToken', DEPLOYED.usdtAToken);
  const wxdcAToken = await ethers.getContractAt('AToken', DEPLOYED.wxdcAToken);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Check contract deployments
  console.log('\n📋 Test 1: Verify Contract Deployments');
  try {
    const poolAddress = await pool.ADDRESSES_PROVIDER();
    logSuccess(`Pool contract is deployed and accessible`);
    testsPassed++;
  } catch (error) {
    logError(`Pool contract check failed: ${error}`);
    testsFailed++;
  }

  // Test 2: Check reserves are initialized
  console.log('\n📋 Test 2: Verify Reserves Initialization');
  try {
    const usdtReserveData = await dataProvider.getReserveData(DEPLOYED.testUSDT);
    const wxdcReserveData = await dataProvider.getReserveData(DEPLOYED.testWXDC);

    log(`USDT Liquidity Rate: ${ethers.utils.formatUnits(usdtReserveData.liquidityRate, 27)}%`);
    log(`WXDC Liquidity Rate: ${ethers.utils.formatUnits(wxdcReserveData.liquidityRate, 27)}%`);
    logSuccess('Both reserves are initialized');
    testsPassed++;
  } catch (error) {
    logError(`Reserve initialization check failed: ${error}`);
    testsFailed++;
  }

  // Test 3: Check token balances
  console.log('\n📋 Test 3: Check Token Balances');
  try {
    const usdtBalance = await testUSDT.balanceOf(deployer.address);
    const wxdcBalance = await testWXDC.balanceOf(deployer.address);

    log(`USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 6)} USDT`);
    log(`WXDC Balance: ${ethers.utils.formatUnits(wxdcBalance, 6)} WXDC`);

    if (usdtBalance.gt(0) && wxdcBalance.gt(0)) {
      logSuccess('Token balances are available');
      testsPassed++;
    } else {
      logError('Insufficient token balances');
      testsFailed++;
    }
  } catch (error) {
    logError(`Token balance check failed: ${error}`);
    testsFailed++;
  }

  // Test 4: Supply USDT
  console.log('\n📋 Test 4: Supply USDT to Pool');
  try {
    const supplyAmount = ethers.utils.parseUnits('100', 6); // 100 USDT

    log('Approving USDT...');
    await waitForTx(await testUSDT.approve(pool.address, supplyAmount));

    log('Supplying USDT to pool...');
    await waitForTx(await pool.supply(testUSDT.address, supplyAmount, deployer.address, 0));

    const aTokenBalance = await usdtAToken.balanceOf(deployer.address);
    log(`aToken Balance: ${ethers.utils.formatUnits(aTokenBalance, 6)} aXDCUSDT`);

    if (aTokenBalance.gte(supplyAmount)) {
      logSuccess('USDT supply successful');
      testsPassed++;
    } else {
      logError('USDT supply amount mismatch');
      testsFailed++;
    }
  } catch (error) {
    logError(`USDT supply failed: ${error}`);
    testsFailed++;
  }

  // Test 5: Supply WXDC
  console.log('\n📋 Test 5: Supply WXDC to Pool');
  try {
    const supplyAmount = ethers.utils.parseUnits('100', 6); // 100 WXDC

    log('Approving WXDC...');
    await waitForTx(await testWXDC.approve(pool.address, supplyAmount));

    log('Supplying WXDC to pool...');
    await waitForTx(await pool.supply(testWXDC.address, supplyAmount, deployer.address, 0));

    const aTokenBalance = await wxdcAToken.balanceOf(deployer.address);
    log(`aToken Balance: ${ethers.utils.formatUnits(aTokenBalance, 6)} aXDCWXDC`);

    if (aTokenBalance.gte(supplyAmount)) {
      logSuccess('WXDC supply successful');
      testsPassed++;
    } else {
      logError('WXDC supply amount mismatch');
      testsFailed++;
    }
  } catch (error) {
    logError(`WXDC supply failed: ${error}`);
    testsFailed++;
  }

  // Test 6: Check user account data
  console.log('\n📋 Test 6: Check User Account Data');
  try {
    const userData = await pool.getUserAccountData(deployer.address);

    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Total Debt: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Available Borrow: ${ethers.utils.formatUnits(userData.availableBorrowsBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);

    if (userData.totalCollateralBase.gt(0)) {
      logSuccess('User account data retrieved successfully');
      testsPassed++;
    } else {
      logError('No collateral found');
      testsFailed++;
    }
  } catch (error) {
    logError(`User account data check failed: ${error}`);
    testsFailed++;
  }

  // Test 7: Borrow WXDC
  console.log('\n📋 Test 7: Borrow WXDC');
  try {
    const borrowAmount = ethers.utils.parseUnits('10', 6); // 10 WXDC

    log('Borrowing WXDC...');
    await waitForTx(await pool.borrow(testWXDC.address, borrowAmount, 2, 0, deployer.address)); // Variable rate

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Debt after borrow: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);

    if (userData.totalDebtBase.gt(0)) {
      logSuccess('WXDC borrow successful');
      testsPassed++;
    } else {
      logError('Borrow did not create debt');
      testsFailed++;
    }
  } catch (error) {
    logError(`WXDC borrow failed: ${error}`);
    testsFailed++;
  }

  // Test 8: Repay WXDC
  console.log('\n📋 Test 8: Repay WXDC');
  try {
    const repayAmount = ethers.utils.parseUnits('5', 6); // 5 WXDC

    log('Approving WXDC for repayment...');
    await waitForTx(await testWXDC.approve(pool.address, repayAmount));

    log('Repaying WXDC...');
    await waitForTx(await pool.repay(testWXDC.address, repayAmount, 2, deployer.address));

    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Debt after repay: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);

    logSuccess('WXDC repay successful');
    testsPassed++;
  } catch (error) {
    logError(`WXDC repay failed: ${error}`);
    testsFailed++;
  }

  // Test 9: Withdraw USDT
  console.log('\n📋 Test 9: Withdraw USDT');
  try {
    const withdrawAmount = ethers.utils.parseUnits('50', 6); // 50 USDT

    log('Withdrawing USDT...');
    await waitForTx(await pool.withdraw(testUSDT.address, withdrawAmount, deployer.address));

    const userData = await pool.getUserAccountData(deployer.address);
    log(
      `Total Collateral after withdraw: ${ethers.utils.formatUnits(
        userData.totalCollateralBase,
        8
      )} USD`
    );
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);

    logSuccess('USDT withdraw successful');
    testsPassed++;
  } catch (error) {
    logError(`USDT withdraw failed: ${error}`);
    testsFailed++;
  }

  // Test 10: Check reserve configuration
  console.log('\n📋 Test 10: Verify Reserve Configuration');
  try {
    const usdtConfig = await dataProvider.getReserveConfigurationData(DEPLOYED.testUSDT);
    const wxdcConfig = await dataProvider.getReserveConfigurationData(DEPLOYED.testWXDC);

    log('USDT Configuration:');
    log(`  LTV: ${usdtConfig.ltv / 100}%`);
    log(`  Liquidation Threshold: ${usdtConfig.liquidationThreshold / 100}%`);
    log(`  Liquidation Bonus: ${usdtConfig.liquidationBonus / 100}%`);
    log(`  Borrowing Enabled: ${usdtConfig.borrowingEnabled}`);

    log('WXDC Configuration:');
    log(`  LTV: ${wxdcConfig.ltv / 100}%`);
    log(`  Liquidation Threshold: ${wxdcConfig.liquidationThreshold / 100}%`);
    log(`  Liquidation Bonus: ${wxdcConfig.liquidationBonus / 100}%`);
    log(`  Borrowing Enabled: ${wxdcConfig.borrowingEnabled}`);

    if (usdtConfig.borrowingEnabled && wxdcConfig.borrowingEnabled) {
      logSuccess('Reserve configurations are correct');
      testsPassed++;
    } else {
      logError('Reserve configurations are incorrect');
      testsFailed++;
    }
  } catch (error) {
    logError(`Reserve configuration check failed: ${error}`);
    testsFailed++;
  }

  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log('  Test Summary');
  console.log('='.repeat(80));
  console.log(`\n✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(
    `📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`
  );

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! AAVE V3 deployment is fully functional on XDC Apothem!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
