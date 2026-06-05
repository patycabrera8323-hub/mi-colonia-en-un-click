import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface OrdersTabProps {
  user: any;
}

export interface Order {
  id: string;
  userId: string;
  description: string; // Detail notes (requests, status)
  address: string; // Restaurant Name
  status: 'pending' | 'in_progress' | 'resolved'; // Managed as Pedido Recibido | En Camino | Entregado
  createdAt: number;
}

export default function NotificationsTab({ user }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'reports'), // Connected to 'reports' to align with security rules
        where('userId', '==', user?.uid || user?.id || 'anonymous')
      );
      const snapshot = await getDocs(q);
      const fetched: Order[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as any);
      });

      // If exactly 0 reports/orders are found, seed an initial placeholder to physically instantiate the database collection in their console!
      if (fetched.length === 0) {
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          const initialDocId = `seed_${Date.now()}`;
          const currentUserId = user?.uid || user?.id || 'anonymous';
          const seedOrderData = {
            userId: currentUserId,
            description: "¡Felicidades! Se ha inicializado tu base de datos de Cloud Firestore. Mesa para 2 comensales, solicitud: terraza libre de humo.",
            address: "La Piazza Bella",
            status: 'pending' as const,
            createdAt: Date.now()
          };
          await setDoc(doc(db, 'reports', initialDocId), seedOrderData);
          fetched.push({ id: initialDocId, ...seedOrderData });
          console.log("Successfully seeded initial Firestore report item:", initialDocId);
        } catch (seedErr) {
          console.error("Failed to write seed document to Firestore:", seedErr);
        }
      }

      // Sort descending by creation date
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(fetched);
    } catch (e) {
      console.error("Error fetching orders:", e);
      // Fallback local state if index is still registering
      const saved = localStorage.getItem(`orders_${user?.uid}`);
      if (saved) {
        setOrders(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="notifications-tab" className="w-full max-w-md mx-auto p-4 space-y-5 pb-24">
      {/* Header */}
      <div id="res-header-block" className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[24px]">notifications</span>
            Notificaciones
          </h2>
          <p className="text-xs text-slate-400">Estado de tus pedidos en tiempo real</p>
        </div>
        {user && (
          <button 
            id="refresh-res-btn"
            onClick={fetchOrders} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Interactive Status Panel representing state colors requested */}
      <div id="status-color-panel" className="bg-[#0f131f] border border-outline-variant/10 p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
          <span className="material-symbols-outlined text-[15px] text-[#00e5ff]">palette</span>
          <h4 className="text-[10px] font-bold tracking-wider text-[#00e5ff] uppercase">
            Panel de Estados de Pedidos
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-bold">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Pedido Recibido</span>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-pulse"></span>
            <span>En Camino</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl flex flex-col items-center justify-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Entregado</span>
          </div>
        </div>
      </div>

      {/* Synchronized Reservations list */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Mis Pedidos Gastronómicos
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div id="reservations-list-block" className="space-y-3">
            {orders.map((res) => (
              <div
                key={res.id}
                id={`res-card-${res.id}`}
                className="bg-[#0f131f] border border-outline-variant/10 p-4 rounded-xl space-y-2 relative"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] text-[#bac9cc] bg-[#0a0e1a] border border-slate-800 px-2 py-0.5 rounded">
                    ID: {res.id.substring(0, 8)}
                  </span>
                  
                  <span
                    className={`text-[9.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      res.status === 'resolved'
                        ? 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/20'
                        : res.status === 'in_progress'
                          ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {res.status === 'resolved' ? (
                      <>
                        <CheckCircle className="w-2.5 h-2.5" /> Entregado
                      </>
                    ) : res.status === 'in_progress' ? (
                      <>
                        <Clock className="w-2.5 h-2.5 font-bold animate-pulse" /> En Camino
                      </>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5 font-bold animate-pulse" /> Pedido Recibido
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-cyan-400" />
                  <h4 className="text-xs font-heading font-bold text-[#dfe2f3]">{res.address}</h4>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-relaxed font-body-md pl-5">
                  {res.description}
                </p>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1.5 pl-5 border-t border-slate-800/40">
                  <span>Sincronizado con Cloud Firestore</span>
                  <span>{new Date(res.createdAt).toLocaleString('es-ES')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
            No tienes ningún pedido gastronómico activo en tu cuenta. ¡Pídele algo rico a Gigi en el chat!
          </div>
        )}
      </div>
    </div>
  );
}
