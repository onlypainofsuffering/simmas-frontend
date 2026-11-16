export type FieldType = 'text' | 'email' | 'password' | 'date' | 'number' | 'textarea' | 'file' | 'select';

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
}

export type PageKind =
  | 'dashboard'
  | 'application'
  | 'password'
  | 'attendance'
  | 'monitoring'
  | 'placement'
  | 'audit'
  | 'journal-attendance';

export interface PageConfig {
  path?: string;
  createPath?: string;
  filters?: string[];
  fields?: Field[];
  editFields?: Field[];
  actions?: string[];
  kind?: PageKind;
}
