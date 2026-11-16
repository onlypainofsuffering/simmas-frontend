import type { Row } from './api';

export interface AdminSummary extends Row {
  students?: number;
  teachers?: number;
  companies?: number;
  applications?: number;
  visits?: number;
}
