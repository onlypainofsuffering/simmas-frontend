interface PageHeaderProps {
  description: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ description, hint, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <p className="text-base font-semibold text-slate-800">{description}</p>
        {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
