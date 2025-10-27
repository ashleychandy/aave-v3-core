#!/bin/bash

# AAVE V3 XDC Apothem Deployment Script
# This script deploys the entire AAVE V3 protocol to XDC Network Apothem

echo "========================================="
echo "AAVE V3 XDC Apothem Deployment"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your XDC_PRIVATE_KEY"
    echo "You can copy .env.example and fill in your details"
    exit 1
fi

# Source the .env file
source .env

# Check if private key is set
if [ -z "$XDC_PRIVATE_KEY" ]; then
    echo "Error: XDC_PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "Environment configured successfully"
echo "RPC: ${XDC_RPC:-https://erpc.apothem.network}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: npm install failed"
        exit 1
    fi
fi

# Compile contracts
echo ""
echo "Compiling contracts..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "Error: Contract compilation failed"
    exit 1
fi

# Run deployment
echo ""
echo "Starting deployment to XDC Apothem..."
echo "This may take 10-15 minutes..."
echo ""

npx hardhat run scripts/deploy-xdc-apothem.ts --network xdcApothem

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Deployment completed successfully!"
    echo "========================================="
    echo ""
    echo "Contract addresses saved to:"
    echo "  - deployments/xdc-apothem/addresses.json"
    echo "  - deployments/xdc-apothem/deployed.env"
    echo ""
    echo "You can now interact with the AAVE V3 protocol on XDC Apothem!"
else
    echo ""
    echo "========================================="
    echo "Deployment failed!"
    echo "========================================="
    echo "Please check the error messages above"
    exit 1
fi
