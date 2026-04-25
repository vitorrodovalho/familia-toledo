"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { normalizeForSearch } from "@/components/shared/SearchBar";
import { useFamilyData } from "@/hooks/useFamilyData";
import type { Person } from "@/types/family";

const countryLabels: Record<string, string> = {
  BR: "Brasil",
  ES: "Espanha",
  MX: "México",
  PT: "Portugal",
};

const bookDescription =
  "A genealogia reúne a trajetória da família Toledo desde suas origens espanholas e portuguesas, passando pela presença no México, pela Ilha Terceira nos Açores e pela chegada ao Brasil. O percurso acompanha os ramos Toledo, Rodovalho, Toledo Pisa e Toledo Rodovalho até a fixação em Limeira, São Paulo, onde a descendência alcança a 15ª geração.";

type ExpansionMode = "path" | "full";
type ExpansionModes = Record<string, ExpansionMode>;
type PathChildByParent = Record<string, string>;

function getTreeRowId(personId: string): string {
  return `person-tree-row-${personId}`;
}

function formatDate(date: string | null, year: number | null, approx: boolean): string {
  if (date) return approx ? `${date} aprox.` : date;
  if (year !== null) return approx ? `c. ${year}` : String(year);
  return "não informado";
}

function formatPlace(place: string | null, country: string | null): string {
  return [place, country ? countryLabels[country] ?? country : null]
    .filter(Boolean)
    .join(", ");
}

function getDescription(person: Person): string {
  if (person.bio_narrative) return person.bio_narrative;
  if (person.raw_text) return person.raw_text;
  if (person.profession.length > 0) return person.profession.join(", ");
  return "Descrição não informada.";
}

function getParentsLabel(person: Person, personsById: ReadonlyMap<string, Person>): string {
  const linkedParents = person.parents
    .map((parentId) => personsById.get(parentId)?.name)
    .filter(Boolean);

  if (linkedParents.length > 0) return linkedParents.join(" e ");

  return [person.father_name, person.mother_name].filter(Boolean).join(" e ");
}

function BookEntry({
  person,
  selected,
  level = 0,
  expanded = false,
  hasChildren = false,
  onSelect,
}: {
  person: Person;
  selected: boolean;
  level?: number;
  expanded?: boolean;
  hasChildren?: boolean;
  onSelect: (person: Person) => void;
}) {
  const birthDate = formatDate(
    person.birth_date,
    person.birth_year,
    person.birth_year_approx,
  );
  const birthPlace = formatPlace(person.birth_place, person.birth_country);
  const description = getDescription(person);

  return (
    <button
      id={getTreeRowId(person.id)}
      className={`block w-full border-b border-[#ddd4c3] px-3 py-2 text-left leading-snug transition ${
        selected ? "bg-[#fff6e6]" : "hover:bg-[#fbf6ed]"
      }`}
      type="button"
      onClick={() => onSelect(person)}
      style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
    >
      <p className="text-[15px] text-[#111111]">
        <span className="mr-2 inline-block w-4 text-center text-[#7b7163]">
          {hasChildren ? (expanded ? "−" : "+") : ""}
        </span>
        <span className="text-[#b80000]">{person.generation_level}. </span>
        <span className="font-semibold text-[#004eea] underline decoration-[#004eea]/50 underline-offset-2">
          {person.name}
        </span>
        <span className="text-[#111111]">
          {" "}
          {person.titles.length > 0 ? `(${person.titles.join(", ")}) ` : ""}
          * {birthDate}
          {birthPlace ? `, ${birthPlace}` : ""}
        </span>
      </p>
      <p className="mt-1 line-clamp-2 text-[13px] text-[#202020]">
        {description}
      </p>
    </button>
  );
}

