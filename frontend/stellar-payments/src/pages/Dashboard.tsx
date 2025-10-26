import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { useWallet } from '../contexts/WalletContext';
import { ConnectButton } from '../components/wallet/ConnectButton';
import { PlusCircle, QrCode, Clock, CreditCard, ArrowRightLeft } from 'lucide-react';
import { truncateAddress } from '../utils/format';

interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  logo?: string;
  createdAt: string;
}

export function DashboardPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const { isConnected, address } = useWallet();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load merchant data from localStorage
    const merchantData = localStorage.getItem('merchant');
    if (merchantData) {
      setMerchant(JSON.parse(merchantData));
    }
    
    // If not connected to wallet and no merchant data, redirect to onboarding
    if (!isConnected && !merchantData) {
      navigate('/onboarding');
    }
  }, [isConnected, navigate]);
  
  const handleCreateInvoice = () => {
    // This would be implemented in a future ticket
    // For now, we'll just show a placeholder
    alert('Create Invoice feature coming soon!');
  };
  
  return (
    <Container className="py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Merchant Dashboard</h1>
          {merchant && <p className="text-gray-600">Welcome back, {merchant.name}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <ConnectButton />
          
          <button
            onClick={handleCreateInvoice}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>
      
      {/* Merchant Profile Card */}
      {merchant && (
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            {merchant.logo ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name} 
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">
                  {merchant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-bold">{merchant.name}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-success rounded-full"></span>
                {address ? truncateAddress(address) : 'Wallet not connected'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-gray-600">Active Invoices</span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-success" />
            </div>
            <span className="text-gray-600">Payments (24h)</span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-gray-600">Total Volume</span>
          </div>
          <p className="text-2xl font-bold">0 USDC</p>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="mb-2">No transactions yet</p>
          <p className="text-sm">Create an invoice to start accepting payments</p>
        </div>
      </div>
    </Container>
  );
}
