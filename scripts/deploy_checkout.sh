#!/bin/bash

# Set your private key here or use an environment variable
SECRET_KEY=${1:-$STELLAR_SECRET_KEY}

# Check if SECRET_KEY is provided
if [ -z "$SECRET_KEY" ]; then
  echo "Error: No secret key provided. Either pass it as an argument or set the STELLAR_SECRET_KEY environment variable."
  exit 1
fi

# Deploy the checkout contract
echo "Deploying checkout contract..."
CHECKOUT_CONTRACT_ID=$(stellar contract deploy \
  --wasm /Users/faithrounds/CascadeProjects/minty/contracts/checkout/target/wasm32v1-none/release/checkout_contract.wasm \
  --source-account "$SECRET_KEY" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase 'Test SDF Network ; September 2015')

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "Checkout contract deployed successfully with ID: $CHECKOUT_CONTRACT_ID"
  
  # Save the contract ID to a file for future reference
  echo "$CHECKOUT_CONTRACT_ID" > /Users/faithrounds/CascadeProjects/minty/contracts/checkout/contract_id.txt
  echo "Contract ID saved to contract_id.txt"
else
  echo "Failed to deploy checkout contract"
  exit 1
fi
