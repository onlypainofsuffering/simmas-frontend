export function InfoTile({ label: caption, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[10px] text-slate-400">{caption}</div>
      <div className="mt-1 text-xs font-semibold text-slate-700">{value}</div>
    </div>
  );
}
