'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari data...',
  className = 'w-full sm:w-64',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
      <Input className="pl-9" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
