import { EmptyState } from '@/components/ui/EmptyState';

export interface ActivityItem {
  key?: string | number;
  title: string;
  subtitle?: string;
}

interface ActivityListProps {
  items: ActivityItem[];
  emptyText?: string;
}

export function ActivityList({ items, emptyText = 'Belum ada aktivitas.' }: ActivityListProps) {
  if (!items.length) return <EmptyState text={emptyText} />;

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <div key={item.key ?? index} className="py-3">
          <div className="text-xs font-semibold text-slate-700">{item.title}</div>
          {item.subtitle && <div className="mt-1 text-[10px] text-slate-400">{item.subtitle}</div>}
        </div>
      ))}
    </div>
  );
}
