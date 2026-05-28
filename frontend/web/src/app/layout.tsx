import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { brand } from "@casax/config/site";
import { Providers } from "@/components/providers";
import { PublicHeader } from "@/components/public-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: `${brand.name} | Property operations with visibility and control`,
  description: brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen antialiased`}>
        <Providers>
          <PublicHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
