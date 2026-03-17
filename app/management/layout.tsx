import ProtectedRoute from "@/app/components/protected-route";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}
