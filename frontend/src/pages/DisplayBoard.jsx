import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function DisplayBoard() {
  const { serviceId } = useParams();
  const [servingList, setServingList] = useState([]);
  const [queue, setQueue] = useState([]);
  
  const fetchState = async () => {
    try {
      const [servingRes, queueRes] = await Promise.all([
        axios.get(`/api/tokens/serving/?service_id=${serviceId}`),
        axios.get(`/api/tokens/queue/?service_id=${serviceId}`)
      ]);
      setServingList(servingRes.data);
      setQueue(queueRes.data.map(t => t.token_number));
    } catch (err) {
      console.error("Failed to fetch initial state", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000); // Polling backup

    // WebSocket connection
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${wsScheme}://${window.location.host}/ws/display/${serviceId}/`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket Update Received:", data);
      
      // When a token is called/updated, re-fetch the state to ensure everything is perfectly synced
      // (This is safer than manually mutating arrays for this demo)
      fetchState();
    };
    
    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");
    
    return () => ws.close();
  }, [serviceId]);

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col p-8 overflow-hidden font-sans">
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-blue-400">GovQ Service Board</h1>
          <p className="text-xl text-slate-400 mt-2 font-medium">Service #{serviceId}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-mono text-slate-200">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-lg text-slate-500 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <div className="flex-grow grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col">
          <h2 className="text-3xl font-bold text-slate-300 mb-8 uppercase tracking-widest">Now Serving</h2>
          
          <div className="flex-grow flex flex-col justify-center space-y-6">
            {servingList.map((token, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between p-8 rounded-2xl border-4 transition-all duration-1000 ${
                  token.status === 'called' 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)]' 
                    : 'bg-slate-700 border-slate-600 opacity-80'
                }`}
              >
                <div>
                  <div className="text-2xl text-slate-400 font-bold uppercase tracking-wider mb-2">Token</div>
                  <div className={`font-black tracking-tighter text-blue-400 text-8xl`}>
                    #{token.token_number}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-slate-400 font-bold uppercase tracking-wider mb-2">Proceed To</div>
                  <div className={`font-black tracking-tighter text-white text-8xl`}>
                    Counter {token.counter_number}
                  </div>
                </div>
              </div>
            ))}
            {servingList.length === 0 && (
              <div className="text-center text-slate-500 text-3xl font-medium">No active tokens.</div>
            )}
          </div>
        </div>

        <div className="col-span-1 bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col">
          <h2 className="text-3xl font-bold text-slate-300 mb-8 uppercase tracking-widest text-center">Up Next</h2>
          
          <div className="flex-grow grid grid-cols-2 gap-4 content-start">
            {queue.slice(0, 10).map((tokenNum, i) => (
              <div key={i} className="bg-slate-700 rounded-xl p-6 text-center border border-slate-600">
                <div className="text-5xl font-black text-slate-300">#{tokenNum}</div>
              </div>
            ))}
            {queue.length === 0 && (
              <div className="col-span-2 mt-8 text-center text-slate-500 text-xl font-medium">Queue is empty.</div>
            )}
          </div>
          
          <div className="mt-8 text-center text-slate-500 text-lg font-medium">
            Please be ready with your documents.
          </div>
        </div>
      </div>
    </div>
  );
}
