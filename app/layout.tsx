import "@/app/ui/global.css";
import { Metadata } from "next";
import { NextUIProvider } from "@nextui-org/react";

import { inter } from "@/app/ui/fonts";

export const metadata: Metadata = {
  title: {
    template: "%s | Project Bob",
    default: "Project Bob",
  },
  description: "The dashboard application for Project Bob.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <NextUIProvider>
          <div className="flex min-h-screen flex-col p-1 md:p-0">
            <div className="flex-grow p-6 item-center md:overflow-y-auto md:p-0">
              <div className="max-w-screen-2xl m-auto">{children}</div>
            </div>
          </div>
        </NextUIProvider>
      </body>
    </html>
  );
}
