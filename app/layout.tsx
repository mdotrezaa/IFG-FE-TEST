import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Storage Management",
  description: "Product and inventory management portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Providers>
            <Header />
            <main className="mx-auto max-w-7xl p-6">{children}</main>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
