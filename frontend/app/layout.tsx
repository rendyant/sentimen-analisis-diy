import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analisis Sentimen OPD SV",
  description: "Dashboard pemantauan kepuasan dan sentiment ulasan publik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-100`}>
        {children}
      </body>
    </html>
  );
}