import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { WalletService } from '../services/wallet';
import toast from 'react-hot-toast';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
  
  useEffect(() => {
    // Check if Freighter is installed
    const isInstalled = WalletService.isFreighterInstalled();
    setIsFreighterInstalled(isInstalled);
    console.log('WalletContext: Freighter installed?', isInstalled);
    
    // Check localStorage for saved address
    const savedAddress = localStorage.getItem('wallet_address');
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);
  
  const connect = async () => {
    try {
      // Check if Freighter is truly installed
      const isInstalled = WalletService.isFreighterInstalled();
      if (!isInstalled) {
        console.error('WalletContext: Freighter not installed');
        setIsFreighterInstalled(false);
        toast.error('Freighter extension not detected');
        throw new Error('Freighter extension not detected');
      }
      
      console.log('WalletContext: Attempting to connect to Freighter');
      const publicKey = await WalletService.connectFreighter();
      console.log('WalletContext: Connected successfully with public key', publicKey);
      
      setAddress(publicKey);
      localStorage.setItem('wallet_address', publicKey);
      toast.success('Wallet connected!');
    } catch (error) {
      console.error('WalletContext: Connection error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect wallet');
      throw error;
    }
  };
  
  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem('wallet_address');
    toast.success('Wallet disconnected');
  };
  
  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isFreighterInstalled,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
