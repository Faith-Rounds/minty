# Minty: Soroban USDC Payment Processing

A Stellar Soroban project for handling USDC payments on the Stellar network.

## Project Structure

```
minty/
├── contracts/
│   └── checkout/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── types.rs
│       │   └── test.rs
│       └── Cargo.toml
├── scripts/
│   └── setup_token.sh
├── .env
└── README.md
```

## Prerequisites

- Rust toolchain (1.70+)
- Soroban CLI (23.0.0+)

## Installation

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Add WebAssembly target:
```bash
rustup target add wasm32-unknown-unknown
```

3. Install Soroban CLI:
```bash
cargo install --locked soroban-cli
```

4. Configure Soroban for testnet:
```bash
soroban network add --global testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015"
```

## Setup

1. Update the `.env` file with your Stellar account keys:
```
# Admin Keys (for deployment and faucet)
ADMIN_SECRET_KEY="S..." # Your secret key here
ADMIN_PUBLIC_KEY="G..." # Your public key here
```

2. Make sure your testnet account is funded:
   - Visit the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
   - Or use the [Friendbot](https://friendbot.stellar.org/)

3. Deploy the USDC token contract:
```bash
./scripts/setup_token.sh
```

This script will:
- Download the Soroban token contract WASM
- Deploy the token contract to testnet
- Initialize it with name "USDC (Testnet)", symbol "USDC", and 7 decimals
- Mint 1,000,000 USDC to the admin account
- Save the contract ID to the .env file

## Verification

1. Check token balance:
```bash
soroban contract invoke \
  --id $(grep USDC_CONTRACT_ID .env | cut -d'"' -f2) \
  --source $ADMIN_SECRET_KEY \
  --network testnet \
  -- \
  balance \
  --id $ADMIN_PUBLIC_KEY
```

2. Verify the contract on StellarExpert:
```
https://testnet.stellarexpert.io/contract/[YOUR_CONTRACT_ID]
```

## Development

To build the checkout contract:

```bash
cd contracts/checkout
cargo build --target wasm32-unknown-unknown --release
```

## Testing

```bash
cd contracts/checkout
cargo test
```

## License

MIT