function PersonTree({
  person,
  personsById,
  expansionModes,
  pathChildByParent,
  selectedPersonId,
  level,
  onSelect,
  visitedIds = new Set<string>(),
}: {
  person: Person;
  personsById: ReadonlyMap<string, Person>;
  expansionModes: ExpansionModes;
  pathChildByParent: PathChildByParent;
  selectedPersonId: string | null;
  level: number;
  onSelect: (person: Person) => void;
  visitedIds?: ReadonlySet<string>;
}) {
  const children = person.children
    .map((childId) => personsById.get(childId))
    .filter((child): child is Person => child !== undefined);
  const expansionMode = expansionModes[person.id];
  const expanded = expansionMode !== undefined;
  const visibleChildren =
    expansionMode === "path"
      ? children.filter((child) => child.id === pathChildByParent[person.id])
      : children;
  const nextVisitedIds = new Set(visitedIds);
  nextVisitedIds.add(person.id);

  return (
    <>
      <BookEntry
        person={person}
        selected={selectedPersonId === person.id}
        level={level}
        expanded={expanded}
        hasChildren={children.length > 0}
        onSelect={onSelect}
      />
      {expanded
        ? visibleChildren
            .filter((child) => !nextVisitedIds.has(child.id))
            .map((child) => (
              <PersonTree
                key={`${person.id}-${child.id}`}
                person={child}
                personsById={personsById}
                expansionModes={expansionModes}
                pathChildByParent={pathChildByParent}
                selectedPersonId={selectedPersonId}
                level={level + 1}
                onSelect={onSelect}
                visitedIds={nextVisitedIds}
              />
            ))
        : null}
    </>
  );
}

