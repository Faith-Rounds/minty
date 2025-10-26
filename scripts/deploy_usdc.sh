#!/bin/bash

# Set your private key here or use an environment variable
SECRET_KEY=${1:-$STELLAR_SECRET_KEY}

# Check if SECRET_KEY is provided
if [ -z "$SECRET_KEY" ]; then
  echo "Error: No secret key provided. Either pass it as an argument or set the STELLAR_SECRET_KEY environment variable."
  exit 1
fi

# Use the provided public key
ADMIN_ADDRESS="GBACG2GWKRAP2YRVGJFTAX2IVUFLS74GH5WT7YDWLAOOZI6LWNVYRSIM"

echo "Using admin address: $ADMIN_ADDRESS"

# Deploy the Stellar asset contract directly
echo "Deploying Stellar asset contract..."
TOKEN_ID=$(stellar contract asset deploy \
  --asset "USDC:$ADMIN_ADDRESS" \
  --source "$SECRET_KEY" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase 'Test SDF Network ; September 2015')

echo "Stellar asset contract deployed with ID: $TOKEN_ID"

# Save the token ID to a file for future reference
echo "$TOKEN_ID" > /Users/faithrounds/CascadeProjects/minty/contracts/checkout/usdc_id.txt
echo "USDC contract ID saved to usdc_id.txt: $TOKEN_ID"
