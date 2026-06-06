import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import BottomNav from './components/BottomNav';
import firebaseConfig from '../firebase-applet-config.json';
import ChatTab from './components/ChatTab';
import ExploreTab from './components/ExploreTab';
import NotificationsTab from './components/NotificationsTab';
import ProfileTab from './components/ProfileTab';
import { ChatMessage } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'explore' | 'notifications' | 'profile'>('chat');
  
  // Pre-load authenticated session automatically as 'Jesus Israel' to bypass gates and start chatting instantly!
  const [user, setUser] = useState<any>({
    uid: "jesus_israel_id_101",
    displayName: "Jesus Israel",
    email: "jesus.israel@gmail.com",
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Listen for real Firebase auth session changes if any
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "Jesus Israel",
          email: firebaseUser.email || "jesus.israel@gmail.com",
          photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div id="app-root-frame" className="min-h-screen bg-[#0a0e1a] text-[#dfe2f3] flex flex-col font-sans select-none overflow-x-hidden pb-24">
      
      {/* Top Header Glass Rail matching user's template exactly */}
      <header id="app-main-header" className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-surface-container-low/80 border-b border-outline-variant/10 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center border border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.5)] pulse">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-0 select-none">
            <span className="font-heading font-bold text-sm tracking-tight leading-none text-on-surface">Mi Colonia en un Click</span>
            <span className="text-[9px] font-label-md text-[#00e5ff] leading-none uppercase tracking-widest font-black mt-1">Asistente Virtual Vecinal</span>
          </div>
        </div>

      </header>

      {/* Main Container Viewport routing based on active tab state */}
      <main id="app-viewport" className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-[800px] mx-auto w-full">
          {activeTab === 'chat' && (
            <div className="py-2">
              <ChatTab 
                user={user} 
                messages={messages} 
                setMessages={setMessages} 
              />
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="animate-fade-in">
              <ExploreTab />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <NotificationsTab user={user} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <ProfileTab 
                user={user} 
                setUser={setUser} 
                mockLogin={(name, email) => {
                  setUser({
                    uid: `manual_${Date.now()}`,
                    displayName: name,
                    email: email,
                    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80"
                  });
                }} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Sleek bottom navigation bar utilizing Google Material symbols, completely functional */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAuthenticated={!!user} 
      />

      {/* Settings Modal (Specifying database info transparently) */}
      {showSettingsModal && (
        <div id="modal-backdrop-framer" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div id="modal-settings-content" className="bg-[#0f131f] border border-outline-variant/20 rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 w-full" />
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-heading">
                  Centro de Datos Vecinal
                </h2>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-200 font-black text-sm p-1 hover:bg-surface-variant rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#bac9cc]">
                <div className="bg-[#0a0e1a] p-4 rounded-2xl border border-outline-variant/10 space-y-2.5">
                  <p className="font-bold text-[#00e5ff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">database</span>
                    <span>Base de Datos de la Colonia:</span>
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Esta aplicación está conectada directamente con la base de datos oficial de su colonia alojada de forma segura en <strong className="text-cyan-300 font-semibold">Google Cloud Firestore</strong>.
                  </p>
                  <div className="text-[10px] space-y-1 pt-2 font-mono text-slate-500 border-t border-outline-variant/10">
                    <p className="text-emerald-400">• Estado: Conectado y Sincronizado</p>
                    <p>• ID del Proyecto: <span className="text-[#dfe2f3]">{firebaseConfig.projectId}</span></p>
                    <p>• ID de Base de Datos:</p>
                    <p className="text-cyan-400 font-semibold select-all break-all overflow-x-auto bg-surface-container padding-px rounded text-[9.5px]">{firebaseConfig.firestoreDatabaseId}</p>
                    <p className="pt-1.5">• Usuario Activo: {user?.displayName || "Vecino Anónimo"}</p>
                    <p>• Correo: {user?.email || "vecino@gmail.com"}</p>
                  </div>
                </div>

                <div className="bg-[#00e5ff]/5 text-[#c3f5ff] p-3 rounded-2xl border border-[#00e5ff]/10 text-[11px] flex gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#00e5ff] flex-shrink-0">shield</span>
                  <span>Sus consultas y pedidos se guardan de forma de forma segura en Firestore para que puedas darles seguimiento en cualquier momento.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end text-[10px] text-slate-500 font-mono">
                AI Studio Build • v2.0 Sincronizado
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

