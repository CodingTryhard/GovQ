import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { X, CheckCircle2, UserCheck, UserX, SkipForward, Loader2 } from 'lucide-react';

export default function ScannerModal({ isOpen, onClose, onProcessed }) {
  const [scannedTicket, setScannedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setScannedTicket(null);
      setError(null);
      return;
    }

    if (!scannedTicket && !error && !loading) {
      const scanner = new Html5QrcodeScanner("reader", { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5,
      });

      scanner.render(
        async (result) => {
          scanner.clear();
          setLoading(true);
          try {
            // URL format: http://localhost:5174/ticket/uuid-hash
            const urlParts = result.split('/ticket/');
            if (urlParts.length !== 2) throw new Error("Invalid GovQ Ticket QR Code");
            const hash = urlParts[1];
            
            const res = await axios.get(`/api/tokens/ticket/${hash}/?t=${Date.now()}`);
            setScannedTicket(res.data);
          } catch (err) {
            setError(err.response?.data?.error || err.message || "Failed to fetch ticket details");
          } finally {
            setLoading(false);
          }
        }, 
        (err) => {
          // ignore background scan failures (e.g. no qr code found in frame)
        }
      );

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [isOpen, scannedTicket, error, loading]);

  const markStatus = async (status) => {
    if (!scannedTicket?.id) {
      setError("Ticket ID missing. Please scan again.");
      return;
    }
    try {
      await axios.post(`/api/tokens/${scannedTicket.id}/${status}/`);
      onProcessed();
      onClose();
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Scan Token QR</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 flex flex-col items-center text-center">
              <span className="font-medium">{error}</span>
              <button 
                onClick={() => { setError(null); setScannedTicket(null); setLoading(false); }} 
                className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 font-bold rounded-lg transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-slate-500 font-medium">Fetching details...</p>
            </div>
          )}

          {!scannedTicket && !loading && !error && (
            <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300"></div>
          )}

          {scannedTicket && !loading && !error && (
            <div className="text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Token Number</p>
              <div className="text-6xl font-black text-slate-800 tracking-tighter mb-4">#{scannedTicket.token_number}</div>
              
              <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 border border-slate-200 shadow-sm">
                <p className="font-bold text-slate-800 mb-1">{scannedTicket.citizen_name}</p>
                <p className="text-sm text-slate-500">{scannedTicket.service}</p>
                <div className={`mt-3 inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  scannedTicket.status === 'called' ? 'bg-amber-100 text-amber-700' :
                  scannedTicket.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  Status: {scannedTicket.status}
                </div>
              </div>

              <div className="grid gap-3">
                <button onClick={() => markStatus('served')} className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
                  <UserCheck size={20} /> Mark Served
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => markStatus('no_show')} className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm text-sm">
                    <UserX size={18} /> No Show
                  </button>
                  <button onClick={() => markStatus('skipped')} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-sm text-sm">
                    <SkipForward size={18} /> Skip
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => { setError(null); setScannedTicket(null); setLoading(false); }} 
                className="mt-4 text-sm text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Scan a different token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
