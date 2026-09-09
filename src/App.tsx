import { Route, Routes } from 'react-router-dom';
import { ExchangeProvider } from './store/ExchangeContext';
import { ToastProvider } from './components/Toast';
import BottomNav from './components/BottomNav';
import AgeGate from './components/AgeGate';
import Home from './pages/Home';
import MarketPage from './pages/MarketPage';
import Portfolio from './pages/Portfolio';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import About from './pages/About';

export default function App() {
  return (
    <ExchangeProvider>
      <ToastProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mercado/:id" element={<MarketPage />} />
            <Route path="/portafolio" element={<Portfolio />} />
            <Route path="/cartera" element={<Wallet />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/que-es-cancha" element={<About />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <BottomNav />
          <AgeGate />
        </div>
      </ToastProvider>
    </ExchangeProvider>
  );
}
