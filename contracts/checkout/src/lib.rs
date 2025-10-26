#![no_std]

mod types;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, BytesN, Vec};
use types::{Invoice, Payment, InvoiceStatus, DataKey, generate_invoice_id, Error};

#[contract]
pub struct CheckoutContract;

#[contractimpl]
impl CheckoutContract {
    /// Initialize the contract with the USDC token address
    /// 
    /// # Arguments
    /// * `usdc_address` - Address of the USDC token contract
    pub fn initialize(env: Env, usdc_address: Address) {
        env.storage()
            .instance()
            .set(&symbol_short!("USDC"), &usdc_address);
    }
    
    /// Creates a new invoice for payment
    /// 
    /// # Arguments
    /// * `merchant` - The merchant's address (must authorize this call)
    /// * `amount` - Amount in USDC stroops (7 decimals)
    /// * `expiry` - Unix timestamp when invoice expires
    /// 
    /// # Returns
    /// * Invoice ID (BytesN<32>)
    pub fn create_invoice(
        env: Env,
        merchant: Address,
        amount: i128,
        expiry: u64,
    ) -> Result<BytesN<32>, Error> {
        // 1. Require merchant authorization
        merchant.require_auth();
        
        // 2. Validate amount
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        
        // 3. Validate expiry (must be 5-60 minutes in future)
        let current_time = env.ledger().timestamp();
        let min_expiry = current_time + 300;  // 5 minutes
        let max_expiry = current_time + 3600; // 60 minutes
        
        if expiry < min_expiry || expiry > max_expiry {
            return Err(Error::InvalidExpiry);
        }
        
        // 4. Generate unique invoice ID
        let invoice_id = generate_invoice_id(&env, &merchant);
        
        // 5. Create invoice
        let invoice = Invoice {
            id: invoice_id.clone(),
            merchant: merchant.clone(),
            amount,
            expiry,
            status: InvoiceStatus::Open,
            created_at: current_time,
            payer: None,
        };
        
        // 6. Store in persistent storage
        env.storage()
            .persistent()
            .set(&DataKey::Invoice(invoice_id.clone()), &invoice);
        
        // 7. Emit event
        env.events().publish(
            (symbol_short!("created"), merchant.clone()),
            (invoice_id.clone(), amount, expiry),
        );
        
        Ok(invoice_id)
    }
    
