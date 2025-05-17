import NavLinks from "../ui/customer_dashboard/nav-links";


export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-wrap items-stretch">
        <NavLinks />
      </div>
      {children}
    </>
  );
}
