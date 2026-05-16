export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className={`text-2xl font-bold ${accent ? 'text-[#FFD700]' : 'text-white'}`}>{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
      {sub ? <div className="text-[10px] text-zinc-500 mt-1">{sub}</div> : null}
    </div>
  );
}
