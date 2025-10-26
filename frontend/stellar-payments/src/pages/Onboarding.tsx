import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Container } from '../components/layout/Container';
import { ConnectButton } from '../components/wallet/ConnectButton';
import { ArrowRight, Upload, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState<string>('');
  const { isConnected, address, isFreighterInstalled } = useWallet();
  const navigate = useNavigate();
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Logo must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleComplete = () => {
    if (!businessName.trim()) {
      toast.error('Please enter a business name');
      return;
    }
    
    // Save merchant data to localStorage
    const merchantData = {
      id: `merchant_${Date.now()}`,
      name: businessName,
      walletAddress: address,
      logo,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem('merchant', JSON.stringify(merchantData));
    toast.success('Setup complete!');
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-20">
      <Container className="max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Get Started</h1>
          <p className="text-gray-600">Set up your merchant account in 2 easy steps</p>
        </div>
        
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>
        
        <div className="card">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Connect your Freighter wallet to start accepting USDC payments
              </p>
              
              <div className="flex justify-center mb-6">
                <ConnectButton />
              </div>
              
              {/* Debug information */}
              <div className="text-xs text-gray-500 mb-4">
                <p>Freighter Detected: {isFreighterInstalled ? 'Yes' : 'No'}</p>
                <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                {isConnected ? (
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
                
                {/* Always show skip button */}
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">
                    Having trouble connecting? You can continue without connecting your wallet.
                  </p>
                  <button
                    onClick={() => {
                      console.log('Manual continue without wallet connection');
                      setStep(2);
                    }}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    Skip Wallet Connection
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Business Information</h2>
              
              <div className="space-y-6">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Coffee Shop"
                    className="input"
                    required
                  />
                </div>
                
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Optional)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    
                    <label className="cursor-pointer btn-secondary inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {logo ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Max 2MB, square recommended</p>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                
                <button
                  onClick={handleComplete}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  disabled={!businessName.trim()}
                >
                  Complete Setup
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
