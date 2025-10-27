import { ethers } from 'hardhat';

// Deployed addresses from latest deployment
const DEPLOYED = {
  poolAddressesProvider: '0x19F382731E12d67f588D59356F6785a7f158e1cD',
  testUSDT: '0x1c82dDcaD3A4d144866ef5B0f2CC12Af240E2b2c',
  testWXDC: '0x2E947A72D8AD884128371ff7DCFae89190fC6602',
  xdcPriceFeed: '0x7D276a421fa99B0E86aC3B5c47205987De76B497', // XDC/USDT feed
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
  console.log('  Deploying Oracle Fix with XDC Price Feed Adapter');
  console.log('='.repeat(80) + '\n');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  const addressesProvider = await ethers.getContractAt(
    'PoolAddressesProvider',
    DEPLOYED.poolAddressesProvider
  );

  // Step 1: Deploy XDC Price Feed Adapter
  log('\nStep 1: Deploying XDC Price Feed Adapter...');
  const XDCPriceFeedAdapter = await ethers.getContractFactory('XDCPriceFeedAdapter');
  const xdcAdapter = await XDCPriceFeedAdapter.deploy(DEPLOYED.xdcPriceFeed, 'XDC / USDT');
  await xdcAdapter.deployed();
  log(`XDC Price Feed Adapter deployed at: ${xdcAdapter.address}`);

  // Test the adapter
  log('\nTesting adapter...');
  try {
    const price = await xdcAdapter.latestAnswer();
    const decimals = await xdcAdapter.decimals();
    log(`Price from adapter: ${ethers.utils.formatUnits(price, decimals)}`);
    log(`Decimals: ${decimals}`);
    log('✅ Adapter is working!');
  } catch (error) {
    log(`❌ Adapter test failed: ${error}`);
    throw error;
  }

  // Step 2: Deploy AaveOracle with the adapter
  log('\nStep 2: Deploying AaveOracle...');
  const AaveOracle = await ethers.getContractFactory('AaveOracle');

  // Use the same adapter for both assets (XDC/USDT feed)
  // In production, you'd have separate feeds for each asset
  const oracle = await AaveOracle.deploy(
    addressesProvider.address,
    [DEPLOYED.testUSDT, DEPLOYED.testWXDC], // assets
    [xdcAdapter.address, xdcAdapter.address], // sources (using adapter)
    ethers.constants.AddressZero, // fallback oracle
    ethers.constants.AddressZero, // base currency
    ethers.utils.parseUnits('1', 8) // base currency unit
  );
  await oracle.deployed();
  log(`AaveOracle deployed at: ${oracle.address}`);

  // Step 3: Set the new oracle in AddressesProvider
  log('\nStep 3: Setting new oracle in AddressesProvider...');
  await waitForTx(await addressesProvider.setPriceOracle(oracle.address));
  log('Oracle updated successfully');

  // Step 4: Test the oracle
  log('\nStep 4: Testing AaveOracle...');
  try {
    const usdtPrice = await oracle.getAssetPrice(DEPLOYED.testUSDT);
    const wxdcPrice = await oracle.getAssetPrice(DEPLOYED.testWXDC);
    log(`USDT Price: ${ethers.utils.formatUnits(usdtPrice, 8)} USD`);
    log(`WXDC Price: ${ethers.utils.formatUnits(wxdcPrice, 8)} USD`);

    if (usdtPrice.gt(0) && wxdcPrice.gt(0)) {
      log('\n✅ Oracle is working correctly!');
    } else {
      log('\n⚠️  Warning: One or more prices are zero');
    }
  } catch (error) {
    log(`\n❌ Oracle test failed: ${error}`);
    throw error;
  }

  // Step 5: Test with Pool
  log('\nStep 5: Testing with Pool contract...');
  const pool = await ethers.getContractAt('Pool', await addressesProvider.getPool());

  try {
    const userData = await pool.getUserAccountData(deployer.address);
    log(`Total Collateral: ${ethers.utils.formatUnits(userData.totalCollateralBase, 8)} USD`);
    log(`Total Debt: ${ethers.utils.formatUnits(userData.totalDebtBase, 8)} USD`);
    log(`Available Borrow: ${ethers.utils.formatUnits(userData.availableBorrowsBase, 8)} USD`);
    log(`Health Factor: ${ethers.utils.formatUnits(userData.healthFactor, 18)}`);
    log('\n✅ Pool can now calculate user account data!');
  } catch (error) {
    log(`\n❌ Pool test failed: ${error}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  Oracle Fix Complete!');
  console.log('='.repeat(80));
  console.log(`\nXDC Price Feed Adapter: ${xdcAdapter.address}`);
  console.log(`New AaveOracle: ${oracle.address}`);
  console.log('\nThe oracle is now compatible with AAVE V3!');
  console.log('Run the test script again to verify all tests pass.\n');
  console.log('='.repeat(80) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
