import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import ApprovalGate from "@/components/ApprovalGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sandy POS",
  description: "Point of Sale System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <ApprovalGate>
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </ApprovalGate>
        </CartProvider>
      </body>
    </html>
  );
}
