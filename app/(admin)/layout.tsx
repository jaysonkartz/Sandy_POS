import ProtectedRoute from '@/app/components/protected-route';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
} 