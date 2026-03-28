import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const FAQ_DATA = [
  {
    keywords: ["profit", "sales", "revenue", "low"],
    answers: [
      "Your profit is low because either your sales decreased or your expenses increased. Check if costs like ads, rent, or salaries have gone up.",
      "You can increase profit by increasing sales, reducing unnecessary expenses, or improving product pricing.",
      "Try improving marketing, offering discounts, or understanding customer needs better.",
      "Your business is doing well if your sales are growing, expenses are controlled, and profit is positive."
    ]
  },
  {
    keywords: ["expense", "cost", "spend", "overspend"],
    answers: [
      "Reduce unnecessary spending, review fixed costs, and focus only on important business expenses.",
      "If your expenses are increasing faster than your sales, you are overspending.",
      "Yes, if expenses are affecting your profit or cash flow, you should reduce them."
    ]
  },
  {
    keywords: ["ad", "marketing", "advertisement"],
    answers: [
      "⚠️ Risky. Start with a smaller test budget like ₹2,000–₹3,000 and check results first.",
      "Ads are working if they are bringing more sales than the money you spend on them.",
      "Spend a small percentage of your revenue and increase only if results are good."
    ]
  },
  {
    keywords: ["hire", "employee", "team", "staff"],
    answers: [
      "Hire only if your workload is high and your business can afford the salary.",
      "Hire when your business is growing and you cannot manage work alone.",
      "⚠️ Yes, hiring is risky if your income is unstable or cash is low."
    ]
  },
  {
    keywords: ["price", "pricing"],
    answers: [
      "Increase price if your costs are high or demand is strong.",
      "Check pricing, improve product value, or offer discounts if customers aren't buying."
    ]
  },
  {
    keywords: ["risk", "money", "danger", "safe"],
    answers: [
      "Your business is at risk if expenses are high, cash is low, or sales are decreasing.",
      "If your expenses are higher than your income, your cash may run out soon.",
      "A decision is risky if it involves high spending without guaranteed return.",
      "A decision is safe if it has low risk and fits your budget."
    ]
  },
  {
    keywords: ["grow", "growth", "expand", "focus"],
    answers: [
      "Focus on increasing sales, improving marketing, and keeping customers happy.",
      "Expand only if your current business is stable and profitable.",
      "Focus on increasing sales, reducing unnecessary costs, and solving urgent problems."
    ]
  },
  {
    keywords: ["health", "well", "score"],
    answers: [
      "Your business health depends on profit, sales growth, and expense control.",
      "Increase sales, reduce costs, and maintain steady cash flow to improve your health score.",
      "Growth may be slow due to low sales, poor marketing, or high expenses."
    ]
  },
  {
    keywords: ["next", "help", "do", "better"],
    answers: [
      "Focus on actions that increase revenue and reduce waste.",
      "Yes, I analyze your business data and guide you before you take action!"
    ]
  }
];

const DEFAULT_ANSWER = "I'm here to help! Try asking about 'Profit', 'Ads', 'Expenses', 'Hiring', or 'Risk'.";
const PURCHASE_CTA = "\n\n🚀 Want deeper insights tailored to your actual business data? Get started with ProfitPilot today for a full analysis!";

const SUGGESTIONS = [
  "How to increase profit?",
  "Should I spend on ads?",
  "Is my business at risk?",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! I'm your ProfitPilot assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Bot Response Logic
    setTimeout(() => {
      const query = text.toLowerCase();
      let botText = "";

      // Smart Matching
      const category = FAQ_DATA.find(cat => 
        cat.keywords.some(kw => query.includes(kw))
      );

      if (category) {
        // Find best match or random from category
        const randomIdx = Math.floor(Math.random() * category.answers.length);
        botText = category.answers[randomIdx];
      } else {
        botText = DEFAULT_ANSWER;
      }

      const botMessage: Message = { 
        id: Date.now() + 1, 
        text: botText + PURCHASE_CTA, 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[350px] md:w-[400px] h-[500px] bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#FF8963] to-[#FF5A25] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white shadow-inner">
                  P
                </div>
                <div>
                  <h3 className="text-white font-bold leading-none">ProfitPilot Bot</h3>
                  <p className="text-white/70 text-xs mt-1">Always active</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.sender === 'user' 
                      ? 'bg-white/10 text-white self-end rounded-br-none' 
                      : 'bg-white text-black self-start rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map(s => (
                  <button 
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-[10px] bg-white/5 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-full transition-all text-white/70 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
              className="p-4 border-t border-white/5 flex gap-2"
            >
              <input 
                type="text"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF8963] transition-all"
              />
              <button 
                type="submit"
                className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-white/90 transition-all font-bold"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-linear-to-b from-[#FF8963] to-[#FF5A25] rounded-full flex items-center justify-center shadow-2xl pointer-events-auto border border-white/20 active:shadow-inner"
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </motion.div>
            ) : (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -45 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}
