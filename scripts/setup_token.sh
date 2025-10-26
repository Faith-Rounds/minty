#!/bin/bash
set -e

# Load environment variables
source .env

# Check if admin keys are set
if [[ "$ADMIN_SECRET_KEY" == "S..." ]]; then
  echo "Error: You must set ADMIN_SECRET_KEY in .env file"
  exit 1
fi

if [[ "$ADMIN_PUBLIC_KEY" == "G..." ]]; then
  echo "Error: You must set ADMIN_PUBLIC_KEY in .env file"
  exit 1
fi

# Download standard token contract WASM
echo "Downloading token contract WASM..."
curl -sSL -o soroban_token_contract.wasm https://github.com/stellar/soroban-examples/raw/main/token/target/wasm32-unknown-unknown/release/soroban_token_contract.wasm

# Deploy token contract
echo "Deploying token contract..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm soroban_token_contract.wasm \
  --source $ADMIN_SECRET_KEY \
  --network testnet)

echo "USDC Token Contract ID: $CONTRACT_ID"

# Initialize token
echo "Initializing token..."
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $ADMIN_SECRET_KEY \
  --network testnet \
  -- \
  initialize \
  --admin $ADMIN_PUBLIC_KEY \
  --decimal 7 \
  --name "USDC (Testnet)" \
  --symbol "USDC"

# Mint tokens (1M USDC = 10000000 * 10^7 stroops)
echo "Minting 1,000,000 USDC to admin account..."
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $ADMIN_SECRET_KEY \
  --network testnet \
  -- \
  mint \
  --to $ADMIN_PUBLIC_KEY \
  --amount "10000000000000"

# Check balance
echo "Checking balance..."
BALANCE=$(soroban contract invoke \
  --id $CONTRACT_ID \
  --source $ADMIN_SECRET_KEY \
  --network testnet \
  -- \
  balance \
  --id $ADMIN_PUBLIC_KEY)

echo "Admin balance: $BALANCE (expected 10000000000000)"

# Update .env file with contract ID
if grep -q "USDC_CONTRACT_ID=\"\"" .env; then
  # Replace empty contract ID
  sed -i '' "s/USDC_CONTRACT_ID=\"\"/USDC_CONTRACT_ID=\"$CONTRACT_ID\"/" .env
else
  # Append contract ID if not found
  echo "USDC_CONTRACT_ID=\"$CONTRACT_ID\"" >> .env
fi

echo "Setup complete! USDC contract ID saved to .env file."
