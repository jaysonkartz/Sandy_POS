"use client";

import {
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  {
    name: "Payment Approvals",
    href: "/dashboard/approvals",
    icon: CurrencyDollarIcon,
  },
  {
    name: "Event Log & Orders",
    href: "/dashboard/events",
    icon: CalendarDaysIcon,
  },
  {
    name: "Plan Log & Orders",
    href: "/dashboard/plans",
    icon: LightBulbIcon,
  },
  {
    name: "Item Details",
    href: "/dashboard/invoices",
    icon: PuzzlePieceIcon,
  },
  { name: "Customer Details", href: "/dashboard/people", icon: UserGroupIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;

        return (
          <Link
            key={link.name}
            className={clsx(
              "flex h-[48px] flex-wrap items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600": pathname === link.href,
              }
            )}
            href={link.href}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
