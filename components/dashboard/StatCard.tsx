import { Card } from '@/components/ui/Card';

type Tone = 'blue' | 'green' | 'amber' | 'purple';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  detail: string;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-violet-50 text-violet-600',
};

export function StatCard({ title, value, detail, tone = 'blue' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</div>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
      </div>
      <div className="mt-2 text-xl font-bold text-slate-800">{value}</div>
      <div className="mt-1 text-[10px] text-slate-400">{detail}</div>
    </Card>
  );
}
