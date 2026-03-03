import { KPICard } from '../components/KPICard';
import { Menu } from 'lucide-react';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { months } from '../data/mockData';

const assetsData = months.map(m => ({
  name: m,
  "Bank": Math.floor(Math.random() * 500000) + 200000,
  "Long-term Assets": Math.floor(Math.random() * 400000) + 300000,
  "Other Current Assets": Math.floor(Math.random() * 100000) + 50000,
}));

const liabilitiesData = months.map(m => ({
  name: m,
  "Current Liabilities": Math.floor(Math.random() * 300000) + 100000,
  "Equity": Math.floor(Math.random() * 500000) + 200000,
  "Non-current Liabilities": Math.floor(Math.random() * 200000) + 50000,
}));

const ratioData = [
  { name: "Assets", value1: 650000, value2: 250000, value3: 500000 },
  { name: "Liabilities and Equity", value1: 200000, value2: 1200000, value3: 150000 }
];

export function BalanceSheet() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <h2 className="text-[20px] font-medium text-dashboard-textMain mb-6 tracking-tight">Balance Sheet overview</h2>
      
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard title="Assets (current)" value="$1.4M" />
        <KPICard title="Liabilities (current)" value="$1.2M" />
        <KPICard title="Equity (current)" value="$214.9K" />
        <KPICard title="Assets to Equity Ratio" value="7.28" />
        <KPICard title="Debt to Assets Ratio" value="0.86" />
        <KPICard title="Debt to Equity Ratio" value="6.28" />
      </div>

      {/* Middle Section: 50/50 Multi-series Stacked Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assets Chart */}
        <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight">Assets past 12 mos</h3>
            <button className="text-dashboard-textMuted hover:text-dashboard-textMain">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4 items-center mb-4 text-[13px] font-medium text-dashboard-textMuted">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007cc2]"></span> Bank
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ac3d31]"></span> Long-term Assets
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e3ac1e]"></span> Other Current Assets
            </div>
          </div>
          <div className="h-[250px]">
            <StackedBarChart 
              data={assetsData} 
              bars={[
                { key: 'Bank', color: '#007cc2' },
                { key: 'Long-term Assets', color: '#ac3d31' },
                { key: 'Other Current Assets', color: '#e3ac1e' }
              ]}
              yAxisFormatter={(val) => `$${(val/1000000).toFixed(1)}M`}
            />
          </div>
        </div>

        {/* Liabilities Chart */}
        <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight">Liabilities and Equity past 12 mos</h3>
            <button className="text-dashboard-textMuted hover:text-dashboard-textMain">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4 items-center mb-4 text-[13px] font-medium text-dashboard-textMuted">
             <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007cc2]"></span> Current Liabilities
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ac3d31]"></span> Equity
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e3ac1e]"></span> Non-current Liabilities
            </div>
          </div>
          <div className="h-[250px]">
            <StackedBarChart 
              data={liabilitiesData} 
              bars={[
                { key: 'Current Liabilities', color: '#007cc2' },
                { key: 'Equity', color: '#ac3d31' },
                { key: 'Non-current Liabilities', color: '#e3ac1e' }
              ]}
              yAxisFormatter={(val) => `$${(val/1000000).toFixed(1)}M`}
            />
          </div>
        </div>
      </div>

       {/* Lower Section: Comparative Stacked Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
           <div className="h-[250px]">
               <StackedBarChart 
                data={ratioData} 
                bars={[
                  { key: 'value1', color: '#31a64f' },
                  { key: 'value2', color: '#007cc2' },
                  { key: 'value3', color: '#00adef' }
                ]}
                yAxisFormatter={(val) => `$${(val/1000000).toFixed(1)}M`}
              />
           </div>
        </div>
        <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="h-[250px]">
                <StackedBarChart 
                data={ratioData} 
                bars={[
                  { key: 'value1', color: '#31a64f' },
                  { key: 'value2', color: '#e3ac1e' },
                  { key: 'value3', color: '#7a31a6' } // purple shade
                ]}
                yAxisFormatter={(val) => `$${(val/1000000).toFixed(1)}M`}
              />
            </div>
        </div>
      </div>

      {/* Bottom Section: Data Table */}
      <div className="bg-dashboard-card border border-dashboard-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-dashboard-border bg-[#F8F9FB]">
          <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight">Balance Sheet statement</h3>
        </div>
        <div className="px-6 pb-6">
          <table className="w-full text-left text-[14px] text-dashboard-textSecondary mt-2">
            <thead>
              <tr className="border-b border-dashboard-border font-bold text-dashboard-textMain">
                <th className="py-4 font-bold">Account type</th>
                <th className="py-4 font-bold">Today</th>
                <th className="py-4 font-bold">Last month</th>
                <th className="py-4 font-bold">Year to date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4">Bank</td>
                <td className="py-4">$744,469</td>
                <td className="py-4">$641,996</td>
                <td className="py-4">$744,469</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-dashboard-textMuted">Accounts Receivable</td>
                <td className="py-4 text-dashboard-textMuted">$66,735</td>
                <td className="py-4 text-dashboard-textMuted">$319,097</td>
                <td className="py-4 text-dashboard-textMuted">$66,735</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-dashboard-textMuted">Fixed Assets</td>
                <td className="py-4 text-dashboard-textMuted">$61,725</td>
                <td className="py-4 text-dashboard-textMuted">$61,725</td>
                <td className="py-4 text-dashboard-textMuted">$61,725</td>
              </tr>
              <tr className="">
                <td className="py-4 text-dashboard-textMuted">Long-term Assets</td>
                <td className="py-4 text-dashboard-textMuted">$500,000</td>
                <td className="py-4 text-dashboard-textMuted">$500,000</td>
                <td className="py-4 text-dashboard-textMuted">$500,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