function PersonBookPanel({
  person,
  personsById,
  onClose,
  onSelect,
}: {
  person: Person | null;
  personsById: ReadonlyMap<string, Person>;
  onClose: () => void;
  onSelect: (person: Person) => void;
}) {
  if (!person) {
    return (
      <aside className="hidden border-l border-[#cfc5b2] bg-[#fffdf8] p-5 lg:block">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8b1a1a]">
          Genealogia
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#111111]">
          Família Toledo
        </h2>
        <p className="text-sm leading-relaxed text-[#5d5344]">
          {bookDescription}
        </p>
      </aside>
    );
  }

  const parents = person.parents
    .map((parentId) => personsById.get(parentId))
    .filter((item): item is Person => item !== undefined);
  const children = person.children
    .map((childId) => personsById.get(childId))
    .filter((item): item is Person => item !== undefined)
    .slice(0, 12);
  const parentLabel = getParentsLabel(person, personsById);
  const birthPlace = formatPlace(person.birth_place, person.birth_country);
  const deathPlace = formatPlace(person.death_place, person.death_country);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[75vh] overflow-y-auto border-t border-[#cfc5b2] bg-[#fffdf8] p-5 shadow-2xl lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:max-h-none lg:border-l lg:border-t-0">
      <button
        className="absolute right-4 top-3 h-8 w-8 border border-[#c8bca8] text-xl leading-none text-[#5d1a15] lg:hidden"
        type="button"
        aria-label="Fechar detalhes"
        onClick={onClose}
      >
        ×
      </button>

      {person.photo_url ? (
        <div className="relative mb-4 h-36 w-28 overflow-hidden border border-[#cfc5b2] bg-[#efe7d7]">
          <Image src={person.photo_url} alt={person.name} fill className="object-cover object-top" sizes="112px" />
        </div>
      ) : null}

      <p className="text-xs uppercase tracking-[0.18em] text-[#8b1a1a]">
        Geração {person.generation_level}ª
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#111111]">
        {person.name}
      </h2>

      <dl className="mt-5 space-y-3 text-sm text-[#151515]">
        <div>
          <dt className="font-semibold text-[#7c1414]">Nascimento</dt>
          <dd>
            {formatDate(person.birth_date, person.birth_year, person.birth_year_approx)}
            {birthPlace ? `, ${birthPlace}` : ""}
          </dd>
        </div>
        {person.death_year || person.death_date ? (
          <div>
            <dt className="font-semibold text-[#7c1414]">Falecimento</dt>
            <dd>
              {formatDate(person.death_date, person.death_year, person.death_year_approx)}
              {deathPlace ? `, ${deathPlace}` : ""}
            </dd>
          </div>
        ) : null}
        {parentLabel ? (
          <div>
            <dt className="font-semibold text-[#7c1414]">Filiação</dt>
            <dd>{parentLabel}</dd>
          </div>
        ) : null}
        {person.marriages.length > 0 ? (
          <div>
            <dt className="font-semibold text-[#7c1414]">Casamento</dt>
            <dd>
              {person.marriages.map((marriage) => marriage.spouse_name).join("; ")}
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="mt-6 border-t border-[#ddd4c3] pt-4">
        <h3 className="font-serif text-xl font-semibold text-[#111111]">
          Descrição
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#222222]">
          {getDescription(person)}
        </p>
      </section>

      {parents.length > 0 || children.length > 0 ? (
        <section className="mt-6 border-t border-[#ddd4c3] pt-4">
          <h3 className="font-serif text-xl font-semibold text-[#111111]">
            Relações
          </h3>
          <div className="mt-2 space-y-2 text-sm">
            {parents.map((parent) => (
              <button
                key={parent.id}
                className="block w-full text-left text-[#004eea] underline"
                type="button"
                onClick={() => onSelect(parent)}
              >
                Pai/Mãe: {parent.name}
              </button>
            ))}
            {children.map((child) => (
              <button
                key={child.id}
                className="block w-full text-left text-[#004eea] underline"
                type="button"
                onClick={() => onSelect(child)}
              >
                Filho(a): {child.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-6 border-t border-[#ddd4c3] pt-4 text-xs text-[#6f6658]">
        Página do PDF: {person.page ?? "não informada"} · ID: {person.id}
      </p>
    </aside>
  );
}

export default function Home() {
  const { data, loading, error } = useFamilyData();
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [expansionModes, setExpansionModes] = useState<ExpansionModes>({});
  const [pathChildByParent, setPathChildByParent] =
    useState<PathChildByParent>({});
  const [pendingScrollPersonId, setPendingScrollPersonId] = useState<string | null>(null);

  const personsById = useMemo(
    () => new Map((data?.persons ?? []).map((person) => [person.id, person])),
    [data?.persons],
  );

  const filteredPersons = useMemo(() => {
    const persons = data?.persons ?? [];
    const normalizedQuery = normalizeForSearch(query);

    if (normalizedQuery.length < 2) {
      return persons;
    }

    return persons.filter((person) => {
      const values = [
        person.name,
        person.birth_place,
        person.father_name,
        person.mother_name,
        person.bio_narrative,
        person.raw_text,
      ];

      return values.some((value) =>
        value ? normalizeForSearch(value).includes(normalizedQuery) : false,
      );
    });
  }, [data?.persons, query]);

  const rootPersons = useMemo(() => {
    const persons = data?.persons ?? [];
    const generationOne = persons.filter((person) => person.generation_level === 1);

    if (generationOne.length > 0) return generationOne;

    return persons.filter((person) => person.parents.length === 0);
  }, [data?.persons]);

  const normalizedQuery = normalizeForSearch(query);
  const isSearching = normalizedQuery.length >= 2;

  const selectAndTogglePerson = (person: Person) => {
    setSelectedPerson(person);

    if (person.children.length === 0) return;

    setExpansionModes((current) => {
      const next = { ...current };
      const currentMode = next[person.id];

      if (currentMode === "path") {
        next[person.id] = "full";
      } else if (currentMode === "full") {
        delete next[person.id];
      } else {
        next[person.id] = "full";
      }

      return next;
    });
  };

  const getAncestorPathIds = (
    person: Person,
    visitedIds = new Set<string>(),
  ): string[] => {
    if (visitedIds.has(person.id)) return [];

    const nextVisitedIds = new Set(visitedIds);
    nextVisitedIds.add(person.id);

    for (const parentId of person.parents) {
      const parent = personsById.get(parentId);

      if (!parent) continue;

      return [
        ...getAncestorPathIds(parent, nextVisitedIds),
        parent.id,
      ];
    }

    return [];
  };

  const revealPersonInHierarchy = (person: Person) => {
    const ancestorPathIds = getAncestorPathIds(person);
    const nextPathChildByParent: PathChildByParent = {};

    for (let index = 0; index < ancestorPathIds.length; index += 1) {
      const ancestorId = ancestorPathIds[index];
      const childId = ancestorPathIds[index + 1] ?? person.id;

      if (!ancestorId) continue;

      nextPathChildByParent[ancestorId] = childId;
    }

    setSelectedPerson(person);
    setQuery("");
    setPendingScrollPersonId(person.id);
    setExpansionModes((current) => {
      const next = { ...current };

      for (const ancestorId of ancestorPathIds) {
        next[ancestorId] = "path";
      }

      return next;
    });
    setPathChildByParent((current) => ({
      ...current,
      ...nextPathChildByParent,
    }));
  };

  useEffect(() => {
    if (!pendingScrollPersonId || isSearching) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      document
        .getElementById(getTreeRowId(pendingScrollPersonId))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingScrollPersonId(null);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isSearching, pendingScrollPersonId]);

  if (loading) return <LoadingScreen totalPeople={7234} />;

  if (error) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f4efe7] px-6">
        <div className="max-w-lg border border-[#c8bca8] bg-[#fffdf8] p-6 text-center text-[#111111]">
          <h1 className="font-serif text-3xl font-semibold">
            Não foi possível carregar os dados
          </h1>
          <p className="mt-3 text-sm text-[#5d5344]">{error}</p>
        </div>
      </section>
    );
  }

  const total = data?.meta.total_persons ?? data?.persons.length ?? filteredPersons.length;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#f4efe7] px-3 py-5 text-[#111111] md:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 border border-[#cfc5b2] bg-[#fffdf8] shadow-[0_18px_45px_rgba(63,46,25,0.12)]">
          <header className="border-b border-[#ddd4c3] px-5 py-6 text-center">
            <p className="text-sm font-semibold text-[#111111]">1</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold italic leading-tight text-[#b80000] md:text-5xl">
              Genealogia da família Toledo
            </h1>
            <p className="mt-3 text-xl font-semibold text-[#111111]">
              1466 a 2025
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#3d352b]">
              {bookDescription}
            </p>
            <p className="mt-5 text-sm text-[#6f6658]">
              Geraldo Mario Toledo Rodovalho · Limeira, São Paulo, Brasil · 04 de março de 2025
            </p>
          </header>

          <div className="sticky top-16 z-20 border-b border-[#ddd4c3] bg-[#fffdf8]/95 px-4 py-3 backdrop-blur">
            <label className="sr-only" htmlFor="book-search">
              Pesquisar pessoas
            </label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <input
                id="book-search"
                className="h-10 w-full border border-[#bfb39e] bg-white px-3 text-sm text-[#111111] outline-none placeholder:text-[#7b7163] focus:border-[#8b1a1a] md:max-w-xl"
                type="search"
                placeholder="Pesquisar por nome, local, pais ou descrição"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <p className="text-xs text-[#6f6658]">
                {isSearching
                  ? `${filteredPersons.length.toLocaleString("pt-BR")} de `
                  : ""}
                {total.toLocaleString("pt-BR")} registros
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="mb-4 grid grid-cols-[1fr_auto] gap-5 text-sm">
              <div>
                <p className="font-semibold">Ano e local nasc.</p>
                <p className="text-[#3d352b]">
                  Registros genealógicos organizados por hierarquia.
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Geração</p>
                <p className="text-[#3d352b]">1ª a 15ª</p>
              </div>
            </div>

            <div className="border-t border-[#ddd4c3]">
              {isSearching
                ? filteredPersons.map((person) => (
                    <BookEntry
                      key={person.id}
                      person={person}
                      selected={selectedPerson?.id === person.id}
                      onSelect={revealPersonInHierarchy}
                    />
                  ))
                : rootPersons.map((person) => (
                    <PersonTree
                      key={person.id}
                      person={person}
                      personsById={personsById}
                      expansionModes={expansionModes}
                      pathChildByParent={pathChildByParent}
                      selectedPersonId={selectedPerson?.id ?? null}
                      level={0}
                      onSelect={selectAndTogglePerson}
                    />
                  ))}
            </div>
          </div>
        </div>

        <PersonBookPanel
          person={selectedPerson}
          personsById={personsById}
          onClose={() => setSelectedPerson(null)}
          onSelect={revealPersonInHierarchy}
        />
      </div>
    </section>
  );
}
