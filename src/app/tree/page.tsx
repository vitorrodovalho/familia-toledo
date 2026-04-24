"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PersonPanel } from "@/components/shared/PersonPanel";
import { FamilyTree } from "@/components/tree/FamilyTree";
import { useFamilyData } from "@/hooks/useFamilyData";
import { useFamilyStore } from "@/store/familyStore";

export default function TreePage() {
  const { data, loading, error } = useFamilyData();
  const selectedPersonId  = useFamilyStore((s) => s.selectedPersonId);
  const setSelectedPerson = useFamilyStore((s) => s.setSelectedPerson);
  const [rootId, setRootId] = useState<string | null>(null);

  const personsById = useMemo(
    () => new Map((data?.persons ?? []).map((p) => [p.id, p])),
    [data?.persons],
  );

  // Pick initial root: oldest generation-1 person with descendants
  useEffect(() => {
    if (!data || rootId) return;
    const gen1 = data.persons.filter((p) => p.generation_level === 1);
    const root =
      gen1.find((p) => p.children.length > 0) ??
      gen1[0] ??
      data.persons[0];
    if (root) setRootId(root.id);
  }, [data, rootId]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="max-w-lg border border-red-400/40 bg-red-950/30 p-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-white">
            Não foi possível carregar a árvore
          </h1>
          <p className="mt-3 text-sm text-sand/70">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#0A0F1A]">
      <FamilyTree
        persons={data?.persons ?? []}
        personsById={personsById}
        rootId={rootId}
        onRootChange={(id) => {
          setRootId(id);
          setSelectedPerson(id);
        }}
      />

      {selectedPersonId ? (
        <PersonPanel
          personId={selectedPersonId}
          personsById={personsById}
          onClose={() => setSelectedPerson(null)}
          onNavigateTo={(id) => {
            setRootId(id);
            setSelectedPerson(id);
          }}
        />
      ) : null}
    </section>
  );
}
