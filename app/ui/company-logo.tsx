import { Image } from "@nextui-org/react";

import { lusitana } from "@/app/ui/fonts";

export default function CompanyLogo() {
  return (
    <div className="text-white hidden sm:block">
      <div
        className={`${lusitana.className} flex flex-row items-center text-white`}
      >
        <Image alt="Temple Logo" height={50} src="/TGT_Logo.jpg" width={50} />
      </div>
    </div>
  );
}
