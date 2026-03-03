import { X, Send, Sparkles, TrendingUp, AlertCircle, BarChart3, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  text: string;
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: 'Hi there! I am your Financial Copilot. I can help you analyze your QuickBooks data, predict trends, or explain variances. How can we grow your business today?'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text: input };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    // Simulate AI thinking and responding
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I'm analyzing the requested data points from your dashboard. Based on the current burn rate and cash ratio, we should look into optimizing your 'Other Current Assets' to extend your runway."
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const suggestions = [
    { icon: TrendingUp, text: "Why did expenses jump in August?" },
    { icon: AlertCircle, text: "Analyze my current burn rate" },
    { icon: BarChart3, text: "Predict next month's cash flow" }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-[#181a20]/10 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white/90 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.08)] z-50 border-l border-white/50 flex flex-col transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dashboard-border/50 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#00529b] to-[#007cc2] p-2 rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[16px] text-dashboard-textMain tracking-tight">Financial Copilot</h2>
              <p className="text-[12px] text-dashboard-textMuted font-medium flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online and ready
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-dashboard-textMuted hover:bg-gray-100/80 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
              {msg.type === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#007cc2]" />
                </div>
              )}
              <div 
                className={`max-w-[85%] rounded-2xl p-4 text-[14px] leading-relaxed shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-dashboard-textMain text-white rounded-tr-none' 
                    : 'bg-white border border-[#bae6fd] text-dashboard-textMain rounded-tl-none shadow-[0_2px_10px_rgba(0,124,194,0.05)]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-dashboard-border/50">
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mb-4 animate-in fade-in duration-500 delay-300 fill-mode-both">
              {suggestions.map((suggestion, idx) => (
                <button 
                  key={idx}
                  onClick={() => setInput(suggestion.text)}
                  className="flex items-center gap-3 text-left w-full p-3 rounded-xl border border-dashboard-border/60 hover:border-[#007cc2]/30 hover:bg-[#f0f9ff] transition-all group text-[13px] text-dashboard-textMuted font-medium"
                >
                  <suggestion.icon className="w-4 h-4 text-dashboard-textMuted group-hover:text-[#007cc2] transition-colors" />
                  <span className="group-hover:text-dashboard-textMain transition-colors">{suggestion.text}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your finances..."
              className="w-full pl-5 pr-12 py-4 bg-gray-50/50 border border-dashboard-border rounded-full text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007cc2]/30 focus:border-[#007cc2]/50 transition-all placeholder:text-gray-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-2 p-2.5 rounded-full transition-all ${
                input.trim() 
                  ? 'bg-gradient-to-r from-[#00529b] to-[#007cc2] text-white shadow-md hover:shadow-lg hover:scale-105' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 ml-[2px]" />
            </button>
          </div>
          <div className="text-center mt-3 text-[11px] text-gray-400 font-medium tracking-wide">
            AI can make mistakes. Consider verifying important metrics.
          </div>
        </div>
      </div>
    </>
  );
}
