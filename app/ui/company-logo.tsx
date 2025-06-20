import Image from "next/image";

export default function CompanyLogo() {
  return (
    <Image
      alt="HongGuan Logo"
      className="rounded-lg"
      height={50}
      src="/HongGuan_Icon.jpg"
      width={50}
    />
  );
}
