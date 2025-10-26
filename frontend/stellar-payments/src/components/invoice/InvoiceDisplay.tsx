import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, CheckCircle } from 'lucide-react';
import { formatUSDC } from '../../utils/currency';
import { ContractService } from '../../services/contract';
import confetti from 'canvas-confetti';

interface InvoiceDisplayProps {
  invoiceId: string;
  amount: number; // display amount
  currency: string;
  amountUSDC: number; // stroops
  merchantName: string;
  merchantLogo?: string;
  expiry: number; // timestamp
  onClose: () => void;
}

export function InvoiceDisplay({
  invoiceId,
  amount,
  currency,
  amountUSDC,
  merchantName,
  merchantLogo,
  expiry,
  onClose,
}: InvoiceDisplayProps) {
  const [status, setStatus] = useState<'open' | 'paid' | 'refunded' | 'expired'>('open');
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Timer logic for expiry countdown
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, expiry - now);
      setTimeLeft(remaining);
      
      if (remaining === 0 && status === 'open') {
        setStatus('expired');
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [expiry, status]);
  
  // Status polling from smart contract
  useEffect(() => {
    let mounted = true;
    
    const pollStatus = async () => {
      try {
        const result = await ContractService.getInvoiceStatus(invoiceId);
        
        if (!mounted) return;
        
        if (result.status !== status) {
          setStatus(result.status);
          
          // Show confetti on payment
          if (result.status === 'paid') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            
            // Update localStorage
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const index = invoices.findIndex((inv: any) => inv.id === invoiceId);
            if (index !== -1) {
              invoices[index].status = 'paid';
              localStorage.setItem('invoices', JSON.stringify(invoices));
            }
          }
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    };
    
    // Poll every 2 seconds if status is open
    const interval = setInterval(() => {
      if (status === 'open') {
        pollStatus();
      }
    }, 2000);
    
    // Initial poll
    pollStatus();
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [invoiceId, status]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const paymentUrl = `${window.location.origin}/pay/${invoiceId}`;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Merchant Info */}
        <div className="flex items-center gap-3 mb-6">
          {merchantLogo ? (
            <img src={merchantLogo} alt={merchantName} className="w-12 h-12 rounded-xl" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl" />
          )}
          <div>
            <h3 className="font-semibold">{merchantName}</h3>
            <p className="text-sm text-gray-500">Payment Request</p>
          </div>
        </div>
        
        {/* Amount */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-1">
            {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}{amount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {formatUSDC(amountUSDC)} USDC
          </div>
        </div>
        
        {/* QR Code - Show only when status is open */}
        {status === 'open' && (
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-4">
            <QRCodeSVG
              value={paymentUrl}
              size={256}
              level="M"
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* Status Messages */}
        {status === 'open' && (
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Waiting for payment
            </div>
            
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
        
        {/* Payment Success */}
        {status === 'paid' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-2xl font-bold text-success mb-2">Payment Received!</h3>
            <p className="text-gray-600 mb-6">USDC has been transferred to your wallet</p>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        )}
        
        {/* Expired Status */}
        {status === 'expired' && (
          <div className="mt-4 p-4 bg-error/10 text-error rounded-xl text-center">
            <p className="font-medium mb-2">Invoice Expired</p>
            <button onClick={onClose} className="btn-secondary mt-2">
              Create New Invoice
            </button>
          </div>
        )}
        
        {/* Accepted Payment */}
        {status === 'open' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Accepting:</span>
            <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded font-medium">
              USDC (Testnet)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
