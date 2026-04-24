"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Person } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";

interface SearchBarProps {
  onResults: (personIds: string[]) => void;
  persons: Person[];
}

export function normalizeForSearch(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCameraTarget(person: Person): [number, number, number] {
  if ("x" in person && "y" in person && "z" in person) {
    const node = person as Person & { x: number; y: number; z: number };
    return [node.x, node.y, node.z];
  }

  return [0, -person.generation_level * 80, 0];
}

function formatResultMeta(person: Person): string {
  const year = person.is_living
    ? "Vivo(a)"
    : person.birth_year?.toString() ?? "Ano desconhecido";
  const place = person.birth_place ?? person.birth_country ?? "Local desconhecido";

  return `${year} · ${place}`;
}

export function SearchBar({ onResults, persons }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const setCameraTarget = useFamilyStore((state) => state.setCameraTarget);
  const setSearchQuery = useFamilyStore((state) => state.setSearchQuery);
  const setSearchResults = useFamilyStore((state) => state.setSearchResults);

  const searchablePersons = useMemo(
    () =>
      persons.map((person) => ({
        person,
        normalizedName: normalizeForSearch(person.name),
      })),
    [persons],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const normalizedQuery = normalizeForSearch(query);
      setSearchQuery(query);

      if (normalizedQuery.length < 2) {
        setResults([]);
        setSearchResults([]);
        onResults([]);
        return;
      }

      const nextResults = searchablePersons
        .filter(({ normalizedName, person }) => {
          const lowerName = person.name.toLowerCase();
          return (
            normalizedName.includes(normalizedQuery) ||
            lowerName.includes(query.toLowerCase().trim())
          );
        })
        .slice(0, 20)
        .map(({ person }) => person);
      const ids = nextResults.map((person) => person.id);

      setResults(nextResults);
      setSearchResults(ids);
      onResults(ids);
      setIsOpen(nextResults.length > 0);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [
    onResults,
    query,
    searchablePersons,
    setSearchQuery,
    setSearchResults,
  ]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectPerson = (person: Person) => {
    setSelectedPerson(person.id);
    setCameraTarget(getCameraTarget(person));
    setQuery(person.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label className="sr-only" htmlFor="family-search">
        Buscar pessoa
      </label>
      <div className="flex h-11 items-center gap-3 border border-white/15 bg-white/10 px-3 text-sand backdrop-blur transition focus-within:border-white/35">
        <span aria-hidden className="text-lg text-sand/55">
          ⌕
        </span>
        <input
          id="family-search"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-sand/45"
          type="search"
          value={query}
          placeholder="Buscar pessoa"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(results.length > 0)}
        />
      </div>

      {isOpen && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-12 z-[80] max-h-96 overflow-y-auto border border-white/15 bg-[#0A0F1A]/95 p-2 shadow-2xl backdrop-blur">
          {results.map((person) => (
            <button
              key={person.id}
              className="block w-full px-3 py-2 text-left transition hover:bg-white/10"
              type="button"
              onClick={() => selectPerson(person)}
            >
              <span className="block truncate text-sm font-medium text-white">
                {person.name}
              </span>
              <span className="mt-1 block truncate text-xs text-sand/60">
                {formatResultMeta(person)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