    /// Pay an invoice with USDC
    /// 
    /// # Arguments
    /// * `invoice_id` - The invoice to pay
    /// * `payer` - The payer's address (must authorize)
    /// * `amount` - Amount in USDC stroops (must match invoice exactly)
    /// 
    /// # Returns
    /// * Ok(()) on success
    pub fn pay(
        env: Env,
        invoice_id: BytesN<32>,
        payer: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // 1. Require payer authorization
        payer.require_auth();
        
        // 2. Load invoice
        let mut invoice: Invoice = env
            .storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id.clone()))
            .ok_or(Error::InvoiceNotFound)?;
        
        // 3. Check status
        if invoice.status != InvoiceStatus::Open {
            return Err(Error::InvoiceNotOpen);
        }
        
        // 4. Check expiry
        let current_time = env.ledger().timestamp();
        if current_time > invoice.expiry {
            // Auto-expire
            invoice.status = InvoiceStatus::Expired;
            env.storage()
                .persistent()
                .set(&DataKey::Invoice(invoice_id.clone()), &invoice);
            return Err(Error::InvoiceExpired);
        }
        
        // 5. Validate exact amount
        if amount != invoice.amount {
            return Err(Error::AmountMismatch);
        }
        
        // 6. Transfer USDC from payer to merchant
        let usdc_address = get_usdc_address(&env);
        let token_client = token::Client::new(&env, &usdc_address);
        
        token_client.transfer(
            &payer,
            &invoice.merchant,
            &amount,
        );
        
        // 7. Update invoice status
        invoice.status = InvoiceStatus::Paid;
        invoice.payer = Some(payer.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Invoice(invoice_id.clone()), &invoice);
        
        // 8. Create payment record
        let payment = Payment {
            invoice_id: invoice_id.clone(),
            payer: payer.clone(),
            amount,
            timestamp: current_time,
        };
        
        env.storage()
            .persistent()
            .set(&DataKey::Payment(invoice_id.clone()), &payment);
        
        // 9. Emit event
        env.events().publish(
            (symbol_short!("paid"), invoice.merchant.clone()),
            (invoice_id, payer, amount),
        );
        
        Ok(())
    }
    
    /// Refund a paid invoice
    /// 
    /// # Arguments
    /// * `invoice_id` - The invoice to refund
    /// * `merchant` - The merchant's address (must authorize and match invoice)
    /// * `amount` - Refund amount (must equal payment amount for full refund)
    /// 
    /// # Returns
    /// * Ok(()) on success
    pub fn refund(
        env: Env,
        invoice_id: BytesN<32>,
        merchant: Address,
        amount: i128,
    ) -> Result<(), Error> {
        // 1. Require merchant authorization
        merchant.require_auth();
        
        // 2. Load invoice
        let mut invoice: Invoice = env
            .storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id.clone()))
            .ok_or(Error::InvoiceNotFound)?;
        
        // 3. Verify merchant is invoice creator
        if invoice.merchant != merchant {
            return Err(Error::Unauthorized);
        }
        
        // 4. Check status (must be Paid)
        if invoice.status != InvoiceStatus::Paid {
            return Err(Error::InvoiceNotOpen);
        }
        
        // 5. Get payment to find payer
        let payment: Payment = env
            .storage()
            .persistent()
            .get(&DataKey::Payment(invoice_id.clone()))
            .ok_or(Error::InvoiceNotFound)?;
        
        // 6. Validate refund amount (must be full refund)
        if amount != payment.amount {
            return Err(Error::AmountMismatch);
        }
        
        // 7. Transfer USDC from merchant back to payer
        let usdc_address = get_usdc_address(&env);
        let token_client = token::Client::new(&env, &usdc_address);
        
        token_client.transfer(
            &merchant,
            &payment.payer,
            &amount,
        );
        
        // 8. Update invoice status
        invoice.status = InvoiceStatus::Refunded;
        env.storage()
            .persistent()
            .set(&DataKey::Invoice(invoice_id.clone()), &invoice);
        
        // 9. Emit event
        env.events().publish(
            (symbol_short!("refunded"), merchant.clone()),
            (invoice_id, payment.payer.clone(), amount),
        );
        
        Ok(())
    }
    
    /// Get full invoice details
    /// 
    /// # Arguments
    /// * `invoice_id` - The invoice ID to query
    /// 
    /// # Returns
    /// * Option<Invoice> - Invoice data or None if not found
    pub fn get_invoice(
        env: Env,
        invoice_id: BytesN<32>,
    ) -> Option<Invoice> {
        env.storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id))
    }
    
    /// Get payment details for an invoice
    /// 
    /// # Arguments
    /// * `invoice_id` - The invoice ID to query
    /// 
    /// # Returns
    /// * Option<Payment> - Payment data or None if not found
    pub fn get_payment(
        env: Env,
        invoice_id: BytesN<32>,
    ) -> Option<Payment> {
        env.storage()
            .persistent()
            .get(&DataKey::Payment(invoice_id))
    }
    
    /// Get just the invoice status (convenience function)
    /// 
    /// # Arguments
    /// * `invoice_id` - The invoice ID to query
    /// 
    /// # Returns
    /// * Option<InvoiceStatus> - Status or None if not found
    pub fn get_invoice_status(
        env: Env,
        invoice_id: BytesN<32>,
    ) -> Option<InvoiceStatus> {
        let invoice: Option<Invoice> = env.storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id));
        
        invoice.map(|inv| inv.status)
    }
}

/// Helper to get USDC contract address from storage
fn get_usdc_address(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&symbol_short!("USDC"))
        .unwrap()
}

#[cfg(test)]
mod test;
