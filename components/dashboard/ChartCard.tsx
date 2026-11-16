import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {description && <p className="mt-1 text-[11px] text-slate-400">{description}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
