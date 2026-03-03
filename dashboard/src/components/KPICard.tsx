export function KPICard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-dashboard-card rounded-xl p-5 border border-dashboard-border shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[120px] flex flex-col justify-center">
      <h3 className="text-dashboard-textMuted text-[15px] mb-2">{title}</h3>
      <div className="text-[28px] font-bold text-dashboard-textMain">{value}</div>
    </div>
  );
}
