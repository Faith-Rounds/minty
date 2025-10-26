# Minty: Soroban USDC Payment Processing

> **Summary**: Minty enables frictionless USDC payments on Stellar with automated settlements, real-time tracking, and low fees for merchants and customers.

## About Minty

Minty revolutionizes cryptocurrency payments by solving key merchant adoption challenges. Traditional payment processors charge 2-3% fees and delay settlements for days, while early crypto payment systems suffer from volatility and poor user experiences. Minty leverages Stellar's speed and efficiency to provide instant settlements with minimal fees.

Built on Stellar's Soroban smart contracts, Minty enables merchants to create invoices denominated in stable currencies (USDC), generate QR codes for customers, and receive funds instantly after payment. The platform offers real-time payment status tracking, automated settlements to merchant wallets, and even supports refund capabilities, all while maintaining the security and transparency of blockchain technology.

## Technical Implementation

Minty utilizes the Soroban SDK to create and deploy smart contracts on the Stellar network. We leverage Stellar's native asset functionality to handle USDC tokens securely through the Token Interface standard. The project employs Rust for robust, memory-safe contract development and TypeScript with React for the frontend interface.

Stellar's unique features, like fast transaction finality (3-5 seconds) and minimal fees, make this solution ideal for payment processing. The Soroban VM provides deterministic execution, preventing unexpected behavior in financial transactions. Our implementation uses Freighter wallet integration for seamless customer payments, while the contract handles invoice generation, payment verification, settlement automation, and event-based notifications—features uniquely enabled by Soroban's advanced smart contract capabilities.

## Live Demo URL

**Demo URL**: [https://minty-tau.vercel.app](https://minty-tau.vercel.app)

## Demo Video

[Link to demo video - add your Loom or YouTube link here]

## Presentation

[Link to Canva Slides](https://www.canva.com/design/DAG25rnvL5c/uGiCFOr9sPEmcBZ5XqPySw/edit?utm_content=DAG25rnvL5c&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) 

## Screenshots

![Dashboard Screenshot - Add your screenshot here]()
![Payment Flow Screenshot - Add your screenshot here]()

## Smart Contract Overview

[Link to Smart Contract](https://stellar.expert/explorer/testnet/contract/CA4K7TEDFHTAGPIH7ZPNGECH6QKQWNTLEKNPHPJYORXIOM6IM2V2BM6Y)

Minty's smart contract architecture enables secure and efficient USDC payments:

- **Invoice Generation**: Merchants create invoices with unique IDs, amounts, and expiration timestamps
- **Payment Processing**: Users pay invoices by transferring USDC to the contract, which validates and records payments
- **Settlement**: Funds are automatically settled to the merchant when payment is confirmed
- **Refund Capability**: Merchants can issue refunds if necessary
- **Status Tracking**: All invoices maintain their current status (Open, Paid, Expired, or Refunded)
