import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { ArrowRight, Smartphone, QrCode, CheckCircle } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-primary-50 via-white to-purple-50 overflow-hidden">
        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Accept USDC Payments Instantly
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The fastest way to accept stablecoin payments. Built on Stellar blockchain with instant settlement and minimal fees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/onboarding" className="btn-primary inline-flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <a href="#how-it-works" className="btn-secondary inline-flex items-center justify-center">
                See How it Works
              </a>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Instant Settlement
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Low Fees
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                No Chargebacks
              </div>
            </div>
          </div>
        </Container>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      </section>
      
      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and secure in 3 easy steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Create Invoice</h3>
              <p className="text-gray-600">
                Enter amount, generate QR code. Invoice created on-chain in seconds.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Customer Scans</h3>
              <p className="text-gray-600">
                Customer scans QR, pays with their Stellar wallet. No signup required.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Instant Settlement</h3>
              <p className="text-gray-600">
                USDC arrives in your wallet instantly. View receipt and manage refunds.
              </p>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Try Demo Section (stub) */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Try it Yourself</h2>
            <p className="text-gray-600 mb-8">Scan this testnet invoice to see it in action</p>
            
            <div className="card max-w-md mx-auto">
              <div className="w-64 h-64 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-500">QR Code (Coming Soon)</p>
              </div>
              <p className="text-sm text-gray-600">0.50 USDC • Testnet</p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
