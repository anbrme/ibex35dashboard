import { ModernDashboard } from '../modern/ModernDashboard';

export function MainLayout() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <ModernDashboard />
    </div>
  );
}