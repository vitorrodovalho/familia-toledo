"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Universo 3D" },
  { href: "/timeline", label: "Linha do Tempo" },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0A0F1A]/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link className="min-w-0 font-serif text-xl font-semibold text-white" href="/">
          Memória Viva
        </Link>
        <div className="flex items-center gap-2 text-sm font-medium text-sand/80">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                className={`border px-3 py-2 transition hover:text-white ${
                  active
                    ? "border-terracotta bg-terracotta/20 text-white"
                    : "border-transparent"
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            className="flex h-9 w-9 items-center justify-center border border-white/15 text-lg text-sand/75 transition hover:border-white/35 hover:text-white"
            type="button"
            aria-label="Abrir busca"
          >
            ⌕
          </button>
        </div>
      </nav>
    </header>
  );
}
