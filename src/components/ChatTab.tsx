import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatTabProps {
  user: any;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function ChatTab({ user, messages, setMessages }: ChatTabProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested chips inspired directly by the user's template and screenshot, aligned with restaurants
  const suggestionChips = [
    { label: '🌮 Buscar Tacos', prompt: 'Hola, búscame opciones de tacos mexicanos en el catálogo vecinal.' },
    { label: '🍕 Buscar Pizzas', prompt: 'Hola, recomiéndame una buena pizza o pasta italiana en la colonia.' },
    { label: '🍔 Burgers Premium', prompt: 'Quiero ver las opciones de hamburguesas artesanales que hay en la colonia.' },
    { label: '🍰 Postres y Café', prompt: 'Hola, recomiéndame cafeterías con buenos postres o pasteles.' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading || !user) return;

    // Create client message record
    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      userId: user.uid || user.id,
      text: textToSend,
      sender: 'user',
      createdAt: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Fetch response from server-side Express endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }

      const resData = await response.json();

      // If a booking is successfully parsed, persist it directly to Firestore securely
      if (resData.booking) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          const docId = `res_${Date.now()}`;
          const currentUserId = user?.uid || user?.id || 'anonymous';
          const descriptionStr = `Mesa para ${resData.booking.partySize} personas el ${resData.booking.dateTime}. Peticiones especiales: ${resData.booking.specialRequests}`;
          
          await setDoc(doc(db, 'reports', docId), {
            userId: currentUserId,
            description: descriptionStr,
            address: resData.booking.restaurantName,
            status: 'pending',
            createdAt: Date.now()
          });
          console.log("Successfully wrote booking to Firestore:", docId);
        } catch (dbErr) {
          console.error("Error writing booking to firestore:", dbErr);
        }
      }

      // Add bot message
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        userId: user.uid || user.id,
        text: resData.text,
        sender: 'bot',
        createdAt: Date.now(),
        mcpLogs: resData.mcpLogs
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      const botErrorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        userId: user.uid || user.id,
        text: 'Lo siento, tuve un problema para conectarme con mi base de datos de contexto. Por favor intenta de nuevo en un momento.',
        sender: 'bot',
        createdAt: Date.now()
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedTooltip = (message: string) => {
    alert(message);
  };

  const formatTime = (timeInMs: number) => {
    const date = new Date(timeInMs);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Regexp to split by bold **text** or markdown image ![alt](url)
      const parts = line.split(/(\*\*.*?\*\*|!\[.*?\]\(.*?\))/g);
      const elements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={pIdx} className="font-extrabold text-[#ffffff]">{boldText}</strong>;
        } else if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
          const altStart = 2;
          const altEnd = part.indexOf('](');
          const urlStart = altEnd + 2;
          const urlEnd = part.length - 1;
          const alt = part.slice(altStart, altEnd);
          const url = part.slice(urlStart, urlEnd);
          return (
            <div key={pIdx} className="my-2.5 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-md max-w-xs sm:max-w-sm">
              <img src={url} alt={alt} referrerPolicy="no-referrer" className="w-full max-h-52 object-cover" />
              {alt && <p className="text-[10px] text-center bg-surface-container-high/85 py-1 px-2.5 text-on-surface-variant">{alt}</p>}
            </div>
          );
        }
        return part;
      });

      return (
        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
          {elements}
        </p>
      );
    });
  };

  return (
    <div id="chat-tab-container" className="flex flex-col h-[calc(100vh-160px)] relative overflow-hidden pb-4">
      {/* Messages area simulating mobile app flow as shown in the screenshot */}
      <div 
        id="message-scroll-area" 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6 flex flex-col scrollbar-thin chat-container"
      >
        {/* Welcome baseline message */}
        <div id="assistant-welcome-message" className="flex flex-col gap-0.5 max-w-[85%] self-start select-text animate-fade-in">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center border border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              <img src="/logo.jpg" alt="Gigi" className="h-full w-full object-cover" />
            </div>
            <span className="font-heading font-bold text-xs text-[#00e5ff]">Gigi</span>
          </div>

          {/* Glowing left-border styled chat bubble matching screenshot */}
          <div className="bot-bubble rounded-[24px] rounded-bl-sm p-4 text-sm leading-relaxed text-on-surface">
            Hola, me llamo Gigi, tu concierge de confianza. ¿Qué te gustaría comer hoy?
          </div>
          <span className="text-[9px] font-label-md text-on-surface-variant/40 mt-1 ml-1 leading-none">10:30 AM</span>
        </div>

        {/* Dynamic dialogue history */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className={`flex flex-col gap-0.5 max-w-[85%] ${isUser ? 'self-end' : 'self-start'} select-text animate-fade-in`}
            >
              {!isUser && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center border border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                    <img src="/logo.jpg" alt="Gigi" className="h-full w-full object-cover" />
                  </div>
                  <span className="font-heading font-bold text-xs text-[#00e5ff]">Gigi</span>
                </div>
              )}
              
              <div 
                className={`text-sm leading-relaxed text-on-surface p-4 ${
                  isUser 
                    ? 'user-bubble rounded-[24px] rounded-br-sm' 
                    : 'bot-bubble rounded-[24px] rounded-bl-sm'
                }`}
              >
                {renderMessageText(msg.text)}

                {/* Intelligent database real-time query logs block if present */}
              </div>
              
              <span className={`text-[9px] font-label-md text-on-surface-variant/40 mt-1 ${isUser ? 'mr-1 text-right' : 'ml-1 text-left'}`}>
                {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}

        {/* Typing loading state */}
        {loading && (
          <div id="assistant-typing-container" className="flex flex-col gap-0.5 max-w-[85%] self-start select-none animate-pulse">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center border border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                <img src="/logo.jpg" alt="Gigi" className="h-full w-full object-cover" />
              </div>
              <span className="font-heading font-bold text-xs text-[#00e5ff]">Gigi</span>
            </div>
            <div className="bot-bubble rounded-[24px] rounded-bl-sm p-4 text-sm leading-relaxed text-[#00e5ff] flex items-center gap-2 font-medium">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] uppercase tracking-widest font-black text-on-surface-variant ml-2">Buscando en el menú de la colonia...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input container exactly styled matching template */}
      <div id="input-chat-footer" className="p-3 bg-transparent flex flex-col gap-2 max-w-[800px] mx-auto w-full z-40">
        
        {/* Suggested chips row rendered right above the input bar at all times */}
        <div id="suggestion-chips-block" className="flex gap-2 overflow-x-auto py-1 pl-1 scrollbar-none select-none w-full">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              id={`chip-${idx}`}
              onClick={() => handleSendMessage(chip.prompt)}
              className="bg-surface-container hover:bg-surface-variant border border-outline-variant/30 text-on-surface-variant hover:text-[#00e5ff] hover:border-[#00e5ff]/50 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_10px_rgba(0,229,255,0.15)] flex-shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="w-full flex items-center gap-2">
          {/* Rounded Input Pill with icons nested inside on the right */}
          <div className="flex-1 flex items-center h-12 bg-surface-container-high/90 border border-outline-variant/10 rounded-full pl-5 pr-2.5 backdrop-blur-xl focus-within:border-[#00e5ff]/50 transition duration-200">
            <input
              type="text"
              id="chat-input-field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder="Pregunta sobre restaurantes o pídele un antojo a Gigi..."
              className="flex-1 bg-transparent text-sm h-full outline-none text-on-surface placeholder-on-surface-variant/40"
            />

            {/* Interactive attachments nested in pill */}
            <div className="flex items-center gap-1.5 text-on-surface-variant/70">
              <button 
                id="btn-attachment"
                onClick={() => handleSimulatedTooltip('📎 Adjuntar Archivo: Puedes compartir una foto de un platillo o un menú para agregarlo a tus recomendaciones.')}
                className="flex items-center justify-center h-8 w-8 hover:text-[#00e5ff]/80 text-[#bac9cc] active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
              <button 
                id="btn-voice-mic"
                onClick={() => handleSimulatedTooltip('🎙️ Dictado de voz para antojos activado. Indica qué te gustaría comer y buscaré opciones.')}
                className="flex items-center justify-center h-8 w-8 hover:text-[#00e5ff]/80 text-[#bac9cc] active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">mic</span>
              </button>
            </div>
          </div>

          {/* Separated solid Cyan circular send action button */}
          <button
            id="btn-send-message"
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-container text-on-primary-container glow-cyan group active:scale-95 duration-200 disabled:opacity-40 disabled:scale-100 disabled:bg-surface-variant disabled:text-on-surface-variant/40"
          >
            <span className="material-symbols-outlined text-[22px] text-on-primary-container transform group-hover:rotate-12 duration-200">
              send
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
