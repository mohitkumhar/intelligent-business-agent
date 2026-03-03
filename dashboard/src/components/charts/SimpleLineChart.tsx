import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SimpleLineChartProps {
  data: any[];
  lines: { key: string; color: string }[];
  yAxisFormatter?: (val: any) => string;
  rightAxisFormatter?: (val: any) => string;
}

export function SimpleLineChart({ data, lines, yAxisFormatter, rightAxisFormatter }: SimpleLineChartProps) {
  return (
    <div className="w-full h-full text-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: rightAxisFormatter ? 30 : 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E1E5F2" />
          <XAxis 
            dataKey="name" 
            axisLine={true} 
            tickLine={false} 
            tick={{ fill: '#3e424f', fontSize: 12 }} 
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#3e424f', fontSize: 12 }}
            tickFormatter={yAxisFormatter || ((val) => `${val}`)}
          />
          {rightAxisFormatter && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3e424f', fontSize: 12 }}
              tickFormatter={rightAxisFormatter}
            />
          )}
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E1E5F2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          />
          {lines.map((line) => (
            <Line 
              key={line.key}
              yAxisId={rightAxisFormatter && line.key.toLowerCase().includes('margin') ? 'right' : 'left'}
              type="monotone" 
              dataKey={line.key} 
              stroke={line.color} 
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
