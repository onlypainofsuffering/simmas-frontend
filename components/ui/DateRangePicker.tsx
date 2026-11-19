'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type DateRange = { from: Date | null; to: Date | null };

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const PRESETS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: 'this-week', label: 'Minggu Ini' },
  { id: 'this-month', label: 'Bulan Ini' },
  { id: 'last-week', label: 'Minggu Lalu' },
  { id: 'last-month', label: 'Bulan Lalu' },
  { id: 'this-year', label: 'Tahun Ini' },
  { id: 'last-year', label: 'Tahun Lalu' },
  { id: 'last-7', label: '7 Hari Terakhir' },
] as const;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function parseDateValue(raw: any): Date | null {
  if (raw instanceof Date) return startOfDay(raw);
  const value = String(raw || '');
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matched) {
    return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function dateKey(date: Date | null) {
  if (!date) return '';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function addDays(date: Date, amount: number) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function presetRange(id: string, today: Date): DateRange {
  switch (id) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'this-week':
      return { from: startOfWeek(today), to: today };
    case 'this-month':
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
    case 'last-week': {
      const previousMonday = addDays(startOfWeek(today), -7);
      return { from: previousMonday, to: addDays(previousMonday, 6) };
    }
    case 'last-month':
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 0),
      };
    case 'this-year':
      return { from: new Date(today.getFullYear(), 0, 1), to: today };
    case 'last-year':
      return {
        from: new Date(today.getFullYear() - 1, 0, 1),
        to: new Date(today.getFullYear() - 1, 11, 31),
      };
    case 'last-7':
      return { from: addDays(today, -6), to: today };
    default:
      return { from: null, to: null };
  }
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatRange(range: DateRange) {
  if (!range.from && !range.to) return 'Semua tanggal';
  if (range.from && !range.to) return `${dateFormatter.format(range.from)} - ...`;
  if (range.from && range.to && dateKey(range.from) === dateKey(range.to)) {
    return dateFormatter.format(range.from);
  }
  return `${range.from ? dateFormatter.format(range.from) : '...'} – ${range.to ? dateFormatter.format(range.to) : '...'}`;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [view, setView] = useState(() => {
    const anchor = value.from || new Date();
    return { month: anchor.getMonth(), year: anchor.getFullYear() };
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (value.from) {
      setView({ month: value.from.getMonth(), year: value.from.getFullYear() });
    }
  }, [value.from]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return;
    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!trigger || !panel) return;
      const gap = 8;
      let top = trigger.bottom + gap;
      if (top + panel.height > window.innerHeight - 16) {
        top = Math.max(16, trigger.top - panel.height - gap);
      }
      const left = Math.max(16, Math.min(trigger.left, window.innerWidth - panel.width - 16));
      setPosition({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => {
    const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
    const total = new Date(view.year, view.month + 1, 0).getDate();
    const cells: Array<Date | null> = Array(firstWeekday).fill(null);
    for (let day = 1; day <= total; day += 1) {
      cells.push(new Date(view.year, view.month, day));
    }
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [view]);

  const from = value.from ? startOfDay(value.from) : null;
  const to = value.to ? startOfDay(value.to) : null;
  const years = Array.from({ length: 12 }, (_, index) => today.getFullYear() + 1 - index);

  function applyPreset(id: string) {
    onChange(presetRange(id, today));
    setOpen(false);
  }

  function selectDay(day: Date) {
    if (!from || to) {
      onChange({ from: day, to: null });
      return;
    }
    if (day < from) {
      onChange({ from: day, to: from });
      setOpen(false);
      return;
    }
    onChange({ from, to: day });
    setOpen(false);
  }

  function shiftMonth(amount: number) {
    const next = new Date(view.year, view.month + amount, 1);
    setView({ month: next.getMonth(), year: next.getFullYear() });
  }

  const activePreset = PRESETS.find(preset => {
    const range = presetRange(preset.id, today);
    return dateKey(range.from) === dateKey(from) && dateKey(range.to) === dateKey(to);
  })?.id;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(current => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        aria-expanded={open}
      >
        <CalendarDays size={15} className="text-blue-600" />
        <span>{formatRange(value)}</span>
      </button>

      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 90 }}
            className="w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="grid sm:grid-cols-[190px_1fr]">
              <div className="border-b border-slate-100 bg-slate-50 p-3 sm:border-b-0 sm:border-r">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Periode Cepat
                </p>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-1">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-left text-xs font-medium transition',
                        activePreset === preset.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-blue-100 hover:text-blue-700',
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shiftMonth(-1)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <select
                      className="input h-8 w-32 px-2 py-1 text-xs font-semibold"
                      value={view.month}
                      onChange={event => setView(current => ({ ...current, month: Number(event.target.value) }))}
                      aria-label="Pilih bulan"
                    >
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input h-8 w-20 px-2 py-1 text-xs font-semibold"
                      value={view.year}
                      onChange={event => setView(current => ({ ...current, year: Number(event.target.value) }))}
                      aria-label="Pilih tahun"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => shiftMonth(1)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="py-1 text-center text-[10px] font-semibold uppercase text-slate-400">
                      {day}
                    </div>
                  ))}
                  {days.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} />;
                    const isStart = Boolean(from && dateKey(day) === dateKey(from));
                    const isEnd = Boolean(to && dateKey(day) === dateKey(to));
                    const inRange = Boolean(from && to && day >= from && day <= to);
                    const isToday = dateKey(day) === dateKey(today);
                    return (
                      <button
                        key={dateKey(day)}
                        type="button"
                        onClick={() => selectDay(day)}
                        className={cn(
                          'h-9 rounded-lg text-xs font-semibold transition',
                          inRange && !isStart && !isEnd && 'bg-blue-50 text-blue-700',
                          (isStart || isEnd) && 'bg-blue-600 text-white shadow-sm',
                          !inRange && !isStart && !isEnd && 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                          isToday && !isStart && !isEnd && 'ring-1 ring-inset ring-blue-300',
                        )}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="truncate text-[11px] font-medium text-slate-500">{formatRange(value)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ from: null, to: null });
                      setOpen(false);
                    }}
                    className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
