import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, ChevronRight, CreditCard } from 'lucide-react';
import QRCode from "react-qr-code";

export default function CitizenPortal() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({ citizen_name: '', citizen_email: '', citizen_phone: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Services on Mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('/api/services/');
        setServices(res.data);
      } catch (err) {
        console.error("Failed to load services", err);
      }
    };
    fetchServices();
  }, []);

  // Fetch Slots when Date and Service are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDate && selectedService) {
        try {
          const res = await axios.get(`/api/slots/?service_id=${selectedService.id}&date=${selectedDate}`);
          setSlots(res.data);
        } catch (err) {
          console.error("Failed to load slots", err);
        }
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService]);

  const initiatePayment = async (tokenId) => {
    try {
      // 1. Call our backend to create a razorpay order
      const orderRes = await axios.post(`/api/tokens/${tokenId}/create-payment/`);
      const { order_id, amount, key_id, citizen_name, citizen_email, citizen_phone } = orderRes.data;

      // 2. Configure Razorpay Options
      const options = {
        key: key_id,
        amount: amount,
        currency: "INR",
        name: "GovQ Services",
        description: "Token Booking Fee",
        order_id: order_id,
        handler: async function (response) {
          // 3. On successful payment, verify signature on backend
          try {
            await axios.post(`/api/tokens/${tokenId}/verify-payment/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            // Mark complete!
            setStep(5);
          } catch (err) {
            setError("Payment verification failed! Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: citizen_name,
          email: citizen_email,
          contact: citizen_phone
        },
        theme: {
          color: "#2563eb" // tailwind blue-600
        }
      };

      // 4. Open Razorpay modal
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setError("Payment failed! " + response.error.description);
        setLoading(false);
      });
      rzp.open();
      
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate payment.");
      setLoading(false);
    }
  };

  const [lockedToken, setLockedToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Timer logic
  useEffect(() => {
    let timer;
    if (step === 4 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === 4) {
      setError("Your reserved time has expired. Please select a slot again.");
      setStep(3);
      setLockedToken(null);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleLockSlot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/tokens/lock/', {
        slot_id: selectedSlot.id
      });
      setLockedToken(res.data);
      setTimeLeft(300); // Reset timer to 5 mins
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to lock slot. Someone else might have grabbed it!');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Save user details to the token
      await axios.post('/api/tokens/book/', {
        token_id: lockedToken.token_id,
        ...formData
      });
      
      setBookingResult({
        ...lockedToken,
        citizen_name: formData.citizen_name,
        citizen_email: formData.citizen_email,
        citizen_phone: formData.citizen_phone
      });
      
      // Start payment flow
      await initiatePayment(lockedToken.token_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
        <h2 className="text-3xl font-extrabold mb-2">Book an Appointment</h2>
        <p className="text-blue-100 font-medium">GovQ Citizen Portal — Fast & easy service tokens</p>
      </div>
      
      <div className="p-8">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className={`absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${step >= i ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'}`}>
              {i}
            </div>
          ))}
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><CheckCircle className="text-blue-500" /> Select a Service</h3>
            <div className="grid gap-4">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep(2); }}
                  className="flex items-center justify-between p-5 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all bg-slate-50 hover:bg-blue-50/50 group"
                >
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{s.name}</h4>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Clock size={14}/> {s.start_time.substring(0,5)} to {s.end_time.substring(0,5)}</p>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-blue-500" />
                </button>
              ))}
              {services.length === 0 && <p className="text-slate-500">No services available right now.</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar className="text-blue-500" /> Choose a Date</h3>
             <input 
               type="date" 
               className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg text-slate-700 bg-slate-50"
               min={new Date().toISOString().split('T')[0]}
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
             />
             <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  disabled={!selectedDate}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Continue
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="text-blue-500" /> Select Time Slot</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {slots.map(s => (
                  <button
                    key={s.id}
                    disabled={s.status !== 'available'}
                    onClick={() => setSelectedSlot(s)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      s.status !== 'available'
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                        : selectedSlot?.id === s.id 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105 ring-4 ring-blue-100' 
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md text-slate-700'
                    }`}
                  >
                    <div className="text-lg font-bold">{s.start_time.substring(0, 5)}</div>
                    <div className="text-xs mt-1 opacity-80">{s.end_time.substring(0, 5)}</div>
                    
                    {s.status === 'available' && (
                      <div className={`text-xs mt-2 font-medium ${selectedSlot?.id === s.id ? 'text-blue-100' : 'text-emerald-600'}`}>
                        Available
                      </div>
                    )}
                    {s.status === 'locked' && <div className="text-xs mt-2 font-medium text-amber-500">Locked</div>}
                    {s.status === 'booked' && <div className="text-xs mt-2 font-medium text-red-500">Booked</div>}
                  </button>
                ))}
                {slots.length === 0 && <p className="text-slate-500 col-span-full">No slots available for this date.</p>}
             </div>
             <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Back</button>
                <button 
                  onClick={handleLockSlot} 
                  disabled={!selectedSlot || loading}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {loading ? 'Locking...' : 'Lock Slot & Continue'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><User className="text-blue-500" /> Your Details & Payment</h3>
             
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex justify-between items-center">
               <div>
                 <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">Total Fee</p>
                 <p className="text-xs text-blue-600 font-medium">Standard Service Charge</p>
               </div>
               <div className="text-3xl font-black text-blue-700">₹10</div>
             </div>
             
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6 flex justify-between items-center">
               <div className="flex items-center gap-3 text-amber-800 font-bold">
                 <Clock className="animate-pulse" />
                 <span>Slot Locked! Complete payment in:</span>
               </div>
               <div className="text-2xl font-black text-amber-600">
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
             </div>

             <form onSubmit={handleBooking} className="space-y-5">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input required type="text" className="w-full pl-10 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition-all" 
                     value={formData.citizen_name} onChange={e => setFormData({...formData, citizen_name: e.target.value})} placeholder="Jane Doe"/>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input required type="email" className="w-full pl-10 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition-all" 
                     value={formData.citizen_email} onChange={e => setFormData({...formData, citizen_email: e.target.value})} placeholder="jane@example.com"/>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="tel" className="w-full pl-10 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 transition-all" 
                     value={formData.citizen_phone} onChange={e => setFormData({...formData, citizen_phone: e.target.value})} placeholder="+1 234 567 8900"/>
                 </div>
               </div>
               
               <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <button type="button" onClick={() => setStep(3)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Back</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {loading ? 'Processing...' : 'Pay ₹10 & Book'} <CreditCard size={18} />
                  </button>
               </div>
             </form>
          </div>
        )}

        {step === 5 && bookingResult && (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Booking & Payment Confirmed!</h3>
            <p className="text-slate-500 mb-8 font-medium">We've sent a confirmation email to {formData.citizen_email}</p>
            
            <div className="bg-slate-50 rounded-2xl p-8 mb-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">PAID</div>
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-left w-full">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Your Token Number</p>
                  <div className="text-6xl font-black text-blue-600 tracking-tighter mb-4">#{bookingResult.token_number}</div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left mt-6 pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Service</p>
                      <p className="font-bold text-slate-800">{bookingResult.service || selectedService?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase">Date & Time</p>
                      <p className="font-bold text-slate-800">{bookingResult.date || selectedDate} at {bookingResult.start_time?.substring(0,5) || selectedSlot?.start_time?.substring(0,5)}</p>
                    </div>
                  </div>
                </div>

                {bookingResult.unique_hash && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
                    <QRCode 
                      value={`${window.location.origin}/ticket/${bookingResult.unique_hash}`} 
                      size={128} 
                    />
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-mono tracking-widest">{bookingResult.unique_hash.split('-')[0]}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button onClick={() => window.print()} className="px-6 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                Print Ticket
              </button>
              <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                Book Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
