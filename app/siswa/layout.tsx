import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="siswa">{children}</DashboardLayout>;
}
