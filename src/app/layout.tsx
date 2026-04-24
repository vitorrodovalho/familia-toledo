import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
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
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0A0F1A]/85 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link className="font-serif text-xl font-semibold text-white" href="/">
              Memória Viva
            </Link>
            <div className="flex items-center gap-5 text-sm font-medium text-sand/80">
              <Link className="transition hover:text-white" href="/">
                Universo
              </Link>
              <Link className="transition hover:text-white" href="/timeline">
                Timeline
              </Link>
            </div>
          </nav>
        </header>
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}
