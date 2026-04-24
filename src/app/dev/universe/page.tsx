"use client";

import { useEffect, useState } from "react";
import { BranchFilter } from "@/components/shared/BranchFilter";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PersonPanel } from "@/components/shared/PersonPanel";
import { SearchBar } from "@/components/shared/SearchBar";
import { BranchLegend } from "@/components/universe/BranchLegend";
import { FamilyUniverse } from "@/components/universe/FamilyUniverse";
import { useFamilyData } from "@/hooks/useFamilyData";
import { usePersonGraph } from "@/hooks/usePersonGraph";
import { useFamilyStore } from "@/store/familyStore";

export default function UniversePage() {
  const { data, loading, error } = useFamilyData();
  const graph = usePersonGraph(data?.persons ?? []);
  const selectedPersonId = useFamilyStore((state) => state.selectedPersonId);
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const isPanelOpen = useFamilyStore((state) => state.isPanelOpen);
  const setSearchResults = useFamilyStore((state) => state.setSearchResults);
  const [minimumLoadingElapsed, setMinimumLoadingElapsed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMinimumLoadingElapsed(true), 800);
    return () => window.clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="max-w-lg border border-red-400/40 bg-red-950/30 p-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-white">
            Não foi possível carregar o universo
          </h1>
          <p className="mt-3 text-sm text-sand/70">{error}</p>
        </div>
      </section>
    );
  }

  const showLoading = loading || !minimumLoadingElapsed;

  return (
    <section className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#0A0F1A]">
      {data ? <FamilyUniverse graph={graph} /> : null}

      <div className="pointer-events-none absolute left-5 top-5 z-20 flex w-[min(28rem,calc(100%-2.5rem))] flex-col gap-3">
        <div className="pointer-events-auto">
          <SearchBar persons={graph.nodes} onResults={setSearchResults} />
        </div>
        <div className="pointer-events-auto">
          <BranchFilter />
        </div>
      </div>

      <BranchLegend />

      {isPanelOpen && selectedPersonId ? (
        <PersonPanel
          personId={selectedPersonId}
          personsById={graph.byId}
          onClose={() => setSelectedPerson(null)}
          onNavigateTo={setSelectedPerson}
        />
      ) : null}

      <LoadingScreen
        loading={showLoading}
        totalStories={data?.meta.total_persons ?? 2996}
      />
    </section>
  );
}
