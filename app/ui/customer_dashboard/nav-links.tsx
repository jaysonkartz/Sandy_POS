"use client";

import { CalendarDaysIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Fragment } from "react";

const links = [
  {
    name: "Events",
    href: "/events",
    icon: CalendarDaysIcon,
  },
  {
    name: "Plans",
    href: "/plans",
    icon: LightBulbIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <Fragment>
      {links.map((link) => {
        const LinkIcon = link.icon;

        return (
          <Link
            key={link.name}
            className={clsx(
              "flex flex-nowrap h-[48px] w-1/2 mx-auto items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600": pathname === link.href,
              }
            )}
            href={link.href}
          >
            <LinkIcon className="w-6" />
            <p>{link.name}</p>
          </Link>
        );
      })}
    </Fragment>
  );
}
