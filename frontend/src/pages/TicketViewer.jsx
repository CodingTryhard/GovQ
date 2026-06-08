import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Ticket, Clock, Calendar, User, MapPin, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import QRCode from "react-qr-code";

export default function TicketViewer() {
  const { hash } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`/api/tokens/ticket/${hash}/`);
        setTicket(res.data);
      } catch (err) {
        setError('Ticket not found or invalid link.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
    
    // Poll for status updates every 10 seconds if ticket is still pending/booked/called
    const interval = setInterval(() => {
      fetchTicket();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Ticket size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ticket Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-sm">{error}</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Portal
        </Link>
      </div>
    );
  }

  const getStatusColor = () => {
    switch(ticket.status) {
      case 'called': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'served': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'no_show': return 'bg-red-100 text-red-700 border-red-200';
      case 'skipped': return 'bg-slate-200 text-slate-700 border-slate-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusText = () => {
    switch(ticket.status) {
      case 'called': return `PROCEED TO COUNTER ${ticket.counter_number}`;
      case 'served': return 'COMPLETED';
      case 'no_show': return 'NO SHOW';
      case 'skipped': return 'SKIPPED';
      case 'booked': return 'WAITING IN QUEUE';
      case 'pending': return 'PENDING PAYMENT';
      default: return ticket.status.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        
        {/* Ticket Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-800 tracking-tight">GovQ Services</h1>
          <p className="text-slate-500 font-medium mt-1">Digital Service Ticket</p>
        </div>

        {/* The Digital Ticket */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">
          
          {/* Ticket Top Section */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            
            <p className="text-blue-200 text-sm font-bold tracking-widest uppercase mb-2 relative z-10">Token Number</p>
            <h2 className="text-7xl font-black text-white tracking-tighter mb-4 relative z-10">#{ticket.token_number}</h2>
            
            <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest relative z-10 border shadow-sm ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>

          {/* Ticket Cutout Effect */}
          <div className="relative flex justify-between items-center bg-white -mt-4 z-20">
             <div className="w-8 h-8 bg-slate-50 rounded-full shadow-inner border border-slate-200 border-l-0 -ml-4"></div>
             <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2"></div>
             <div className="w-8 h-8 bg-slate-50 rounded-full shadow-inner border border-slate-200 border-r-0 -mr-4"></div>
          </div>

          {/* Ticket Body Section */}
          <div className="p-8 pb-10 relative z-10 bg-white">
            <div className="space-y-6">
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service</p>
                <p className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-blue-500"/> {ticket.service}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Citizen</p>
                <p className="text-lg font-bold text-slate-800 flex items-center gap-2"><User size={18} className="text-blue-500"/> {ticket.citizen_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Date</p>
                  <p className="font-bold text-slate-700">{ticket.date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12}/> Time</p>
                  <p className="font-bold text-slate-700">{ticket.start_time.substring(0,5)} to {ticket.end_time.substring(0,5)}</p>
                </div>
              </div>

            </div>

            {/* Live QR Code (Always points to this exact page URL!) */}
            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm mb-3">
                <QRCode value={window.location.href} size={140} />
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest text-center">
                SCAN FOR LIVE STATUS<br/>
                ID: {hash.split('-')[0]}
              </p>
            </div>

          </div>

        </div>
        
        <div className="text-center mt-8">
           <Link to="/" className="text-blue-600 font-bold hover:underline text-sm">
             Book another token
           </Link>
        </div>

      </div>
    </div>
  );
}
