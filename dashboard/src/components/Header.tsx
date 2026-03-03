import { Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pnl' | 'cash' | 'balance';
  onTabChange: (tab: 'pnl' | 'cash' | 'balance') => void;
  onAIButtonClick: () => void;
}

export function Header({ activeTab, onTabChange, onAIButtonClick }: HeaderProps) {
  const getTabClass = (tabId: 'pnl' | 'cash' | 'balance') => {
    const base = "pb-3 uppercase text-[13px] tracking-wide relative top-[1px] font-bold ";
    if (activeTab === tabId) {
      return base + "text-dashboard-textMain border-b-2 border-dashboard-textMain";
    }
    return base + "text-dashboard-textMuted hover:text-dashboard-textMain border-b-2 border-transparent";
  };

  return (
    <header className="px-8 pt-8 pb-0 border-b border-dashboard-border bg-gradient-to-b from-blue-50/50 to-transparent">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dashboard-textMain mb-2">QuickBooks financial dashboard</h1>
          <p className="text-dashboard-textMuted text-[15px] max-w-3xl leading-relaxed">
            Tracks earnings, monitor cash flow, and analyze balance sheet changes with a dedicated dashboard that provides a clear picture of your business finances.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-dashboard-textMuted font-medium">
              <span className="w-5 h-5 rounded-full bg-[#009b48] flex items-center justify-center text-white text-[10px] font-bold">qb</span>
              QuickBooks Reports
            </div>
            <div className="flex items-center gap-2 text-sm text-dashboard-textMuted font-medium">
              <span className="w-5 h-5 rounded-full bg-[#007cc2] flex items-center justify-center text-white text-[10px] font-bold">qb</span>
              QuickBooks
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-6 pt-2">
          <div className="relative group cursor-pointer ml-2">
            {/* Animated outer glow layer */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00529b] via-[#007cc2] to-[#10b981] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 group-hover:duration-300 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            
            {/* Main button surface */}
            <button 
              onClick={onAIButtonClick}
              className="relative flex items-center gap-3 px-8 py-3.5 bg-white rounded-full font-bold border border-[#bae6fd] shadow-xl transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-[0_0_30px_rgba(0,124,194,0.4)]"
            >
              <div className="bg-gradient-to-br from-[#00529b] to-[#007cc2] p-2.5 rounded-full shadow-inner">
                <Sparkles className="w-5 h-5 text-white animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
              <div className="flex flex-col text-left pl-1">
                <span className="ai-gradient-text tracking-wide text-[17px] font-extrabold pb-0.5">Talk to AI</span>
                <span className="text-[11px] text-[#00529b] font-bold uppercase tracking-widest opacity-80">Grow your business</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <nav className="flex gap-8 text-[13px]">
        <button onClick={() => onTabChange('pnl')} className={getTabClass('pnl')}>Profit and Loss</button>
        <button onClick={() => onTabChange('cash')} className={getTabClass('cash')}>Cash Flow</button>
        <button onClick={() => onTabChange('balance')} className={getTabClass('balance')}>Balance Sheet</button>
      </nav>
    </header>
  );
}
