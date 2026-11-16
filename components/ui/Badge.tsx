import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700', className)}
      {...props}
    />
  );
}
