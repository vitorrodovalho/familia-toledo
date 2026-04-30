"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#d6cab7] bg-[#fffdf8]/95 text-[#111111] backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link className="min-w-0 font-serif text-xl font-semibold text-[#b80000]" href="/">
          Família Toledo
        </Link>
        <div className="flex items-center gap-4 text-sm text-[#5d5344]">
          <Link className="transition hover:text-[#b80000]" href="/">
            Genealogia
          </Link>
          <Link className="transition hover:text-[#b80000]" href="/sobre">
            Sobre
          </Link>
        </div>
      </nav>
    </header>
  );
}
