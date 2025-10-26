export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg" />
            <span className="font-semibold">Minty</span>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="https://github.com" className="hover:text-gray-900 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Docs
            </a>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Support
            </a>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
            ⚠️ Testnet Demo - Not Real Money
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Built on Stellar • Soroban Smart Contracts
          </p>
        </div>
      </div>
    </footer>
  );
}
