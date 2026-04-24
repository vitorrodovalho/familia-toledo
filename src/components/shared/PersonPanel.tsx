"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Branch, Person } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";

interface PersonPanelProps {
  personId: string | null;
  personsById: ReadonlyMap<string, Person>;
  onClose: () => void;
  onNavigateTo: (personId: string) => void;
}

const branchColors: Record<Branch, string> = {
  toledo_espanha: "bg-blue-800",
  rodovalho: "bg-green-800",
  toledo_pisa: "bg-purple-800",
  toledo_rodovalho: "bg-terracotta",
};

const branchLabels: Record<Branch, string> = {
  toledo_espanha: "Toledo (ES/MX)",
  rodovalho: "Rodovalho",
  toledo_pisa: "Toledo Pisa",
  toledo_rodovalho: "Toledo Rodovalho",
};

const countryLabels: Record<string, string> = {
  BR: "Brasil",
  ES: "Espanha",
  MX: "México",
  PT: "Portugal",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatBirth(person: Person): string {
  if (person.is_living) {
    return "Vivo(a)";
  }

  if (person.birth_year === null) {
    return "Nascimento não informado";
  }

  const approximate = person.birth_year_approx ? " (aprox.)" : "";
  const place = [person.birth_place, person.birth_country ? (countryLabels[person.birth_country] ?? person.birth_country) : null]
    .filter(Boolean)
    .join(", ");

  return `*${person.birth_year}${approximate}${place ? `, ${place}` : ""}`;
}

function formatDeath(person: Person): string | null {
  if (person.is_living || person.death_year === null) {
    return null;
  }

  const approximate = person.death_year_approx ? " (aprox.)" : "";
  const place = person.death_place ? `, ${person.death_place}` : "";
  return `†${person.death_year}${approximate}${place}`;
}

function getCameraTarget(person: Person): [number, number, number] {
  if ("x" in person && "y" in person && "z" in person) {
    const node = person as Person & { x: number; y: number; z: number };
    return [node.x, node.y, node.z];
  }

  return [0, -person.generation_level * 80, 0];
}

function getParents(
  person: Person,
  personsById: ReadonlyMap<string, Person>,
): Person[] {
  return person.parents
    .map((parentId) => personsById.get(parentId))
    .filter((parent): parent is Person => parent !== undefined);
}

function RelationButton({
  label,
  person,
  onClick,
}: {
  label: string;
  person: Person;
  onClick: (person: Person) => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between gap-3 border-b border-white/10 py-2 text-left text-sm text-sand/80 transition hover:text-white"
      type="button"
      onClick={() => onClick(person)}
    >
      <span className="text-sand/50">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right font-medium">
        {person.name}
      </span>
    </button>
  );
}

function PersonAvatar({
  person,
  branchColor,
}: {
  person: Person;
  branchColor: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (person.photo_url && !imgError) {
    return (
      <div className="relative mb-5 h-24 w-24 overflow-hidden rounded-full border-2 border-white/20">
        <Image
          src={person.photo_url}
          alt={person.name}
          fill
          className="object-cover object-top"
          onError={() => setImgError(true)}
          sizes="96px"
        />
      </div>
    );
  }

  return (
    <div
      className={`mb-5 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold text-white ${branchColor}`}
    >
      {getInitials(person.name)}
    </div>
  );
}

export function PersonPanel({
  personId,
  personsById,
  onClose,
  onNavigateTo,
}: PersonPanelProps) {
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const setCameraTarget = useFamilyStore((state) => state.setCameraTarget);
  const person = personId ? personsById.get(personId) ?? null : null;

  const navigateToPerson = (target: Person) => {
    setCameraTarget(getCameraTarget(target));
    setSelectedPerson(target.id);
    onNavigateTo(target.id);
  };

  const parents = person ? getParents(person, personsById) : [];
  const father = parents.find((parent) => parent.gender === "male") ?? null;
  const mother = parents.find((parent) => parent.gender === "female") ?? null;
  const otherParents = parents.filter(
    (parent) => parent.id !== father?.id && parent.id !== mother?.id,
  );
  const spouses = person
    ? person.spouses
        .map((spouseId) => personsById.get(spouseId))
        .filter((item): item is Person => item !== undefined)
    : [];
  const death = person ? formatDeath(person) : null;

  return (
    <AnimatePresence>
      {person ? (
        <motion.aside
          animate={{ x: 0, opacity: 1 }}
          className="fixed right-0 top-0 z-[70] h-full w-80 overflow-y-auto border-l border-white/10 bg-[#0A0F1A]/95 p-6 text-sand shadow-2xl backdrop-blur"
          exit={{ x: 360, opacity: 0 }}
          initial={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <button
            className="mb-8 flex h-9 w-9 items-center justify-center border border-white/15 text-lg text-sand/70 transition hover:border-white/30 hover:text-white"
            type="button"
            aria-label="Fechar painel"
            onClick={onClose}
          >
            ×
          </button>

          <PersonAvatar
            person={person}
            branchColor={branchColors[person.branch]}
          />

          <h2 className="font-serif text-3xl font-semibold leading-tight text-white">
            {person.name}
          </h2>

          {person.titles.length > 0 ? (
            <p className="mt-1 text-sm italic text-sand/60">
              {person.titles.join(" · ")}
            </p>
          ) : null}

          <div className="mt-4 space-y-1 text-sm text-sand/75">
            <p>{formatBirth(person)}</p>
            {death ? <p>{death}</p> : null}
            {person.baptism_date || person.baptism_place ? (
              <p className="text-sand/50">
                Batismo: {[person.baptism_date, person.baptism_place].filter(Boolean).join(", ")}
              </p>
            ) : null}
            {person.burial_place ? (
              <p className="text-sand/50">Sep.: {person.burial_place}</p>
            ) : null}
          </div>

          {person.profession.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1">
              {person.profession.map((prof) => (
                <span
                  key={prof}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-sand/70"
                >
                  {prof}
                </span>
              ))}
            </div>
          ) : null}

          {person.bio_narrative ? (
            <section className="mt-6">
              <h3 className="border-b border-white/15 pb-2 text-sm font-semibold uppercase text-sand/60">
                Biografia
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-sand/60 line-clamp-6">
                {person.bio_narrative}
              </p>
            </section>
          ) : null}

          <section className="mt-8">
            <h3 className="border-b border-white/15 pb-2 text-sm font-semibold uppercase text-sand/60">
              Família próxima
            </h3>
            <div className="mt-3">
              {father ? (
                <RelationButton
                  label="Pai"
                  person={father}
                  onClick={navigateToPerson}
                />
              ) : null}
              {mother ? (
                <RelationButton
                  label="Mãe"
                  person={mother}
                  onClick={navigateToPerson}
                />
              ) : null}
              {otherParents.map((parent) => (
                <RelationButton
                  key={parent.id}
                  label="Parente"
                  person={parent}
                  onClick={navigateToPerson}
                />
              ))}
              {spouses.map((spouse) => (
                <RelationButton
                  key={spouse.id}
                  label="Cônjuge"
                  person={spouse}
                  onClick={navigateToPerson}
                />
              ))}
              {person.marriages.length > 0 && spouses.length === 0 ? (
                <>
                  {person.marriages.map((marriage) => (
                    <div
                      key={marriage.order}
                      className="flex w-full items-center justify-between gap-3 border-b border-white/10 py-2 text-sm text-sand/80"
                    >
                      <span className="text-sand/50">
                        {person.marriages.length > 1 ? `${marriage.order}º Cônjuge` : "Cônjuge"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-medium">
                        {marriage.spouse_name}
                        {marriage.year ? ` (${marriage.year})` : ""}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}
              <p className="flex items-center justify-between border-b border-white/10 py-2 text-sm text-sand/80">
                <span className="text-sand/50">Filhos</span>
                <span className="font-medium">
                  {person.children_count ?? person.children.length} pessoas
                </span>
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="border-b border-white/15 pb-2 text-sm font-semibold uppercase text-sand/60">
              Dados
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-sand/50">Ramo</dt>
                <dd className="text-right font-medium">{branchLabels[person.branch]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sand/50">Geração</dt>
                <dd className="font-medium">{person.generation_level}ª</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sand/50">País de nascimento</dt>
                <dd className="text-right font-medium">
                  {person.birth_country
                    ? countryLabels[person.birth_country] ?? person.birth_country
                    : "Não informado"}
                </dd>
              </div>
              {person.marital_status ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-sand/50">Estado civil</dt>
                  <dd className="text-right font-medium capitalize">{person.marital_status}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
