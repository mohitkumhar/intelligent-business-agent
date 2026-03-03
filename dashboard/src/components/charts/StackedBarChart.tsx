import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StackedBarChartProps {
  data: any[];
  bars: { key: string; color: string; stackId?: string }[];
  yAxisFormatter?: (val: any) => string;
}

export function StackedBarChart({ data, bars, yAxisFormatter }: StackedBarChartProps) {
  return (
    <div className="w-full h-full text-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E1E5F2" />
          <XAxis 
            dataKey="name" 
            axisLine={true} 
            tickLine={false} 
            tick={{ fill: '#3e424f', fontSize: 12 }} 
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#3e424f', fontSize: 12 }}
            tickFormatter={yAxisFormatter || ((val) => `${val}`)}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E1E5F2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          />
          {bars.map((bar, index) => (
            <Bar 
              key={bar.key}
              dataKey={bar.key} 
              stackId={bar.stackId || "a"} 
              fill={bar.color} 
              radius={index === bars.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
