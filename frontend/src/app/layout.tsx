// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "zkAccess",
  description: "Turn zk proofs into modular, persistent claims that users can reuse across contexts, without re-proving everything from scratch.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
  };

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="es">
        <head />
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    );
  }
