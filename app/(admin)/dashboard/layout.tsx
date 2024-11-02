import SideNav from "@/app/ui/admin_dashboard/sidenav";

export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 item-center md:overflow-y-auto md:p-12">
        <div className="max-w-screen-2xl m-auto">{children}</div>
      </div>
    </div>
  );
}
