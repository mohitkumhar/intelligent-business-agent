import { useState } from 'react';
import { Header } from './components/Header';
import { ProfitAndLoss } from './pages/ProfitAndLoss';
import { CashFlow } from './pages/CashFlow';
import { BalanceSheet } from './pages/BalanceSheet';
import { AIChatSidebar } from './components/AIChatSidebar';

function App() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'cash' | 'balance'>('pnl');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dashboard-bg font-sans relative overflow-x-hidden">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAIButtonClick={() => setIsAISidebarOpen(true)}
      />
      <main className="px-8 py-8">
        {activeTab === 'pnl' && <ProfitAndLoss />}
        {activeTab === 'cash' && <CashFlow />}
        {activeTab === 'balance' && <BalanceSheet />}
      </main>
      
      <AIChatSidebar 
        isOpen={isAISidebarOpen} 
        onClose={() => setIsAISidebarOpen(false)} 
      />
    </div>
  );
}

export default App;
