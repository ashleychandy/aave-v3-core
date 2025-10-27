# Implementation Plan

- [ ] 1. Configure Hardhat for XDC Apothem network
  - Add XDC Apothem network configuration to hardhat.config.ts with RPC URL, chain ID, and account configuration
  - Extend helper-hardhat-config.ts to include XDC network types and RPC URL mappings
  - Update helpers/types.ts to include XDC network enum values
  - Create .env.example file documenting required environment variables (XDC_PRIVATE_KEY)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Prepare test token contracts for deployment
  - Verify Test_USDT.sol and Test_WXDC.sol compile with the project's Solidity version
  - Update test token contracts to use compatible OpenZeppelin imports from the dependencies folder
  - Add test token compilation to Hardhat configuration if needed
  - _Requirements: 2.2, 4.1, 4.2_

- [ ] 3. Create XDC market configuration
  - Create markets/xdc directory structure
  - Create markets/xdc/index.ts with reserve configurations for USDT and WXDC
  - Define interest rate strategy parameters for each asset
  - Configure LTV, liquidation thresholds, and liquidation bonuses
  - Set reserve factors and borrowing/collateral flags
  - _Requirements: 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

- [ ] 4. Create oracle configuration for XDC assets
  - Create markets/xdc/oracle.ts with price feed configurations
  - Map existing XDC/USDT price feed address (0x7D276a421fa99B0E86aC3B5c47205987De76B497) to USDT and WXDC assets
  - Define oracle decimals (8 decimals for Chainlink-compatible feeds)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Create main deployment script
  - Create scripts/deploy-xdc-apothem.ts as the main deployment orchestrator
  - Implement test token deployment logic (Test_USDT and Test_WXDC)
  - Add logic to mint initial token supply to deployer
  - Integrate @aave/deploy-v3 deployment functions for core contracts
  - Implement deployment state tracking and recovery mechanisms
  - Add transaction confirmation waiting with appropriate timeouts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.4_

- [ ] 6. Implement oracle deployment and configuration
  - Add AaveOracle deployment to deployment script
  - Configure existing price feed (0x7D276a421fa99B0E86aC3B5c47205987De76B497) as source for USDT and WXDC
  - Verify oracle can read prices from the existing feed
  - Test price retrieval for both assets
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement reserve initialization
  - Add reserve initialization logic for USDT in deployment script
  - Add reserve initialization logic for WXDC in deployment script
  - Configure interest rate strategies for each reserve
  - Enable borrowing and collateral usage for configured assets
  - Set reserve parameters (LTV, liquidation threshold, etc.)
  - _Requirements: 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

- [ ] 8. Implement access control configuration
  - Deploy ACLManager contract
  - Configure admin roles for pool operations
  - Set emergency admin if needed
  - Verify access control permissions
  - _Requirements: 5.4_

- [ ] 9. Create deployment output and documentation
  - Implement deployment summary generation with all contract addresses
  - Save deployment artifacts to deployments/xdc-apothem directory
  - Create JSON output file with deployment addresses and configuration
  - Generate deployment report with transaction hashes and gas usage
  - _Requirements: 6.2, 6.3_

- [ ] 10. Add error handling and validation
  - Add environment variable validation at script start
  - Implement retry logic for network connection issues
  - Add gas estimation with buffer for transaction failures
  - Implement deployment state persistence for recovery
  - Add clear error messages with resolution steps
  - _Requirements: 6.4_

- [ ] 11. Create deployment documentation
  - Create README.md in deployments/xdc-apothem with deployment instructions
  - Document all deployed contract addresses
  - Add instructions for contract verification on XDC block explorer
  - Include post-deployment testing instructions
  - Document environment variable requirements
  - _Requirements: 6.5_

- [ ]* 12. Create post-deployment verification script
  - Create scripts/verify-xdc-deployment.ts to verify deployment
  - Add checks for contract deployment at expected addresses
  - Verify contract initialization states
  - Test basic pool operations (supply, borrow, repay, withdraw)
  - Validate oracle price feed functionality
  - _Requirements: 2.5, 3.4_
