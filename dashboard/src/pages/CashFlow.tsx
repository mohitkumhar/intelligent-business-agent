import { KPICard } from '../components/KPICard';
import { Menu } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line } from 'recharts';
import { months } from '../data/mockData';

const cashFlowData = months.map((m, idx) => ({
  name: m,
  "Closing Balance": Math.floor(Math.random() * 500000) + 200000 + (idx * 30000), // Upward trend
  "Cash Ratio": Number((Math.random() * 2 + 1.5 + (idx * 0.1)).toFixed(2)),
}));

export function CashFlow() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <h2 className="text-[20px] font-medium text-dashboard-textMain mb-6 tracking-tight">Cash flow overview</h2>
      
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* KPIs (1/3 width) */}
        <div className="grid grid-cols-2 gap-4">
          <KPICard title="Cash in Bank (current)" value="$744.5K" />
          <KPICard title="Cash Ratio" value="3.40" />
          <KPICard title="Burn Rate (avg 6 mos)" value="134.3K" />
          <KPICard title="Quick Ratio" value="5.09" />
          <KPICard title="Cash Runaway (months)" value="4.8" />
          <KPICard title="Current Ratio" value="5.09" />
        </div>
        
        {/* Main Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight">Cash in Bank past 12 mos</h3>
            <button className="text-dashboard-textMuted hover:text-dashboard-textMain">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-6 items-center mb-2 text-[13px] font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#007cc2]"></span>
              <span className="text-dashboard-textMuted">Closing Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-[#e3ac1e]"></span>
              <span className="text-dashboard-textMuted">Cash Ratio</span>
            </div>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={cashFlowData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E1E5F2" />
                <XAxis 
                  dataKey="name" 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{ fill: '#3e424f', fontSize: 13 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3e424f', fontSize: 13 }}
                  tickFormatter={(value) => `$${(value/1000).toFixed(1)}K`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3e424f', fontSize: 13 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E1E5F2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
                <Bar yAxisId="left" dataKey="Closing Balance" fill="#007cc2" radius={[2, 2, 0, 0]} maxBarSize={30} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="Cash Ratio" 
                  stroke="#e3ac1e" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Lower section placeholders (assuming more charts similar to Pnl based on standard dashboards) */}
      <div className="grid grid-cols-1 gap-6 mb-6">
         <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[400px] flex items-center justify-center text-gray-400 border-dashed">
             More Cash Flow metrics / charts placeholder
         </div>
      </div>
    </div>
  );
}
