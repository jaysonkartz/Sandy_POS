import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sandy POS",
  description: "Point of Sale System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Header />

          <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 sm:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
