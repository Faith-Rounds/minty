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

[Link to demo video](https://drive.google.com/drive/folders/1byi8zZ2oFsokd2n9Q64dDf2WTO7YkbQ-?usp=share_link)

## Presentation

[Link to Canva Slides](https://www.canva.com/design/DAG25rnvL5c/uGiCFOr9sPEmcBZ5XqPySw/edit?utm_content=DAG25rnvL5c&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) 

## Screenshots

<img width="1285" height="919" alt="Screenshot 2025-10-26 at 11 54 31 AM" src="https://github.com/user-attachments/assets/c8da2792-49c3-4c1a-a4e8-ce87ed5e18d2" />
<img width="1287" height="924" alt="Screenshot 2025-10-26 at 11 54 39 AM" src="https://github.com/user-attachments/assets/03559052-4cda-4285-b35f-85a9473026b0" />
<img width="1266" height="755" alt="Screenshot 2025-10-26 at 11 54 47 AM" src="https://github.com/user-attachments/assets/a5a5bc9c-ace4-4ca6-a524-f5eb638bd078" />
<img width="1290" height="777" alt="Screenshot 2025-10-26 at 11 54 53 AM" src="https://github.com/user-attachments/assets/3767f45c-2879-415d-b5a6-517d64e33e7a" />
<img width="1278" height="713" alt="Screenshot 2025-10-26 at 11 55 03 AM" src="https://github.com/user-attachments/assets/6596690d-2bc7-4483-b2d2-532f23046617" />


## Smart Contract Overview

[Link to Smart Contract](https://stellar.expert/explorer/testnet/contract/CA4K7TEDFHTAGPIH7ZPNGECH6QKQWNTLEKNPHPJYORXIOM6IM2V2BM6Y)

Minty's smart contract architecture enables secure and efficient USDC payments:

- **Invoice Generation**: Merchants create invoices with unique IDs, amounts, and expiration timestamps
- **Payment Processing**: Users pay invoices by transferring USDC to the contract, which validates and records payments
- **Settlement**: Funds are automatically settled to the merchant when payment is confirmed
- **Refund Capability**: Merchants can issue refunds if necessary
- **Status Tracking**: All invoices maintain their current status (Open, Paid, Expired, or Refunded)
