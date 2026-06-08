import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, BarChart3, CalendarDays, Server, Plus, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Analytics State
  const [analytics, setAnalytics] = useState({ total_booked: 0, total_served: 0, total_no_shows: 0, avg_wait_minutes: 0 });
  
  // Services State
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', code: '', start_time: '09:00', end_time: '17:00', number_of_slots: 20 });
  
  // Slots State
  const [slots, setSlots] = useState([]);
  const [selectedServiceForSlots, setSelectedServiceForSlots] = useState('');
  const [selectedDateForSlots, setSelectedDateForSlots] = useState(new Date().toISOString().split('T')[0]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/admin/analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Services
  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/services/');
      setServices(res.data);
      if (res.data.length > 0 && !selectedServiceForSlots) {
        setSelectedServiceForSlots(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Slots
  const fetchSlots = async () => {
    if (!selectedServiceForSlots || !selectedDateForSlots) return;
    try {
      const res = await axios.get(`/api/slots/?service_id=${selectedServiceForSlots}&date=${selectedDateForSlots}`);
      setSlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchServices();
  }, []);

  useEffect(() => {
    if (activeTab === 'slots') fetchSlots();
  }, [activeTab, selectedServiceForSlots, selectedDateForSlots]);

  // Service Actions
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/services/', newService);
      setNewService({ name: '', code: '', start_time: '09:00', end_time: '17:00', number_of_slots: 20 });
      fetchServices();
    } catch (err) {
      alert("Failed to create service");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await axios.delete(`/api/services/${id}/`);
      fetchServices();
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  // Slot Actions
  const handleToggleBlockSlot = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'booked' : 'available';
      await axios.put(`/api/slots/${id}/`, { status: newStatus });
      fetchSlots();
    } catch (err) {
      alert("Failed to update slot");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 pt-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 font-medium mt-1">Manage services, slots, and view analytics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => setActiveTab('analytics')} className={`p-6 rounded-2xl shadow-sm border text-center transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 shadow-md' : 'bg-white border-slate-200 hover:shadow-md'}`}>
          <BarChart3 className={`mx-auto mb-3 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-purple-500'}`} size={32} />
          <h3 className="font-bold text-slate-800">Analytics</h3>
        </div>
        <div onClick={() => setActiveTab('services')} className={`p-6 rounded-2xl shadow-sm border text-center transition-all cursor-pointer ${activeTab === 'services' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 shadow-md' : 'bg-white border-slate-200 hover:shadow-md'}`}>
          <Server className={`mx-auto mb-3 ${activeTab === 'services' ? 'text-blue-600' : 'text-blue-500'}`} size={32} />
          <h3 className="font-bold text-slate-800">Services</h3>
        </div>
        <div onClick={() => setActiveTab('slots')} className={`p-6 rounded-2xl shadow-sm border text-center transition-all cursor-pointer ${activeTab === 'slots' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 shadow-md' : 'bg-white border-slate-200 hover:shadow-md'}`}>
          <CalendarDays className={`mx-auto mb-3 ${activeTab === 'slots' ? 'text-blue-600' : 'text-emerald-500'}`} size={32} />
          <h3 className="font-bold text-slate-800">Slots & Capacity</h3>
        </div>
        <div className={`p-6 rounded-2xl shadow-sm border text-center bg-white border-slate-200 opacity-50 cursor-not-allowed`}>
          <Settings className="mx-auto mb-3 text-slate-500" size={32} />
          <h3 className="font-bold text-slate-800">Settings</h3>
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Today's Live Overview</h2>
            <button onClick={fetchAnalytics} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Refresh Data</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Total Booked</p>
              <p className="text-5xl font-black text-slate-800">{analytics.total_booked}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <p className="text-sm text-emerald-700 font-bold uppercase tracking-wider mb-2">Served</p>
              <p className="text-5xl font-black text-emerald-600">{analytics.total_served}</p>
            </div>
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <p className="text-sm text-amber-700 font-bold uppercase tracking-wider mb-2">No Shows</p>
              <p className="text-5xl font-black text-amber-600">{analytics.total_no_shows}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <p className="text-sm text-blue-700 font-bold uppercase tracking-wider mb-2">Avg Wait</p>
              <p className="text-5xl font-black text-blue-600">{analytics.avg_wait_minutes}<span className="text-2xl ml-1">m</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Active Services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Time Range</th>
                    <th className="p-3">Slots</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-500">#{s.id}</td>
                      <td className="p-3 font-bold text-slate-800">{s.name}</td>
                      <td className="p-3 font-mono text-sm text-slate-500">{s.start_time} - {s.end_time}</td>
                      <td className="p-3 text-slate-600">{s.number_of_slots}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No active services.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Plus size={20} className="text-blue-600"/> New Service</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name</label>
                <input required type="text" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="e.g. Passport Renewal"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug Code (Unique)</label>
                <input required type="text" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                  value={newService.code} onChange={e => setNewService({...newService, code: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="passport-renewal"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                  <input required type="time" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newService.start_time} onChange={e => setNewService({...newService, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                  <input required type="time" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newService.end_time} onChange={e => setNewService({...newService, end_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Number of Slots per day</label>
                <input required type="number" min="1" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newService.number_of_slots} onChange={e => setNewService({...newService, number_of_slots: Number(e.target.value)})} />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md mt-4">
                Create Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800">Manage Slots (Auto-Generated)</h2>
              <div className="flex gap-4">
                <select 
                  value={selectedServiceForSlots} 
                  onChange={e => setSelectedServiceForSlots(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm font-medium outline-none"
                >
                  <option value="">Select Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input 
                  type="date" 
                  value={selectedDateForSlots} 
                  onChange={e => setSelectedDateForSlots(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm font-medium outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-3">Time Range</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map(s => (
                    <tr key={s.id} className={`transition-colors ${s.status === 'booked' ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 font-bold text-slate-800">{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</td>
                      <td className="p-3">
                        {s.status === 'locked' ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Locked (Payment Pending)</span>
                        ) : s.status === 'booked' ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Booked</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Available</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleToggleBlockSlot(s.id, s.status)} 
                          className={`p-2 rounded-lg transition-colors flex items-center justify-end w-full gap-2 text-sm font-bold ${s.status !== 'available' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {s.status !== 'available' ? <><CheckCircle size={16}/> Make Available</> : <><Ban size={16}/> Block Slot</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {slots.length === 0 && selectedServiceForSlots && (
                    <tr><td colSpan="3" className="p-8 text-center text-slate-500">No slots generated. Select date to generate.</td></tr>
                  )}
                  {!selectedServiceForSlots && (
                    <tr><td colSpan="3" className="p-8 text-center text-slate-500">Please select a service first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
