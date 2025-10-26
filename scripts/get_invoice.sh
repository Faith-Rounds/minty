#!/bin/bash

# Set your private key here or use an environment variable
SECRET_KEY=${1:-$STELLAR_SECRET_KEY}
INVOICE_ID=${2:-$(cat /Users/faithrounds/CascadeProjects/minty/contracts/checkout/latest_invoice_id.txt)}

# Check if SECRET_KEY is provided
if [ -z "$SECRET_KEY" ]; then
  echo "Error: No secret key provided. Either pass it as an argument or set the STELLAR_SECRET_KEY environment variable."
  exit 1
fi

# Check if INVOICE_ID is provided
if [ -z "$INVOICE_ID" ]; then
  echo "Error: No invoice ID provided. Either pass it as the second argument or create an invoice first."
  exit 1
fi

# Read the checkout contract ID from the file
CHECKOUT_CONTRACT_ID=$(cat /Users/faithrounds/CascadeProjects/minty/contracts/checkout/contract_id.txt)

# Check if contract ID is available
if [ -z "$CHECKOUT_CONTRACT_ID" ]; then
  echo "Error: Checkout contract ID not found. Please deploy the contract first."
  exit 1
fi

# Get invoice details
echo "Getting invoice details for ID: $INVOICE_ID"
INVOICE=$(stellar contract invoke \
  --id "$CHECKOUT_CONTRACT_ID" \
  --source-account "$SECRET_KEY" \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase 'Test SDF Network ; September 2015' \
  -- \
  get_invoice \
  --invoice_id "$INVOICE_ID")

# Check if the operation was successful
if [ $? -eq 0 ]; then
  echo "Invoice details:"
  echo "$INVOICE"
else
  echo "Failed to get invoice details"
  exit 1
fi
