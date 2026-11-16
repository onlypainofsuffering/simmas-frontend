export function Feedback({ err, notice }: { err: string; notice: string }) {
  return (
    <>
      {err && <div className="m-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{err}</div>}
      {notice && <div className="m-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</div>}
    </>
  );
}
