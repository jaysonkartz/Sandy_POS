import Image from 'next/image';
import Link from 'next/link';

export default function CompanyLogo() {
  return (
    <Link
      className="flex flex-row items-center leading-none text-white"
      href="/"
    >
      <Image alt="HongGuan Logo" height={50} src="/HongGuan_Icon.jpg" width={50} className="rounded-lg" />
    </Link>
  );
}
