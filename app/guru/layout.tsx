import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="guru">{children}</DashboardLayout>;
}
