import NavLinks from "../ui/customer_dashboard/nav-links";
import TopBanner from "../ui/home/top_banner";

//export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBanner />
      <div className="flex flex-wrap items-stretch">
        <NavLinks />
      </div>
      {children}
    </>
  );
}
