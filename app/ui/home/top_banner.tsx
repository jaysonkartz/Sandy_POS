import Link from "next/link";

import CompanyLogo from "@/app/ui/company-logo";

import { lusitana } from "../fonts";

export default function TopNav() {
  return (
    <div className="flex h-30 shrink-0 items-center justify-between rounded-lg bg-yellow-800 p-4 md:h-30">
      <p
        className={`${lusitana.className} text-xl text-white md:text-3xl md:leading-normal`}
      >
        <strong>
          Welcome to the Jurong West Combined Temple
          <br /> 欢迎来到天公壇昭靈宮
        </strong>
      </p>
      <Link href="/">
        <CompanyLogo />
      </Link>
    </div>
  );
}
