import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
}

export function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="w-full h-full text-sm">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #E1E5F2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
            formatter={(value: any) => `$${Number(value).toLocaleString()}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
