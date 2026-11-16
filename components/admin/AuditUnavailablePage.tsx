import { Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function AuditUnavailablePage() {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
        <Eye size={20} />
      </div>
      <h2 className="mt-4 font-bold text-slate-800">Log Aktivitas & Audit</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        Menu ini tersedia mengikuti navigasi sistem, tetapi backend yang dilampirkan belum menyediakan endpoint log aktivitas/audit.
        Data tidak ditampilkan sebagai data contoh.
      </p>
    </Card>
  );
}
