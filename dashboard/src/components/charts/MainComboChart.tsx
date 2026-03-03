import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: "Apr '25", income: 100, expenses: 130, margin: -10 },
  { name: "May '25", income: 240, expenses: 140, margin: 15 },
  { name: "Jun '25", income: 200, expenses: 135, margin: 10 },
  { name: "Jul '25", income: 260, expenses: 155, margin: 25 },
  { name: "Aug '25", income: 270, expenses: 200, margin: 26 },
  { name: "Sep '25", income: 300, expenses: 200, margin: 28 },
  { name: "Oct '25", income: 290, expenses: 210, margin: 29 },
  { name: "Nov '25", income: 310, expenses: 215, margin: 31 },
  { name: "Dec '25", income: 320, expenses: 210, margin: 35 },
  { name: "Jan '26", income: 315, expenses: 205, margin: 32 },
  { name: "Feb '26", income: 170, expenses: 90, margin: 40 },
  { name: "Mar '26", income: 60, expenses: 60, margin: 5 },
];

export function MainComboChart() {
  return (
    <div className="w-full h-full text-sm">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          barGap={2}
          barCategoryGap="20%"
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
            tickFormatter={(value) => `$${value}.0K`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#3e424f', fontSize: 13 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E1E5F2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          />
          <Bar yAxisId="left" dataKey="income" fill="#05759e" radius={[2, 2, 0, 0]} maxBarSize={16} />
          <Bar yAxisId="left" dataKey="expenses" fill="#e3ac1e" radius={[2, 2, 0, 0]} maxBarSize={16} />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="margin" 
            stroke="#ac3d31" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
