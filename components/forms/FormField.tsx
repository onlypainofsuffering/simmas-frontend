import type { Field } from '@/types/resource';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import { cn } from '@/lib/utils/cn';
import { humanize } from '@/lib/utils/resource';

interface FormFieldProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  isEdit?: boolean;
}

export function FormField({ field, value, onChange, isEdit = false }: FormFieldProps) {
  const required = field.required && !(isEdit && field.type === 'password');

  if (field.type === 'select') {
    return (
      <label className="block text-xs font-semibold text-slate-600">
        {field.label}
        <SelectField
          className="mt-2"
          required={required}
          name={field.name}
          value={String(value ?? '')}
          onValueChange={onChange}
          placeholder={`Pilih ${field.label}`}
          options={(field.options || []).map(option => ({
            value: option,
            label: field.name === 'kuota_peserta' ? (option === 'true' ? 'Tersedia' : 'Penuh') : humanize(option),
          }))}
        />
      </label>
    );
  }

  if (field.type === 'toggle') {
    const active = value === true || value === 'true';
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
        <span className="text-xs font-semibold text-slate-600">{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={field.label}
          onClick={() => onChange(!active)}
          className={cn(
            'relative h-5 w-10 rounded-full transition',
            active ? 'bg-emerald-500' : 'bg-slate-300',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
              active ? 'left-5' : 'left-0.5',
            )}
          />
        </button>
      </div>
    );
  }

  if (field.type === 'file') {
    return (
      <label className="block text-xs font-semibold text-slate-600">
        {field.label}
        <Input
          className="mt-2"
          type="file"
          accept="image/*"
          capture="environment"
          required={required}
          onChange={event => onChange(event.target.files?.[0] || null)}
        />
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="block text-xs font-semibold text-slate-600">
        {field.label}
        <textarea className="input mt-2 min-h-24" required={required} value={value || ''} onChange={event => onChange(event.target.value)} />
      </label>
    );
  }

  return (
    <label className="block text-xs font-semibold text-slate-600">
      {field.label}
      <Input
        className="mt-2"
        type={field.numeric || field.noLetters ? 'text' : field.type || 'text'}
        inputMode={field.numeric ? 'numeric' : undefined}
        pattern={field.numeric ? '[0-9]*' : field.noLetters ? '[^A-Za-z]*' : undefined}
        required={required}
        value={value ?? ''}
        onChange={event => {
          const raw = event.target.value;
          const nextValue = field.numeric ? raw.replace(/\D/g, '') : field.noLetters ? raw.replace(/[A-Za-z]/g, '') : raw;
          onChange(nextValue);
        }}
      />
    </label>
  );
}
