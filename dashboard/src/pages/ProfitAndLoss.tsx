import { KPICard } from '../components/KPICard';
import { Menu } from 'lucide-react';
import { MainComboChart } from '../components/charts/MainComboChart';
import { SimpleLineChart } from '../components/charts/SimpleLineChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { DonutChart } from '../components/charts/DonutChart';
import { 
  lineChartData, 
  revenueData, 
  incomeByNameData, 
  expensesByTypeData, 
  expensesByNameData, 
  donutDataToday, 
  donutDataLastMonth 
} from '../data/mockData';

export function ProfitAndLoss() {
  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`;
  const formatPercent = (val: number) => `${val}%`;

  return (
    <div className="max-w-[1600px] mx-auto">
      <h2 className="text-[20px] font-medium text-dashboard-textMain mb-6 tracking-tight">Profit and Loss overview</h2>
      
      {/* Top Section: KPIs + Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* KPIs (1/3 width) */}
        <div className="grid grid-cols-2 gap-4">
          <KPICard title="Total Income" value="$2.6M" />
          <KPICard title="Total Gross Profit" value="$2.0M" />
          <KPICard title="Return on Assets" value="29%" />
          <KPICard title="Total Operating Profit (Loss)" value="$531.9K" />
          <KPICard title="Return on Equity" value="211%" />
          <KPICard title="Total Net Profit (Loss)" value="$488.4K" />
        </div>
        
        {/* Main Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight">Operating Income and Expenses past 12 mos</h3>
            <button className="text-dashboard-textMuted hover:text-dashboard-textMain">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-6 items-center mb-2 text-[13px] font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-dashboard-income"></span>
              <span className="text-dashboard-textMuted">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-dashboard-expense"></span>
              <span className="text-dashboard-textMuted">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-dashboard-margin"></span>
              <span className="text-dashboard-textMuted">Operating Margin</span>
            </div>
          </div>
          <div className="h-[300px]">
            <MainComboChart />
          </div>
        </div>
      </div>

      {/* Middle Section: 50/50 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <ChartCard 
            title="Gross Profit past 12 mos" 
            height={220}
            legend={[
              { label: 'Gross Profit', color: '#05759e', type: 'line' },
              { label: 'Gross Margin', color: '#e3ac1e', type: 'line' }
            ]}
          >
            <SimpleLineChart 
              data={lineChartData} 
              lines={[{ key: 'Gross Profit', color: '#05759e' }, { key: 'Gross Margin', color: '#e3ac1e' }]}
              yAxisFormatter={formatCurrency}
              rightAxisFormatter={formatPercent}
            />
          </ChartCard>

          <ChartCard 
            title="Operating Profit (Loss) past 12 mos" 
            height={220}
            legend={[
              { label: 'Operating Profit (Loss)', color: '#05759e', type: 'line' },
              { label: 'Operating Margin', color: '#e3ac1e', type: 'line' }
            ]}
          >
            <SimpleLineChart 
              data={lineChartData} 
              lines={[{ key: 'Operating Profit (Loss)', color: '#05759e' }, { key: 'Operating Margin', color: '#e3ac1e' }]}
              yAxisFormatter={formatCurrency}
              rightAxisFormatter={formatPercent}
            />
          </ChartCard>

          <ChartCard 
            title="Net Profit (Loss) past 12 mos" 
            height={220}
            legend={[
              { label: 'Net Profit (Loss)', color: '#05759e', type: 'line' },
              { label: 'Net Margin', color: '#e3ac1e', type: 'line' }
            ]}
          >
            <SimpleLineChart 
              data={lineChartData} 
              lines={[{ key: 'Net Profit (Loss)', color: '#05759e' }, { key: 'Net Margin', color: '#e3ac1e' }]}
              yAxisFormatter={formatCurrency}
              rightAxisFormatter={formatPercent}
            />
          </ChartCard>

          <ChartCard 
            title="Revenue past 12 mos" 
            height={300}
            legend={[
              { label: 'Cost of Goods Sold', color: '#05759e', type: 'dot' },
              { label: 'Gross Profit', color: '#ac3d31', type: 'dot' }
            ]}
          >
            <StackedBarChart 
              data={revenueData} 
              bars={[
                { key: 'Cost of Goods Sold', color: '#05759e' },
                { key: 'Gross Profit', color: '#ac3d31' }
              ]}
              yAxisFormatter={formatCurrency}
            />
          </ChartCard>

          <ChartCard 
            title="Income by Account name" 
            height={360}
            legend={[
              { label: 'Sales', color: '#05759e', type: 'dot' },
              { label: 'Service', color: '#ac3d31', type: 'dot' }
            ]}
          >
            <StackedBarChart 
              data={incomeByNameData} 
              bars={[
                { key: 'Sales', color: '#05759e' },
                { key: 'Service', color: '#ac3d31' }
              ]}
              yAxisFormatter={formatCurrency}
            />
          </ChartCard>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <ChartCard title="Expense by Account name as of today" height={340}>
            <div className="flex h-full">
              <div className="w-1/2 h-full py-4">
                <DonutChart data={donutDataToday} />
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-2 pl-4 text-[13px] text-dashboard-textMuted">
                {donutDataToday.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Expense by Account name as of the end of last month" height={340}>
            <div className="flex h-full">
              <div className="w-1/2 h-full py-4">
                <DonutChart data={donutDataLastMonth} />
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-2 pl-4 text-[13px] text-dashboard-textMuted">
                {donutDataLastMonth.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard 
            title="Expenses by Account type" 
            height={300}
            legend={[
              { label: 'Expense', color: '#05759e', type: 'dot' },
              { label: 'Cost of Goods Sold', color: '#ac3d31', type: 'dot' }
            ]}
          >
            <StackedBarChart 
              data={expensesByTypeData} 
              bars={[
                { key: 'Expense', color: '#05759e' },
                { key: 'Cost of Goods Sold', color: '#ac3d31' }
              ]}
              yAxisFormatter={formatCurrency}
            />
          </ChartCard>

          <ChartCard 
            title="Expenses by Account name" 
            height={360}
            legend={[
              { label: 'Wages & Salaries', color: '#0078D4', type: 'dot' },
              { label: 'Subcontractors', color: '#D13438', type: 'dot' },
              { label: 'Rent office space', color: '#FFB900', type: 'dot' },
              { label: 'Payroll Tax Expense', color: '#8764B8', type: 'dot' },
              { label: 'Payment Provider Fees Stripe', color: '#00B294', type: 'dot' },
              { label: 'Utilities office space', color: '#7A7574', type: 'dot' },
              { label: 'Office expenses miscellaneous', color: '#C8C6C4', type: 'dot' },
              { label: 'Bank Revaluations', color: '#00CC6A', type: 'dot' },
              { label: 'Unrealized Currency Gains', color: '#005A9E', type: 'dot' },
              { label: 'Others', color: '#107C10', type: 'dot' }
            ]}
          >
            <StackedBarChart 
              data={expensesByNameData} 
              bars={[
                { key: 'Others', color: '#107C10' },
                { key: 'Unrealized Currency Gains', color: '#005A9E' },
                { key: 'Bank Revaluations', color: '#00CC6A' },
                { key: 'Office expenses miscellaneous', color: '#C8C6C4' },
                { key: 'Utilities office space', color: '#7A7574' },
                { key: 'Payment Provider Fees Stripe', color: '#00B294' },
                { key: 'Payroll Tax Expense', color: '#8764B8' },
                { key: 'Rent office space', color: '#FFB900' },
                { key: 'Subcontractors', color: '#D13438' },
                { key: 'Wages & Salaries', color: '#0078D4' }
              ]}
              yAxisFormatter={formatCurrency}
            />
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: Data Table */}
      <div className="bg-dashboard-card border border-dashboard-border rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-dashboard-border bg-[#F8F9FB]">
          <h3 className="font-bold text-[18px] text-dashboard-textMain">Profit and Loss statement</h3>
        </div>
        <div className="px-6 pb-6">
          <table className="w-full text-left text-[14px] text-dashboard-textSecondary mt-2">
            <thead>
              <tr className="border-b border-dashboard-border font-bold text-dashboard-textMain">
                <th className="py-4 font-bold">Account type</th>
                <th className="py-4 font-bold">Month to date</th>
                <th className="py-4 font-bold">Last month</th>
                <th className="py-4 font-bold">Year to date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4">Income</td>
                <td className="py-4">$66,464</td>
                <td className="py-4">$316,110</td>
                <td className="py-4">$1,301,738</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-dashboard-textMuted">Cost of Goods Sold</td>
                <td className="py-4 text-dashboard-textMuted">$0</td>
                <td className="py-4 text-dashboard-textMuted">-$80,500</td>
                <td className="py-4 text-dashboard-textMuted">-$320,630</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4">Gross Profit</td>
                <td className="py-4">$66,464</td>
                <td className="py-4">$235,610</td>
                <td className="py-4">$981,108</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-dashboard-textMuted">Expense</td>
                <td className="py-4 text-dashboard-textMuted">-$60,755</td>
                <td className="py-4 text-dashboard-textMuted">-$125,105</td>
                <td className="py-4 text-dashboard-textMuted">-$586,218</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4">Operating Profit (Loss)</td>
                <td className="py-4">$5,709</td>
                <td className="py-4">$110,505</td>
                <td className="py-4">$394,890</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-dashboard-textMuted">Other Expense</td>
                <td className="py-4 text-dashboard-textMuted">$0</td>
                <td className="py-4 text-dashboard-textMuted">$4,536</td>
                <td className="py-4 text-dashboard-textMuted">-$13,513</td>
              </tr>
              <tr>
                <td className="py-4">Net Profit (Loss)</td>
                <td className="py-4">$5,709</td>
                <td className="py-4">$115,041</td>
                <td className="py-4">$381,377</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ChartCard Wrapper Component
function ChartCard({ 
  title, 
  height, 
  children,
  legend 
}: { 
  title: string; 
  height: number; 
  children: React.ReactNode;
  legend?: { label: string; color: string; type: 'dot' | 'line' }[];
}) {
  return (
    <div className="bg-dashboard-card border border-dashboard-border rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-[18px] text-dashboard-textMain tracking-tight mb-3">{title}</h3>
          {legend && (
            <div className="flex gap-4 items-center flex-wrap text-[13px] font-medium text-dashboard-textMuted">
              {legend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.type === 'dot' ? (
                    <span className="w-2.5 h-2.5 bg-current rounded-full" style={{ color: item.color }}></span>
                  ) : (
                    <span className="w-3 h-[2px] bg-current" style={{ color: item.color }}></span>
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="text-dashboard-textMuted hover:text-dashboard-textMain">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <div style={{ height: `${height}px` }} className="mt-2">
        {children}
      </div>
    </div>
  );
}
