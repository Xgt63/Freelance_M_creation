import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BriefForm } from './components/Form';
import { ThankYou } from './components/ThankYou';
import { FormData, initialFormData } from './types';
import { ChevronDown } from 'lucide-react';
import { analyzeBrief } from './services/ai';

const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

function ClientApp() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const navigate = useNavigate();

  const handleAdminAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPin = import.meta.env.VITE_ADMIN_PIN || '2026';
    if (pin === adminPin) {
      localStorage.setItem('admin_pin', pin);
      setShowPinModal(false);
      navigate('/admin');
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Run AI Analysis on the frontend
      const analysis = await analyzeBrief(formData);

      // 2. Send data + analysis to backend
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ai_analysis: analysis,
          ai_score: analysis.score
        })
      });
      if (!res.ok) throw new Error('Erreur réseau');
      navigate('/merci');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1 rounded-lg overflow-hidden">
              <img src="/logo.svg" alt="Logo" className="w-6 h-6" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight truncate max-w-[150px] md:max-w-none">M Creation Design App</span>
          </div>
          <div className="text-xs md:text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">
            <span>Brief Créatif</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Démarrez votre projet
            </h1>
            <p className="text-lg text-gray-500">
              Remplissez ce court questionnaire pour m'aider à comprendre votre vision.
            </p>
          </div>
          <BriefForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 md:py-12 mt-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <div className="bg-black text-white p-1 rounded-md overflow-hidden">
              <img src="/logo.svg" alt="Logo" className="w-5 h-5" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-sm tracking-tight">M Creation Design App</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            <span className="text-xs md:text-sm text-gray-400">© 2026 M Creation Design App. Tous droits réservés.</span>
            <button 
              onClick={() => setShowPinModal(true)}
              className="text-[10px] md:text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest border border-gray-200 px-4 py-2 rounded-full hover:border-indigo-100"
            >
              Accès Admin
            </button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 w-full max-w-sm relative"
            >
              <button 
                onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                  setPinError(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-center mb-6">
                <div className="bg-black text-white p-2 rounded-xl inline-block mb-4 overflow-hidden">
                  <img src="/logo.svg" alt="Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Accès Sécurisé</h2>
                <p className="text-sm text-gray-500 mt-2">Saisissez votre code PIN pour accéder à l'administration.</p>
              </div>
              <form onSubmit={handleAdminAccess} className="space-y-4">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Code PIN"
                    className={`w-full px-4 py-3 rounded-xl border ${pinError ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center text-2xl tracking-widest`}
                    autoFocus
                  />
                  {pinError && <p className="text-red-500 text-xs mt-2 text-center">Code PIN incorrect.</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-all active:scale-[0.98]"
                >
                  Déverrouiller
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('admin_pin');
    const adminPin = import.meta.env.VITE_ADMIN_PIN || '2026';
    if (savedPin === adminPin) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleCheckPin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPin = import.meta.env.VITE_ADMIN_PIN || '2026';
    if (pin === adminPin) {
      localStorage.setItem('admin_pin', pin);
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="bg-black text-white p-2 rounded-xl inline-block mb-4 overflow-hidden">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Accès Sécurisé</h2>
          <p className="text-sm md:text-base text-gray-500 mt-2">Veuillez saisir votre code PIN pour accéder au tableau de bord.</p>
        </div>
        <form onSubmit={handleCheckPin} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Code PIN"
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center text-2xl tracking-widest`}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">Code PIN incorrect.</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-all active:scale-[0.98]"
          >
            Déverrouiller
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientApp />} />
        <Route path="/merci" element={<ThankYou />} />
        <Route path="/admin" element={
          <AdminGuard>
            <Suspense key="admin-suspense" fallback={
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Chargement du tableau de bord...</p>
              </div>
            }>
              <AdminDashboard />
            </Suspense>
          </AdminGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
