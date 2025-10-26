import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface RefundModalProps {
  amount: number;
  currency: string;
  amountUSDC: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function RefundModal({ amount, currency, amountUSDC, onConfirm, onClose }: RefundModalProps) {
  const [loading, setLoading] = useState(false);
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Confirm Refund</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-xl mb-6">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">This action cannot be undone</p>
            <p>The full payment will be returned to the customer's wallet.</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Refund Amount:</p>
          <div className="text-2xl font-bold">
            {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}{amount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {(amountUSDC / 10000000).toFixed(2)} USDC
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary flex-1 bg-error hover:bg-error/90 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Refund'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
