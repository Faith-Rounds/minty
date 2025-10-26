import { useState } from 'react';
import { Wallet, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { truncateAddress } from '../../utils/format';
import toast from 'react-hot-toast';

export function ConnectButton() {
  const { address, isConnected, isFreighterInstalled, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to connect. Check console for details.');
      }
      toast.error('Wallet connection failed');
    } finally {
      setIsConnecting(false);
    }
  };
  
  if (!isFreighterInstalled) {
    return (
      <div className="flex flex-col items-center gap-2">
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Install Freighter
          <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-gray-500">Freighter extension not detected</p>
      </div>
    );
  }
  
  if (isConnected) {
    return (
      <button
        onClick={disconnect}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-success rounded-full" />
        {truncateAddress(address!)}
      </button>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary inline-flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>
      
      {errorMessage && (
        <div className="text-xs text-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> 
          {errorMessage}
        </div>
      )}
    </div>
  );
}
