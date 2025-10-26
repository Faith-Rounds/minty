#!/bin/bash

# Set your private key here or use an environment variable
SECRET_KEY=${1:-$STELLAR_SECRET_KEY}
USDC_CONTRACT_ID=${2:-$USDC_CONTRACT_ID}

# Check if SECRET_KEY is provided
if [ -z "$SECRET_KEY" ]; then
  echo "Error: No secret key provided. Either pass it as an argument or set the STELLAR_SECRET_KEY environment variable."
  exit 1
fi

# Check if USDC_CONTRACT_ID is provided
if [ -z "$USDC_CONTRACT_ID" ]; then
  echo "Error: No USDC contract ID provided. Either pass it as the second argument or set the USDC_CONTRACT_ID environment variable."
  exit 1
fi

# Read the checkout contract ID from the file
CHECKOUT_CONTRACT_ID=$(cat /Users/faithrounds/CascadeProjects/minty/contracts/checkout/contract_id.txt)

# Check if contract ID is available
if [ -z "$CHECKOUT_CONTRACT_ID" ]; then
  echo "Error: Checkout contract ID not found. Please deploy the contract first."
  exit 1
fi

# Initialize the contract with USDC token address
echo "Initializing checkout contract..."
RESULT=$(stellar contract invoke \
  --id "$CHECKOUT_CONTRACT_ID" \
  --source-account "$SECRET_KEY" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase 'Test SDF Network ; September 2015' \
  -- \
  initialize \
  --usdc_address "$USDC_CONTRACT_ID")

# Check if initialization was successful
if [ $? -eq 0 ]; then
  echo "Checkout contract initialized successfully"
  echo "Result: $RESULT"
else
  echo "Failed to initialize checkout contract"
  exit 1
fi
