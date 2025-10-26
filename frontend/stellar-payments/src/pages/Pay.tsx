import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { ContractService } from '../services/contract';
import { formatUSDC } from '../utils/currency';
import { generateReceiptText, downloadReceipt } from '../utils/receipt';
import { Loader2, AlertCircle, Wallet, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { ConnectButton } from '../components/wallet/ConnectButton';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface InvoiceData {
  id: string;
  merchantName: string;
  merchantLogo?: string;
  amount: number;
  currency: string;
  amountUSDC: number;
  expiry: number;
  status: string;
}

export function PayPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Payment state
  const [balance, setBalance] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  
  const { address, isConnected, connect } = useWallet();
  
  // Balance check when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadBalance();
    }
  }, [isConnected, address]);
  
  // Initial invoice loading and status polling
  useEffect(() => {
    if (!invoiceId) {
      setError('Invalid invoice ID');
      setLoading(false);
      return;
    }
    
    loadInvoice();
    
    // Start polling for invoice status updates after initial load
    let isInitialLoadComplete = false;
    
    const intervalId = setInterval(() => {
      if (isInitialLoadComplete) {
        pollInvoiceStatus();
      }
    }, 2000);
    
    // Update flag once initial load is complete
    const checkLoadingStatus = () => {
      if (!loading && !isInitialLoadComplete) {
        isInitialLoadComplete = true;
      }
    };
    
    // Set up a secondary interval to check loading status
    const loadingCheckId = setInterval(checkLoadingStatus, 500);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(loadingCheckId);
    };
  }, [invoiceId]); // Remove loading from dependencies
  
  // Load user's USDC balance
  const loadBalance = async () => {
    try {
      if (!address) return;
      
      const bal = await ContractService.getUSDCBalance(address);
      setBalance(bal);
      console.log('USDC Balance:', formatUSDC(bal));
    } catch (error) {
      console.error('Balance error:', error);
    }
  };
  
  // Handle payment submission
  const handlePay = async () => {
    if (!invoice || !address) return;
    
    // Check balance
    if (balance !== null && balance < invoice.amountUSDC) {
      setPayError('Insufficient USDC balance');
      return;
    }
    
    setPaying(true);
    setPayError(null);
    
    try {
      // Submit payment to contract
      const hash = await ContractService.payInvoice(
        invoice.id,
        address,
        invoice.amountUSDC
      );
      
      setTxHash(hash);
      setPaid(true);
      
      // Show confetti on success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setPayError(error.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };
  
  // Poll for invoice status updates
  const pollInvoiceStatus = async () => {
    if (!invoiceId) return;
    
    try {
      const status = await ContractService.getInvoiceStatus(invoiceId);
      
      // Only update if status has changed
      setInvoice(prev => {
        if (!prev || prev.status !== status.status) {
          console.log(`Invoice status updated: ${prev?.status} -> ${status.status}`);
          return { ...prev!, status: status.status };
        }
        return prev;
      });
    } catch (error) {
      console.error('Status polling error:', error);
    }
  };
  
  const loadInvoice = async () => {
    try {
      // Try localStorage first (faster)
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const localInvoice = invoices.find((inv: any) => inv.id === invoiceId);
      
      if (localInvoice) {
        setInvoice(localInvoice);
        setLoading(false);
        
        // Still check on-chain status in background
        const status = await ContractService.getInvoiceStatus(invoiceId!);
        setInvoice(prev => prev ? { ...prev, status: status.status } : null);
      } else {
        // Fetch from contract
        const status = await ContractService.getInvoiceStatus(invoiceId!);
        
        // If found on-chain but not in localStorage, create minimal data
        setInvoice({
          id: invoiceId!,
          merchantName: 'Merchant',
          amount: 0,
          currency: 'USD',
          amountUSDC: 0,
          expiry: Date.now() / 1000 + 600,
          status: status.status,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Load invoice error:', error);
      setError('Invoice not found');
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }
  
  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Container className="max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">
              This invoice doesn't exist or has been removed.
            </p>
            <button onClick={() => navigate('/')} className="btn-secondary">
              Go Home
            </button>
          </div>
        </Container>
      </div>
    );
  }
  
  // Payment Success State
  if (paid || invoice.status === 'paid') {
    // Function to download receipt
    const handleDownloadReceipt = () => {
      const receiptText = generateReceiptText({
        merchantName: invoice.merchantName,
        amount: invoice.amount,
        currency: invoice.currency,
        amountUSDC: invoice.amountUSDC,
        payerAddress: address || 'Unknown',
        txHash: txHash || 'tx_' + Math.random().toString(16).substring(2, 10),
        timestamp: new Date().toISOString(),
      });
      
      downloadReceipt(receiptText, `receipt-${invoice.id.substring(0, 8)}.txt`);
      toast.success('Receipt downloaded');
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-20">
        <Container className="max-w-md">
          <div className="card text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of {formatUSDC(invoice.amountUSDC)} USDC has been sent
            </p>
            
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm mb-6 inline-block"
              >
                View on Explorer →
              </a>
            )}
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDownloadReceipt}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
              
              <button onClick={() => navigate('/')} className="btn-primary flex-1">
                Done
              </button>
            </div>
          </div>
        </Container>
      </div>
    );
  }
  
  // Already Paid State (for invoices that were paid but not by current user)
  if (invoice.status === 'paid' && !paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Container className="max-w-md">
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-2">Already Paid</h2>
            <p className="text-gray-600">This invoice has already been paid.</p>
            <button onClick={() => navigate('/')} className="btn-secondary mt-4">
              Return Home
            </button>
          </div>
        </Container>
      </div>
    );
  }
  
  // Expired State
  if (invoice.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Container className="max-w-md">
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-2">Invoice Expired</h2>
            <p className="text-gray-600">This invoice has expired. Please request a new one.</p>
            <button onClick={() => navigate('/')} className="btn-secondary mt-4">
              Return Home
            </button>
          </div>
        </Container>
      </div>
    );
  }
  
  // Normal Payment State
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-20">
      <Container className="max-w-md">
        <div className="card">
          {/* Merchant Info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {invoice.merchantLogo ? (
              <img
                src={invoice.merchantLogo}
                alt={invoice.merchantName}
                className="w-12 h-12 rounded-xl"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl" />
            )}
            <div>
              <p className="text-sm text-gray-500">Payment to</p>
              <h2 className="font-semibold">{invoice.merchantName}</h2>
            </div>
          </div>
          
          {/* Amount */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2">
              {invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '£'}
              {invoice.amount.toFixed(2)}
            </div>
            <div className="text-lg text-gray-600">
              {formatUSDC(invoice.amountUSDC)} USDC
            </div>
          </div>
          
          {/* Balance Check */}
          {isConnected && balance !== null && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your USDC Balance:</span>
                <span className="font-semibold">{formatUSDC(balance)}</span>
              </div>
              
              {balance < invoice.amountUSDC && (
                <div className="mt-2 flex items-start gap-2 text-warning text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Insufficient balance. Need {formatUSDC(invoice.amountUSDC - balance)} more USDC.
                    <a href="#" className="underline ml-1">Get testnet USDC</a>
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Error Message */}
          {payError && (
            <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm">
              {payError}
            </div>
          )}
          
          {/* Pay Button */}
          {!isConnected ? (
            <div className="space-y-3">
              <button
                onClick={connect}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </button>
              <p className="text-xs text-center text-gray-500">
                Connect your wallet to pay this invoice
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handlePay}
                disabled={paying || (balance !== null && balance < invoice.amountUSDC)}
                className="btn-primary w-full mb-3 inline-flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Pay with Freighter
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-gray-500">
                By paying, you agree to send USDC on Stellar testnet
              </p>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
