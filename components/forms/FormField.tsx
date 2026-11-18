import type { Field } from '@/types/resource';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';

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
            label: field.name === 'kuota_peserta' ? (option === 'true' ? 'Tersedia' : 'Penuh') : option,
          }))}
        />
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
