#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{Env, testutils::Address as _, token};
    use types::Error;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        let usdc_address = Address::generate(&env);
        
        // Test initialization
        client.initialize(&usdc_address);
        
        // No need for assertions since initialize doesn't return anything
    }
    
    #[test]
    fn test_invoice_creation() {
        let env = Env::default();
        let merchant = Address::generate(&env);
        
        let invoice = Invoice {
            id: generate_invoice_id(&env, &merchant),
            merchant: merchant.clone(),
            amount: 1000000000, // 100 USDC
            expiry: env.ledger().timestamp() + 600,
            status: InvoiceStatus::Open,
            created_at: env.ledger().timestamp(),
            payer: None,
        };
        
        assert_eq!(invoice.status, InvoiceStatus::Open);
        assert!(invoice.amount > 0);
        assert_eq!(invoice.merchant, merchant);
        assert!(invoice.expiry > invoice.created_at);
    }

    #[test]
    fn test_invoice_status_enum() {
        assert_eq!(InvoiceStatus::Open as u32, 0);
        assert_eq!(InvoiceStatus::Paid as u32, 1);
        assert_eq!(InvoiceStatus::Refunded as u32, 2);
        assert_eq!(InvoiceStatus::Expired as u32, 3);
    }
    
    #[test]
    fn test_payment_creation() {
        let env = Env::default();
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        let invoice_id = generate_invoice_id(&env, &merchant);
        
        let payment = Payment {
            invoice_id: invoice_id.clone(),
            payer: payer.clone(),
            amount: 1000000000,
            timestamp: env.ledger().timestamp(),
        };
        
        assert_eq!(payment.invoice_id, invoice_id);
        assert_eq!(payment.payer, payer);
        assert_eq!(payment.amount, 1000000000);
    }
    
    #[test]
    fn test_generate_invoice_id() {
        let env = Env::default();
        let merchant = Address::generate(&env);
        
        let id1 = generate_invoice_id(&env, &merchant);
        // Increment ledger to ensure different timestamp/sequence
        env.ledger().with_mut(|l| {
            l.timestamp = l.timestamp + 1;
            l.sequence = l.sequence + 1;
        });
        let id2 = generate_invoice_id(&env, &merchant);
        
        // Two IDs generated for the same merchant should be different
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_create_invoice_success() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 10_000_000; // 1 USDC
        let expiry = env.ledger().timestamp() + 600; // 10 min
        
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Verify the invoice ID is a valid 32 byte value
        assert_eq!(invoice_id.len(), 32);

        // Check that an event was emitted
        let events = env.events().all();
        assert_eq!(events.len(), 1);
    }

    #[test]
    fn test_create_invoice_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 0; // Invalid
        let expiry = env.ledger().timestamp() + 600;
        
        let result = client.try_create_invoice(&merchant, &amount, &expiry);
        assert_eq!(result, Err(Ok(Error::InvalidAmount)));
    }

    #[test]
    fn test_create_invoice_expired_time() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 30; // Too soon (< 5 min)
        
        let result = client.try_create_invoice(&merchant, &amount, &expiry);
        assert_eq!(result, Err(Ok(Error::InvalidExpiry)));
    }

    #[test]
    fn test_create_invoice_far_future() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 7200; // Too far (> 60 min)
        
        let result = client.try_create_invoice(&merchant, &amount, &expiry);
        assert_eq!(result, Err(Ok(Error::InvalidExpiry)));
    }
    
    #[test]
    fn test_pay_invoice_success() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        // Register contracts
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Deploy and setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        // Initialize checkout contract with USDC address
        client.initialize(&usdc_id);
        
        // Mint USDC to payer
        usdc_client.mint(&usdc_admin, &payer, &100_000_000); // 10 USDC
        
        // Create invoice
        let amount = 10_000_000; // 1 USDC
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Pay invoice
        let result = client.pay(&invoice_id, &payer, &amount);
        assert!(result.is_ok());
        
        // Verify balances
        assert_eq!(usdc_client.balance(&merchant), 10_000_000);
        assert_eq!(usdc_client.balance(&payer), 90_000_000);
    }

    #[test]
    fn test_pay_invoice_wrong_amount() {
        let env = Env::default();
        env.mock_all_auths();
        
        // Register contracts
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Deploy and setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        
        // Initialize checkout contract with USDC address
        client.initialize(&usdc_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Try to pay wrong amount
        let wrong_amount = 5_000_000;
        let result = client.try_pay(&invoice_id, &payer, &wrong_amount);
        
        assert_eq!(result, Err(Ok(Error::AmountMismatch)));
    }

    #[test]
    fn test_pay_expired_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        // Register contracts
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Deploy and setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        
        // Initialize checkout contract with USDC address
        client.initialize(&usdc_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 300; // 5 min
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Fast-forward time past expiry
        env.ledger().with_mut(|li| {
            li.timestamp = expiry + 1;
        });
        
        let result = client.try_pay(&invoice_id, &payer, &amount);
        assert_eq!(result, Err(Ok(Error::InvoiceExpired)));
    }
    
    #[test]
    fn test_pay_nonexistent_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let payer = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Deploy and setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        client.initialize(&usdc_id);
        
        // Try to pay non-existent invoice
        let fake_invoice_id = BytesN::from_array(&env, &[0; 32]);
        let result = client.try_pay(&fake_invoice_id, &payer, &10_000_000);
        assert_eq!(result, Err(Ok(Error::InvoiceNotFound)));
    }
    
    #[test]
    fn test_pay_already_paid_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        // Register contracts
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Deploy and setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        // Initialize checkout contract with USDC address
        client.initialize(&usdc_id);
        
        // Mint USDC to payer (enough for two payments)
        usdc_client.mint(&usdc_admin, &payer, &200_000_000); 
        
        // Create invoice
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Pay invoice first time
        client.pay(&invoice_id, &payer, &amount);
        
        // Try to pay again
        let result = client.try_pay(&invoice_id, &payer, &amount);
        assert_eq!(result, Err(Ok(Error::InvoiceNotOpen)));
    }
    
    #[test]
    fn test_refund_success() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        client.initialize(&usdc_id);
        
        // Setup: Mint USDC to payer
        usdc_client.mint(&usdc_admin, &payer, &100_000_000);
        
        // Create and pay invoice
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        client.pay(&invoice_id, &payer, &amount);
        
        // Now merchant has the USDC, refund it
        let result = client.refund(&invoice_id, &merchant, &amount);
        assert!(result.is_ok());
        
        // Verify balances restored
        assert_eq!(usdc_client.balance(&payer), 100_000_000);
        assert_eq!(usdc_client.balance(&merchant), 0);
    }

    #[test]
    fn test_refund_unpaid_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        // Setup USDC token
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        client.initialize(&usdc_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Try to refund unpaid invoice
        let result = client.try_refund(&invoice_id, &merchant, &amount);
        assert_eq!(result, Err(Ok(Error::InvoiceNotOpen)));
    }

    #[test]
    fn test_refund_unauthorized() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        let attacker = Address::generate(&env);
        
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        client.initialize(&usdc_id);
        usdc_client.mint(&usdc_admin, &payer, &100_000_000);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        client.pay(&invoice_id, &payer, &amount);
        
        // Attacker tries to refund
        let result = client.try_refund(&invoice_id, &attacker, &amount);
        assert_eq!(result, Err(Ok(Error::Unauthorized)));
    }

    #[test]
    fn test_get_invoice() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Query invoice
        let invoice = client.get_invoice(&invoice_id);
        assert!(invoice.is_some());
        
        let invoice = invoice.unwrap();
        assert_eq!(invoice.merchant, merchant);
        assert_eq!(invoice.amount, amount);
        assert_eq!(invoice.status, InvoiceStatus::Open);
    }

    #[test]
    fn test_get_nonexistent_invoice() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let fake_id = BytesN::from_array(&env, &[0u8; 32]);
        let invoice = client.get_invoice(&fake_id);
        
        assert!(invoice.is_none());
    }

    #[test]
    fn test_get_payment() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        client.initialize(&usdc_id);
        usdc_client.mint(&usdc_admin, &payer, &100_000_000);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        client.pay(&invoice_id, &payer, &amount);
        
        // Query payment
        let payment = client.get_payment(&invoice_id);
        assert!(payment.is_some());
        
        let payment = payment.unwrap();
        assert_eq!(payment.payer, payer);
        assert_eq!(payment.amount, amount);
    }

    #[test]
    fn test_get_invoice_status() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        let status = client.get_invoice_status(&invoice_id);
        assert_eq!(status, Some(InvoiceStatus::Open));
    }

    #[test]
    fn test_get_status_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();
        
        let merchant = Address::generate(&env);
        let payer = Address::generate(&env);
        
        let contract_id = env.register_contract(None, CheckoutContract);
        let client = CheckoutContractClient::new(&env, &contract_id);
        
        let usdc_admin = Address::generate(&env);
        let usdc_id = env.register_stellar_asset_contract(usdc_admin.clone());
        let usdc_client = token::Client::new(&env, &usdc_id);
        
        client.initialize(&usdc_id);
        usdc_client.mint(&usdc_admin, &payer, &100_000_000);
        
        // 1. Create invoice
        let amount = 10_000_000;
        let expiry = env.ledger().timestamp() + 600;
        let invoice_id = client.create_invoice(&merchant, &amount, &expiry);
        
        // Check initial status
        let status = client.get_invoice_status(&invoice_id);
        assert_eq!(status, Some(InvoiceStatus::Open));
        
        // 2. Pay invoice
        client.pay(&invoice_id, &payer, &amount);
        
        // Check paid status
        let status = client.get_invoice_status(&invoice_id);
        assert_eq!(status, Some(InvoiceStatus::Paid));
        
        // 3. Refund invoice
        client.refund(&invoice_id, &merchant, &amount);
        
        // Check refunded status
        let status = client.get_invoice_status(&invoice_id);
        assert_eq!(status, Some(InvoiceStatus::Refunded));
    }
}
