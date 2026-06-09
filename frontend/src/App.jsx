import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CitizenPortal from './pages/CitizenPortal';
import CounterDashboard from './pages/CounterDashboard';
import DisplayBoard from './pages/DisplayBoard';
import AdminPanel from './pages/AdminPanel';
import TicketViewer from './pages/TicketViewer';
import { PrivacyPolicy, TermsConditions, RefundPolicy, ContactUs } from './pages/LegalPages';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Routes>
          <Route path="/" element={
            <nav className="bg-slate-900 text-white p-4 shadow-md w-full">
              <div className="container mx-auto">
                <h1 className="text-2xl font-bold tracking-tight text-blue-400">GovQ</h1>
              </div>
            </nav>
          } />
        </Routes>
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<CitizenPortal />} />
            <Route path="/counter" element={<CounterDashboard />} />
            <Route path="/display/:serviceId" element={<DisplayBoard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/ticket/:hash" element={<TicketViewer />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </main>
        <footer className="bg-slate-100 py-6 border-t border-slate-200 mt-auto">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
            <div>© 2026 GovQ Services. All rights reserved.</div>
            <div className="space-x-6">
              <Link to="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
              <Link to="/refund" className="hover:text-slate-800 transition-colors">Refund Policy</Link>
              <Link to="/contact" className="hover:text-slate-800 transition-colors">Contact Us</Link>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
