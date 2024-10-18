import Link from "next/link";
import { PowerIcon } from "@heroicons/react/24/outline";

import NavLinks from "@/app/ui/admin_dashboard/nav-links";
import CompanyLogo from "@/app/ui/company-logo";

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-yellow-800 p-4 md:h-30"
        href="/"
      >
        <CompanyLogo />
      </Link>
      <div className="flex flex-wrap flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full flex-wrap rounded-md bg-gray-50 md:block" />
        <form>
          <button className="flex h-[48px] w-full flex-wrap items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
