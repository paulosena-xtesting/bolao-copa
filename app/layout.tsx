import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/src/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Bolão da Copa entre amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}