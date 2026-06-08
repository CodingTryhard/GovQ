import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, UserX, SkipForward, Megaphone, CheckCircle2, QrCode } from 'lucide-react';
import ScannerModal from '../components/ScannerModal';

export default function CounterDashboard() {
  const [serviceId, setServiceId] = useState(1);
  const [counterId, setCounterId] = useState(1);
  const [queue, setQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [services, setServices] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/services/');
      setServices(res.data);
      if (res.data.length > 0 && serviceId === 1) {
        setServiceId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`/api/tokens/queue/?service_id=${serviceId}`);
      setQueue(res.data);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  const fetchServing = async () => {
    try {
      const res = await axios.get(`/api/tokens/serving/?service_id=${serviceId}`);
      const myToken = res.data.find(t => t.counter_number === counterId);
      setCurrentToken(myToken || null);
    } catch (err) {
      console.error("Failed to fetch serving tokens", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchServing();
    const interval = setInterval(() => {
      fetchQueue();
      fetchServing();
    }, 5000);
    return () => clearInterval(interval);
  }, [serviceId, counterId]);

  const callNext = async () => {
    if (queue.length === 0) return;
    try {
      const res = await axios.post('/api/tokens/call-next/', { service_id: serviceId, counter_number: counterId });
      if (res.data.called_token) {
        fetchServing();
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markStatus = async (status) => {
    if (!currentToken) return;
    try {
      await axios.post(`/api/tokens/${currentToken.id}/${status}/`);
      setCurrentToken(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-500" /> Counter Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Counter Number</label>
              <select 
                value={counterId} 
                onChange={e => setCounterId(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              >
                {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>Counter {i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Active Service</label>
              <select 
                value={serviceId} 
                onChange={e => setServiceId(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              >
                {services.length === 0 && <option value={1}>Loading services...</option>}
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <button 
            onClick={callNext}
            disabled={!!currentToken || queue.length === 0}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg mb-3"
          >
            <Megaphone size={24} /> Call Next Token
          </button>
          
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode size={20} /> Scan Token QR
          </button>

          {queue.length === 0 && !currentToken && (
            <p className="text-sm text-slate-500 mt-4 font-medium">Queue is empty</p>
          )}
        </div>
      </div>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onProcessed={() => {
          fetchQueue();
          fetchServing();
        }} 
      />

      {/* Main Display */}
      <div className="lg:col-span-2 space-y-8">
        {/* Current Token Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden relative">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
            <h2 className="font-bold text-blue-800 uppercase tracking-wider text-sm">Currently Serving</h2>
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">Counter {counterId}</span>
          </div>
          
          <div className="p-8 text-center min-h-[300px] flex flex-col justify-center">
            {currentToken ? (
              <div className="animate-in zoom-in-95 duration-300">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Token Number</p>
                <div className="text-8xl font-black text-slate-800 tracking-tighter mb-4">#{currentToken.token_number}</div>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <p className="text-xl font-medium text-slate-600">{currentToken.citizen_name}</p>
                  {currentToken.payment_status === 'paid' && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12}/> PAID
                    </span>
                  )}
                  {currentToken.payment_status !== 'paid' && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                      UNPAID
                    </span>
                  )}
                </div>
                
                <div className="flex justify-center gap-4">
                  <button onClick={() => markStatus('served')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-md">
                    <UserCheck size={20} /> Mark Served
                  </button>
                  <button onClick={() => markStatus('no_show')} className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-md">
                    <UserX size={20} /> No Show
                  </button>
                  <button onClick={() => markStatus('skipped')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors shadow-md">
                    <SkipForward size={20} /> Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">
                <Megaphone size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium">Ready for next citizen.</p>
                <p className="text-sm mt-2">Click "Call Next Token" to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Up Next Queue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Up Next in Queue</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {queue.slice(0, 5).map((t, idx) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-800 text-lg">#{t.token_number}</div>
                      {t.payment_status === 'paid' && <CheckCircle2 size={14} className="text-emerald-500" title="Paid" />}
                    </div>
                    <div className="text-sm text-slate-500">{t.citizen_name}</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                  Waiting
                </div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">
                No citizens currently in queue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
