import ProtectedRoute from '@/app/components/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
