"use client";

import Link from "next/link";

export function Navigation() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#d6cab7] bg-[#fffdf8]/95 text-[#111111] backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link className="min-w-0 font-serif text-xl font-semibold text-[#b80000]" href="/">
          Família Toledo
        </Link>
        <span className="hidden text-sm text-[#5d5344] sm:block">
          Validação dos dados genealógicos
        </span>
      </nav>
    </header>
  );
}
