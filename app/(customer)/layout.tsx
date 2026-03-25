import CustomerChrome from "./CustomerChrome";

export const experimental_ppr = true;

export default function CustomerGroupLayout({ children }: { children: React.ReactNode }) {
  return <CustomerChrome>{children}</CustomerChrome>;
}
