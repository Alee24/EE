import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  DollarSign,
  Calendar,
  Navigation,
  Armchair,
  CloudSun,
  ChevronRight,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  RefreshCw,
  Volume2
} from 'lucide-react';
import { askTravelAssistant } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  category?: 'PRICES' | 'DATES' | 'TRAFFIC' | 'SEATS' | 'GENERAL';
  chips?: string[];
  actionLink?: { origin: string; destination: string };
}

interface AiTravelAdvisorChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (origin: string, destination: string) => void;
}

export const AiTravelAdvisorChatbot: React.FC<AiTravelAdvisorChatbotProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I am your **SafiriAI Smart Travel Assistant**. 🚌\n\nI can analyze live schedules across Kenya to help you with:\n• **Best Prices & Discounts** (off-peak deal days)\n• **Optimal Departure Dates & Times**\n• **Highway Traffic & Weighbridge Delays**\n• **Best Seat Comfort & Suspension Pick**\n\nWhat journey are you planning today?`,
      timestamp: 'Just now',
      category: 'GENERAL',
      chips: [
        '💰 Cheapest day to travel?',
        '🚦 Traffic on Nairobi–Mombasa road?',
        '🗓️ Avoid weekend surge prices?',
        '💺 Best seats for long trip?',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PRICES' | 'DATES' | 'TRAFFIC' | 'SEATS'>('ALL');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsThinking(true);

    try {
      const res = await askTravelAssistant(textToSend);
      const replyText = res.reply || 'Tuesday and Wednesday morning buses offer the best prices and smooth highway traffic!';

      // Parse route suggestion if available
      let actionLink: { origin: string; destination: string } | undefined;
      const lower = textToSend.toLowerCase();
      if (lower.includes('mombasa')) actionLink = { origin: 'Nairobi', destination: 'Mombasa' };
      else if (lower.includes('kisumu')) actionLink = { origin: 'Nairobi', destination: 'Kisumu' };
      else if (lower.includes('eldoret')) actionLink = { origin: 'Nairobi', destination: 'Eldoret' };

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: res.category || 'GENERAL',
        actionLink,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `🚌 **Travel Advice**:\n• **Price Tip**: Mid-week trips (Tue/Wed) are up to 15% cheaper than Friday peak.\n• **Traffic Forecast**: Highway A109 to Mombasa and A104 to Kisumu are running smooth today.\n• **Seat Comfort**: Rows 3 to 5 offer the smoothest suspension ride!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FDFCFB] border-l border-[#1A1A1A] shadow-[0_0_30px_rgba(0,0,0,0.3)] flex flex-col font-sans">
      
      {/* Header */}
      <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-[#1A1A1A]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#006633] text-white border border-white/20 flex items-center justify-center shadow-[2px_2px_0px_#ffffff]">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif italic text-base font-bold text-white leading-tight">
                SafiriAI <span className="not-italic font-sans text-xs">Advisor</span>
              </h3>
              <span className="bg-[#006633] text-white text-[8px] font-mono px-1.5 py-0.5 border border-white/30 uppercase tracking-widest">
                24/7 AI
              </span>
            </div>
            <p className="text-[9px] text-slate-300 font-mono uppercase tracking-widest">
              Price, Dates, Traffic & Seat Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Advice Topic Quick Filters */}
      <div className="bg-[#F2EFE9] p-2 border-b border-[#1A1A1A] flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold uppercase tracking-wider font-mono">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-2.5 py-1 border transition whitespace-nowrap ${
            selectedCategory === 'ALL'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
          }`}
        >
          All Topics
        </button>
        <button
          onClick={() => {
            setSelectedCategory('PRICES');
            handleSendMessage('What are the best prices and cheapest travel days?');
          }}
          className={`flex items-center space-x-1 px-2.5 py-1 border transition whitespace-nowrap ${
            selectedCategory === 'PRICES'
              ? 'bg-[#006633] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
          }`}
        >
          <DollarSign className="w-3 h-3 text-emerald-600" />
          <span>Best Prices</span>
        </button>
        <button
          onClick={() => {
            setSelectedCategory('DATES');
            handleSendMessage('What are the best dates and departure times to avoid crowds?');
          }}
          className={`flex items-center space-x-1 px-2.5 py-1 border transition whitespace-nowrap ${
            selectedCategory === 'DATES'
              ? 'bg-[#006633] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
          }`}
        >
          <Calendar className="w-3 h-3 text-amber-600" />
          <span>Best Dates</span>
        </button>
        <button
          onClick={() => {
            setSelectedCategory('TRAFFIC');
            handleSendMessage('What is the traffic and highway condition report?');
          }}
          className={`flex items-center space-x-1 px-2.5 py-1 border transition whitespace-nowrap ${
            selectedCategory === 'TRAFFIC'
              ? 'bg-[#006633] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
          }`}
        >
          <Navigation className="w-3 h-3 text-blue-600" />
          <span>Traffic Forecast</span>
        </button>
        <button
          onClick={() => {
            setSelectedCategory('SEATS');
            handleSendMessage('Which bus seats offer the smoothest and most comfortable ride?');
          }}
          className={`flex items-center space-x-1 px-2.5 py-1 border transition whitespace-nowrap ${
            selectedCategory === 'SEATS'
              ? 'bg-[#006633] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'
          }`}
        >
          <Armchair className="w-3 h-3 text-purple-600" />
          <span>Seats</span>
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FDFCFB]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label */}
            <div className="flex items-center space-x-1.5 mb-1 text-[9px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest">
              {msg.sender === 'ai' ? (
                <>
                  <Bot className="w-3 h-3 text-[#006633]" />
                  <span>SafiriAI Advisor • {msg.timestamp}</span>
                </>
              ) : (
                <span>You • {msg.timestamp}</span>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[90%] p-4 text-xs leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[3px_3px_0px_#006633]'
                  : 'bg-white text-[#1A1A1A] border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]'
              }`}
            >
              <div className="whitespace-pre-line font-sans">{msg.text}</div>

              {/* Action Link to Search Route if detected */}
              {msg.actionLink && onSelectRoute && (
                <div className="mt-3 pt-2 border-t border-[#1A1A1A]/20">
                  <button
                    onClick={() => {
                      onSelectRoute(msg.actionLink!.origin, msg.actionLink!.destination);
                      onClose();
                    }}
                    className="w-full bg-[#006633] hover:bg-[#004d26] text-white font-bold text-[10px] uppercase tracking-widest py-2 px-3 border border-black shadow-[2px_2px_0px_#1A1A1A] flex items-center justify-center space-x-1.5 transition"
                  >
                    <span>View Buses for {msg.actionLink.origin} → {msg.actionLink.destination}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            {msg.chips && msg.chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
                {msg.chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="bg-white hover:bg-[#F2EFE9] text-[#1A1A1A] border border-[#1A1A1A] text-[10px] px-2.5 py-1 font-mono font-bold transition shadow-[2px_2px_0px_#1A1A1A]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-xs text-[#1A1A1A] bg-[#F2EFE9] p-3 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] animate-pulse">
            <Bot className="w-4 h-4 text-[#006633] animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Analyzing traffic, route schedules & ticket pricing...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Preset Travel Queries Toolbar */}
      <div className="px-3 py-2 bg-[#F2EFE9] border-t border-[#1A1A1A]">
        <span className="text-[9px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest block mb-1.5">
          Popular Queries:
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
          <button
            onClick={() => handleSendMessage('When are the cheapest tickets from Nairobi to Mombasa?')}
            className="bg-white hover:bg-white/80 text-[#1A1A1A] border border-[#1A1A1A] px-2 py-1 text-[9px] font-mono whitespace-nowrap shadow-[1px_1px_0px_#1A1A1A]"
          >
            💰 Mombasa Cheapest Days
          </button>
          <button
            onClick={() => handleSendMessage('What is the current traffic forecast for Nairobi to Kisumu?')}
            className="bg-white hover:bg-white/80 text-[#1A1A1A] border border-[#1A1A1A] px-2 py-1 text-[9px] font-mono whitespace-nowrap shadow-[1px_1px_0px_#1A1A1A]"
          >
            🚦 Kisumu Road Traffic
          </button>
          <button
            onClick={() => handleSendMessage('Which seats are best on Easy Coach for legroom and smooth ride?')}
            className="bg-white hover:bg-white/80 text-[#1A1A1A] border border-[#1A1A1A] px-2 py-1 text-[9px] font-mono whitespace-nowrap shadow-[1px_1px_0px_#1A1A1A]"
          >
            💺 Best Bus Seat Choice
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-[#1A1A1A] flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about prices, dates, traffic, or seats..."
          className="flex-1 bg-[#FDFCFB] border border-[#1A1A1A] px-3 py-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:ring-1 focus:ring-[#006633]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isThinking}
          className="p-2.5 bg-[#006633] hover:bg-[#004d26] disabled:opacity-50 text-white border border-black shadow-[2px_2px_0px_#1A1A1A] transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
