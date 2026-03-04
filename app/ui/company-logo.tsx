import Link from "next/link";
import Image from "next/image";

export default function CompanyLogo() {
  return (
    <Link href="/" aria-label="Go to homepage" className="inline-flex">
      <Image
        src="/HongGuan_Icon.jpg"  
        alt=""
        width={1000}
        height={1000}
        className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        priority
      />
    </Link>
  );
}
