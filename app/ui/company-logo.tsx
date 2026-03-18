import Link from "next/link";
import Image from "next/image";

export default function CompanyLogo() {
  return (
    <Link aria-label="Go to homepage" className="inline-flex" href="/">
      <Image
        priority
        alt="HongGuan Logo"
        className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        height={1000}
        src="/HongGuan_Icon.jpg"
        width={1000}
      />
    </Link>
  );
}
