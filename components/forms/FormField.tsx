import type { Field } from '@/types/resource';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
        <Select className="mt-2" required={required} value={String(value ?? '')} onChange={event => onChange(event.target.value)}>
          <option value="">Pilih {field.label.toLowerCase()}</option>
          {(field.options || []).map(option => (
            <option key={option} value={option}>
              {field.name === 'kuota_peserta' ? (option === 'true' ? 'Tersedia' : 'Penuh') : option}
            </option>
          ))}
        </Select>
      </label>
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
      <Input className="mt-2" type={field.type || 'text'} required={required} value={value ?? ''} onChange={event => onChange(event.target.value)} />
    </label>
  );
}
