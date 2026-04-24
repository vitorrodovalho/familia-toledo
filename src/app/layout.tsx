import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Navigation } from "@/components/shared/Navigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Memória Viva | Toledo Rodovalho",
  description: "Universo familiar interativo da família Toledo Rodovalho.",
  openGraph: {
    title: "Memória Viva | Toledo Rodovalho",
    description: "Universo familiar interativo da família Toledo Rodovalho.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${playfair.variable} min-h-screen bg-[#0A0F1A] font-sans text-sand antialiased`}
      >
        <Navigation />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}
