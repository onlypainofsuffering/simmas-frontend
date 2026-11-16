import { cn } from '@/lib/utils/cn';

export function EmptyState({ text, className }: { text: string; className?: string }) {
  return <div className={cn('py-8 text-center text-xs text-slate-400', className)}>{text}</div>;
}
