import React from 'react';

interface BottomNavProps {
  activeTab: 'chat' | 'explore' | 'notifications' | 'profile';
  setActiveTab: (tab: 'chat' | 'explore' | 'notifications' | 'profile') => void;
  isAuthenticated: boolean;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'chat', label: 'Chat', symbol: 'chat_bubble' },
    { id: 'explore', label: 'Explorar', symbol: 'explore' },
    { id: 'notifications', label: 'Notificaciones', symbol: 'notifications' },
    { id: 'profile', label: 'Mi Perfil', symbol: 'person' },
  ] as const;

  return (
    <nav 
      id="bottom-nav-container" 
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 bg-surface-container-low/95 border-t border-outline-variant/20 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] rounded-t-xl max-w-[800px] mx-auto left-1/2 -translate-x-1/2"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`bottom-nav-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center cursor-pointer select-none group focus:outline-none"
          >
            <div 
              className={`flex items-center justify-center rounded-full w-11 h-11 transition-all duration-300 relative ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-110' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {tab.symbol}
              </span>
              {tab.id === 'notifications' && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container"></span>
                </span>
              )}
            </div>
            <span 
              className={`text-[9px] tracking-wide mt-1 select-none font-semibold transition-colors duration-300 ${
                isActive ? 'text-[#00e5ff]' : 'text-on-surface-variant/70'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

