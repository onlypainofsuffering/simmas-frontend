import ResourcePage from '@/components/shared/ResourcePage';
import PendingApplications from './PendingApplications';

export default function AdminPlacementsPage() {
  return (
    <div className="space-y-5">
      <PendingApplications />
      <ResourcePage role="admin" section="penempatan-data" />
    </div>
  );
}
