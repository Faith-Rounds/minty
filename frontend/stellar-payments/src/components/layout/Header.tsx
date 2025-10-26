import { Link } from 'react-router-dom';
import { ConnectButton } from '../wallet/ConnectButton';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg" />
            <span className="text-xl font-bold">Stellar Pay</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How it Works
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <ConnectButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
