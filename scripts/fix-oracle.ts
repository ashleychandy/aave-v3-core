import { ethers } from 'hardhat';

const DEPLOYED = {
  poolAddressesProvider: '0x0932e44AfA92137355c156513588d0712c320CA2',
  testUSDT: '0x84e2D47A110DC9db2f74Ab6510B4Bf1044e018ba',
  testWXDC: '0xa6b99397474f93C7D41bC461B6F030Bde9aB196b',
  existingPriceFeed: '0x7D276a421fa99B0E86aC3B5c47205987De76B497',
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
  console.log('  Fixing Oracle - Aligning with Chainlink Aggregator');
  console.log('='.repeat(80) + '\n');

  const [deployer] = await ethers.getSigners();
  log(`Deployer address: ${deployer.address}`);

  const addressesProvider = await ethers.getContractAt(
    'PoolAddressesProvider',
    DEPLOYED.poolAddressesProvider
  );

  // Step 1: Test existing price feed
  log('\nStep 1: Testing existing XDC/USDT price feed...');
  log(`Price feed: ${DEPLOYED.existingPriceFeed}`);

  let isCompatible = false;
  let existingPrice: any;

  try {
    const aggregator = await ethers.getContractAt(
      'AggregatorInterface',
      DEPLOYED.existingPriceFeed
    );
    existingPrice = await aggregator.latestAnswer();
    log(`✅ Chainlink-compatible! Price: ${ethers.utils.formatUnits(existingPrice, 8)}`);
    isCompatible = true;
  } catch (error) {
    log(`❌ NOT Chainlink-compatible`);
    isCompatible = false;
  }

  let usdtFeed: string;
  let wxdcFeed: string;

  if (isCompatible && existingPrice.gt(0)) {
    log('\n✅ Using existing Chainlink feed');
    usdtFeed = DEPLOYED.existingPriceFeed;
    wxdcFeed = DEPLOYED.existingPriceFeed;
  } else {
    log('\nStep 2: Deploying mock Chainlink aggregators...');
    const MockAggregator = await ethers.getContractFactory('MockAggregator');

    log('Deploying USDT aggregator ($1.00)...');
    const usdtMockAgg = await MockAggregator.deploy(ethers.utils.parseUnits('1', 8));
    await usdtMockAgg.deployed();
    usdtFeed = usdtMockAgg.address;
    log(`✅ USDT: ${usdtFeed}`);

    log('Deploying WXDC aggregator ($0.05)...');
    const wxdcMockAgg = await MockAggregator.deploy(ethers.utils.parseUnits('0.05', 8));
    await wxdcMockAgg.deployed();
    wxdcFeed = wxdcMockAgg.address;
    log(`✅ WXDC: ${wxdcFeed}`);
  }

  // Step 3: Deploy AaveOracle
  log('\nStep 3: Deploying AaveOracle...');
  const AaveOracle = await ethers.getContractFactory('AaveOracle');

  const oracle = await AaveOracle.deploy(
    addressesProvider.address,
    [DEPLOYED.testUSDT, DEPLOYED.testWXDC],
    [usdtFeed, wxdcFeed],
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    ethers.utils.parseUnits('1', 8)
  );
  await oracle.deployed();
  log(`✅ AaveOracle: ${oracle.address}`);

  // Step 4: Set oracle
  log('\nStep 4: Setting oracle in AddressesProvider...');
  await waitForTx(await addressesProvider.setPriceOracle(oracle.address));
  log('✅ Oracle updated');

  // Step 5: Verify
  log('\nStep 5: Verifying oracle...');
  const usdtPrice = await oracle.getAssetPrice(DEPLOYED.testUSDT);
  const wxdcPrice = await oracle.getAssetPrice(DEPLOYED.testWXDC);

  log(`USDT: $${ethers.utils.formatUnits(usdtPrice, 8)}`);
  log(`WXDC: $${ethers.utils.formatUnits(wxdcPrice, 8)}`);

  if (usdtPrice.gt(0) && wxdcPrice.gt(0)) {
    log('\n✅ Oracle working!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('  Oracle Fixed');
  console.log('='.repeat(80));
  console.log(`\nAaveOracle: ${oracle.address}`);
  console.log(`USDT Feed: ${usdtFeed}`);
  console.log(`WXDC Feed: ${wxdcFeed}`);

  if (!isCompatible) {
    console.log('\n⚠️  Using mock aggregators (USDT=$1, WXDC=$0.05)');
  }

  console.log('\n🎯 Run: npm run test:deployment');
  console.log('='.repeat(80) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
