import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { WalletProvider } from './contexts/WalletContext';

// Pages
import { LandingPage } from './pages/Landing';
import { DashboardPage } from './pages/Dashboard';
import { PayPage } from './pages/Pay';
import { OnboardingPage } from './pages/Onboarding';

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-20">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pay/:invoiceId" element={<PayPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
