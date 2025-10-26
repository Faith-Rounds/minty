// Contract service for interacting with checkout smart contract

const CHECKOUT_CONTRACT_ID = import.meta.env.VITE_CHECKOUT_CONTRACT_ID;
const USDC_CONTRACT_ID = import.meta.env.VITE_USDC_CONTRACT_ID;

// Simplified mock version of the contract service for demo purposes
export class ContractService {
  // Keep track of invoice status for simulation
  private static invoiceStatuses: Record<string, { 
    status: 'open' | 'paid' | 'refunded' | 'expired',
    payer?: string,
    simulatePaymentAfter?: number,
    txHash?: string
  }> = {};
  
  // Mock balances for demo purposes
  private static userBalances: Record<string, number> = {};
  
  static async createInvoice(
    merchantAddress: string,
    amountUSDC: number, // in stroops
    expiryMinutes: number = 10
  ): Promise<string> {
    try {
      console.log('Creating invoice with:', {
        merchantAddress,
        amountUSDC,
        expiryMinutes,
        contractId: CHECKOUT_CONTRACT_ID
      });
      
      // For demo, generate a random invoice ID
      // In a real implementation, this would come from the smart contract
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Generate a random invoice ID
      const randomId = Math.random().toString(16).substring(2, 15);

      // For simulation, set a random time when this invoice will be paid
      // Between 5-15 seconds from now (but only if not manually paid)
      const paymentDelay = Math.floor(Math.random() * 10000) + 5000;
      
      this.invoiceStatuses[randomId] = {
        status: 'open',
        simulatePaymentAfter: Date.now() + paymentDelay
      };
      
      console.log(`Created invoice ${randomId}, will simulate payment after ${paymentDelay}ms`);
      
      return randomId;
    } catch (error) {
      console.error('Create invoice error:', error);
      throw new Error('Failed to create invoice');
    }
  }
  
  static async getInvoiceStatus(invoiceId: string): Promise<{
    status: 'open' | 'paid' | 'refunded' | 'expired';
    payer?: string;
  }> {
    try {
      console.log('Getting status for invoice:', invoiceId);
      
      // Check if we have this invoice in our simulation
      if (this.invoiceStatuses[invoiceId]) {
        const invoice = this.invoiceStatuses[invoiceId];
        
        // For demo, simulate payment after random delay (only if not manually paid)
        if (invoice.status === 'open' && invoice.simulatePaymentAfter && Date.now() > invoice.simulatePaymentAfter) {
          invoice.status = 'paid';
          invoice.payer = 'G...'; // Random public key
          delete invoice.simulatePaymentAfter; // Don't need this anymore
          console.log(`Invoice ${invoiceId} marked as paid automatically`);
        }
        
        return {
          status: invoice.status,
          payer: invoice.payer
        };
      }
      
      // Default fallback
      return { status: 'open' };
    } catch (error) {
      console.error('Get invoice status error:', error);
      throw new Error('Failed to get invoice status');
    }
  }
  
  static async payInvoice(
    invoiceId: string,
    payerAddress: string,
    amountUSDC: number
  ): Promise<string> {
    try {
      console.log(`Paying invoice ${invoiceId} with ${amountUSDC} USDC from ${payerAddress}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check balance
      const balance = await this.getUSDCBalance(payerAddress);
      if (balance < amountUSDC) {
        throw new Error(`Insufficient balance: ${balance} < ${amountUSDC}`);
      }
      
      // Check if invoice exists
      if (!this.invoiceStatuses[invoiceId]) {
        this.invoiceStatuses[invoiceId] = {
          status: 'open',
        };
      }
      
      // Check if invoice is still open
      if (this.invoiceStatuses[invoiceId].status !== 'open') {
        throw new Error(`Invoice is not open, status: ${this.invoiceStatuses[invoiceId].status}`);
      }
      
      // Generate a fake transaction hash
      const txHash = Date.now().toString(16) + Math.random().toString(16).substring(2, 10);
      
      // Update mock balance
      this.userBalances[payerAddress] = (this.userBalances[payerAddress] || 0) - amountUSDC;
      
      // Update invoice status
      this.invoiceStatuses[invoiceId].status = 'paid';
      this.invoiceStatuses[invoiceId].payer = payerAddress;
      this.invoiceStatuses[invoiceId].txHash = txHash;
      delete this.invoiceStatuses[invoiceId].simulatePaymentAfter; // Don't auto-pay anymore
      
      console.log(`Invoice ${invoiceId} marked as paid manually, txHash: ${txHash}`);
      
      return txHash;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }
  
  static async getUSDCBalance(address: string): Promise<number> {
    try {
      console.log(`Getting USDC balance for ${address}`);
      
      // Add a short delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If we don't have a balance for this address, give them some USDC
      if (this.userBalances[address] === undefined) {
        // Start with a random balance between 200-1000 USDC
        const initialBalance = (Math.floor(Math.random() * 800) + 200) * 10000000; // 200-1000 USDC in stroops
        this.userBalances[address] = initialBalance;
        console.log(`Initialized balance for ${address}: ${initialBalance}`);
      }
      
      return this.userBalances[address];
    } catch (error) {
      console.error('Get USDC balance error:', error);
      throw new Error('Failed to get balance');
    }
  }
  
  // For a real implementation, these methods would interact with the actual Soroban contract
  // using StellarSDK, but we're using a simulated approach for demo purposes
}
