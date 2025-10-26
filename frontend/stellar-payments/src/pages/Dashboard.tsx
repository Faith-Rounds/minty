import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress } from '../utils/format';
import { CreditCard, FileText, Settings, Copy, Delete } from 'lucide-react';
import toast from 'react-hot-toast';
import { ContractService } from '../services/contract';
import { convertToUSDC } from '../utils/currency';
import { InvoiceDisplay } from '../components/invoice/InvoiceDisplay';

type Tab = 'create' | 'invoices' | 'settings';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [merchant, setMerchant] = useState<any>(null);
  const { address } = useWallet();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load merchant data
    const merchantData = localStorage.getItem('merchant');
    if (!merchantData) {
      navigate('/onboarding');
      return;
    }
    setMerchant(JSON.parse(merchantData));
  }, [navigate]);
  
  const copyAddress = () => {
    navigator.clipboard.writeText(address || '');
    toast.success('Address copied!');
  };
  
  if (!merchant) return null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Container>
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {merchant.logo ? (
                <img
                  src={merchant.logo}
                  alt={merchant.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {merchant.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">{merchant.name}</h1>
                <button
                  onClick={copyAddress}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  {truncateAddress(address || '')}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              Testnet
            </div>
          </div>
        </Container>
      </div>
      
      {/* Main Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            <SidebarButton
              icon={<CreditCard className="w-5 h-5" />}
              label="Create Invoice"
              active={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <SidebarButton
              icon={<FileText className="w-5 h-5" />}
              label="Invoices"
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
            />
            <SidebarButton
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-8">
          <Container className="py-6 md:py-8">
            {activeTab === 'create' && <CreateTab />}
            {activeTab === 'invoices' && <InvoicesTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </Container>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-3">
          <MobileTabButton
            icon={<CreditCard className="w-5 h-5" />}
            label="Create"
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
          />
          <MobileTabButton
            icon={<FileText className="w-5 h-5" />}
            label="Invoices"
            active={activeTab === 'invoices'}
            onClick={() => setActiveTab('invoices')}
          />
          <MobileTabButton
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </nav>
    </div>
  );
}

// Desktop Sidebar Button Component
function SidebarButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
        ${active 
          ? 'bg-primary-50 text-primary-700 font-medium shadow-sm' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

// Mobile Tab Button Component
function MobileTabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1 py-3 transition-colors
        ${active 
          ? 'text-primary-600' 
          : 'text-gray-500'
        }
      `}
    >
      {icon}
      <span className={`text-xs ${active ? 'font-medium' : ''}`}>{label}</span>
    </button>
  );
}

// Invoice creation with amount keypad

function CreateTab() {
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'MXN'>('USD');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { address } = useWallet();
  
  const handleNumberClick = (num: string) => {
    if (amount === '0') {
      setAmount(num);
    } else if (amount.length < 10) {
      setAmount(amount + num);
    }
  };
  
  const handleDecimal = () => {
    if (!amount.includes('.')) {
      setAmount(amount + '.');
    }
  };
  
  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount(amount.slice(0, -1));
    }
  };
  
  const handleClear = () => {
    setAmount('0');
  };
  
  const handleCreateInvoice = async () => {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return;
    
    setLoading(true);
    try {
      const merchant = JSON.parse(localStorage.getItem('merchant') || '{}');
      const amountUSDC = convertToUSDC(amountNum, currency);
      
      // Create invoice on-chain (or mock for demo)
      const invoiceId = await ContractService.createInvoice(
        address!,
        amountUSDC,
        10 // 10 minutes
      );
      
      // Create expiry timestamp (10 minutes from now)
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 600;
      
      // Save invoice to localStorage
      const invoice = {
        id: invoiceId,
        amount: amountNum,
        currency,
        amountUSDC,
        merchantName: merchant.name || 'Minty Merchant',
        merchantLogo: merchant.logo,
        expiry: expiryTimestamp,
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      
      // Get existing invoices and add the new one at the beginning
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      invoices.unshift(invoice);
      localStorage.setItem('invoices', JSON.stringify(invoices));
      
      console.log('Invoice saved to localStorage:', invoice);
      
      // Show the invoice display modal
      setInvoiceData(invoice);
      setShowInvoice(true);
      toast.success('Invoice created!');
    } catch (error) {
      console.error('Invoice creation error:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDisplay = () => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      MXN: 'MX$',
    };
    return `${symbols[currency]}${amount}`;
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Invoice</h2>
        <p className="text-gray-600">Set the amount and currency for your invoice.</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <div className="card p-6">
          {/* Currency Selector */}
          <div className="flex gap-2 mb-6">
            {(['USD', 'EUR', 'GBP', 'MXN'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  currency === curr
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
          
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-center font-mono">
              {formatDisplay()}
            </div>
          </div>
          
          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="aspect-square bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-2xl font-semibold transition-colors active:scale-95"
                disabled={loading}
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={handleDecimal}
              className="aspect-square bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-2xl font-semibold transition-colors active:scale-95"
              disabled={loading}
            >
              .
            </button>
            
            <button
              onClick={() => handleNumberClick('0')}
              className="aspect-square bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-2xl font-semibold transition-colors active:scale-95"
              disabled={loading}
            >
              0
            </button>
            
            <button
              onClick={handleBackspace}
              className="aspect-square bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              disabled={loading}
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClear}
              className="btn-secondary"
              disabled={loading}
            >
              Clear
            </button>
            
            <button
              onClick={handleCreateInvoice}
              disabled={parseFloat(amount) <= 0 || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Invoice Display Modal */}
      {showInvoice && invoiceData && (
        <InvoiceDisplay
          {...invoiceData}
          onClose={() => {
            setShowInvoice(false);
            setAmount('0');
          }}
        />
      )}
    </div>
  );
}

function InvoicesTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoices</h2>
        <p className="text-gray-600">View and manage all your payment invoices.</p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice List</h3>
          <p className="text-gray-500 text-sm">
            This feature will be implemented in ticket FE-13
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your merchant profile and preferences.</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Profile Settings</h3>
          <p className="text-sm text-gray-500 mb-4">Update your business information</p>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              This feature will be implemented in ticket FE-15
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Wallet Connection</h3>
          <p className="text-sm text-gray-500">Manage your wallet settings</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Notifications</h3>
          <p className="text-sm text-gray-500">Configure invoice and payment alerts</p>
        </div>
      </div>
    </div>
  );
}