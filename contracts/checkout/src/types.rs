use soroban_sdk::{contracterror, contracttype, Address, BytesN, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    UnauthorizedAccess = 3,
    InvoiceNotFound = 4,
    InvalidAmount = 5,
    InvoiceExpired = 6,
    InvoiceAlreadyPaid = 7,
    InvalidExpiry = 8,
    InvoiceNotOpen = 9,
    AmountMismatch = 10,
    Unauthorized = 11,
}

/// Invoice represents a payment request from a merchant
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Invoice {
    /// Unique identifier for the invoice
    pub id: BytesN<32>,
    /// Address of the merchant requesting payment
    pub merchant: Address,
    /// Amount in USDC stroops (7 decimals)
    pub amount: i128,
    /// Unix timestamp when the invoice expires
    pub expiry: u64,
    /// Current status of the invoice
    pub status: InvoiceStatus,
    /// Unix timestamp when the invoice was created
    pub created_at: u64,
    /// Address of the payer (set after payment)
    pub payer: Option<Address>,
}

/// Payment represents a completed payment for an invoice
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Payment {
    /// ID of the invoice being paid
    pub invoice_id: BytesN<32>,
    /// Address of the account that made the payment
    pub payer: Address,
    /// Amount paid in USDC stroops
    pub amount: i128,
    /// Unix timestamp when the payment was made
    pub timestamp: u64,
}

/// Status of an invoice in the system
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
#[repr(u32)]
pub enum InvoiceStatus {
    /// Invoice is open and awaiting payment
    Open = 0,
    /// Invoice has been paid
    Paid = 1,
    /// Invoice has been refunded
    Refunded = 2,
    /// Invoice has expired without payment
    Expired = 3,
}

/// Keys for contract data storage
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Maps invoice_id -> Invoice
    Invoice(BytesN<32>),
    /// Maps invoice_id -> Payment
    Payment(BytesN<32>),
    /// Global counter for generating invoice IDs
    InvoiceCounter,
}

/// Generates a unique invoice ID based on merchant address and current ledger info
/// 
/// # Arguments
/// * `env` - The Soroban environment
/// * `merchant` - The merchant address
/// 
/// # Returns
/// A unique 32-byte invoice ID
pub fn generate_invoice_id(env: &Env, merchant: &Address) -> BytesN<32> {
    let timestamp = env.ledger().timestamp();
    let sequence = env.ledger().sequence();
    
    // Convert relevant data to bytes
    let merchant_bytes = merchant.to_xdr(env);
    
    // Create a buffer to hash
    let mut buffer = Vec::new(env);
    buffer.push_back(merchant_bytes);
    buffer.push_back(env.ledger().timestamp().to_be_bytes().as_slice());
    buffer.push_back(env.ledger().sequence().to_be_bytes().as_slice());
    
    // Hash the data to create a unique ID
    env.crypto().sha256(&buffer)
}
