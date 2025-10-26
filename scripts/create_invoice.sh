#!/bin/bash

# Set your private key here or use an environment variable
SECRET_KEY=${1:-$STELLAR_SECRET_KEY}
MERCHANT_ADDRESS=${2:-"GBACG2GWKRAP2YRVGJFTAX2IVUFLS74GH5WT7YDWLAOOZI6LWNVYRSIM"}
AMOUNT=${3:-1000000} # 1 USDC (7 decimals)

# Current time + 10 minutes (600 seconds) for expiry
EXPIRY=$(date -u -v+10M +%s)

# Check if SECRET_KEY is provided
if [ -z "$SECRET_KEY" ]; then
  echo "Error: No secret key provided. Either pass it as an argument or set the STELLAR_SECRET_KEY environment variable."
  exit 1
fi

# Read the checkout contract ID from the file
CHECKOUT_CONTRACT_ID=$(cat /Users/faithrounds/CascadeProjects/minty/contracts/checkout/contract_id.txt)

# Check if contract ID is available
if [ -z "$CHECKOUT_CONTRACT_ID" ]; then
  echo "Error: Checkout contract ID not found. Please deploy the contract first."
  exit 1
fi

# Create an invoice
echo "Creating invoice with merchant: $MERCHANT_ADDRESS, amount: $AMOUNT, expiry: $EXPIRY"
INVOICE_ID=$(stellar contract invoke \
  --id "$CHECKOUT_CONTRACT_ID" \
  --source-account "$SECRET_KEY" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase 'Test SDF Network ; September 2015' \
  -- \
  create_invoice \
  --merchant "$MERCHANT_ADDRESS" \
  --amount "$AMOUNT" \
  --expiry "$EXPIRY" \
  --auth "$MERCHANT_ADDRESS")

# Check if invoice creation was successful
if [ $? -eq 0 ]; then
  echo "Invoice created successfully with ID: $INVOICE_ID"
  # Save the invoice ID to a file for future reference
  echo "$INVOICE_ID" > /Users/faithrounds/CascadeProjects/minty/contracts/checkout/latest_invoice_id.txt
else
  echo "Failed to create invoice"
  exit 1
fi
