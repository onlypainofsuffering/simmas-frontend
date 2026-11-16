import { cn } from '@/lib/utils/cn';

export function Loading({ text = 'Memuat data...', className }: { text?: string; className?: string }) {
  return <div className={cn('p-12 text-center text-sm text-slate-400', className)}>{text}</div>;
}
