"use client";

import { useMemo, useState } from "react";
import { BranchFilter } from "@/components/shared/BranchFilter";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { PersonPanel } from "@/components/shared/PersonPanel";
import { SearchBar } from "@/components/shared/SearchBar";
import { FamilyTimeline } from "@/components/timeline/FamilyTimeline";
import { useFamilyData } from "@/hooks/useFamilyData";
import { useFamilyStore } from "@/store/familyStore";

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="border border-slate-800 bg-[#0D1526] px-4 py-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function TimelinePage() {
  const { data, loading, error } = useFamilyData();
  const selectedPersonId = useFamilyStore((state) => state.selectedPersonId);
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const setSearchResults = useFamilyStore((state) => state.setSearchResults);
  const [resetSignal, setResetSignal] = useState(0);
  const personsById = useMemo(
    () => new Map((data?.persons ?? []).map((person) => [person.id, person])),
    [data?.persons],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="max-w-lg border border-red-400/40 bg-red-950/30 p-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-white">
            Não foi possível carregar a timeline
          </h1>
          <p className="mt-3 text-sm text-sand/70">{error}</p>
        </div>
      </section>
    );
  }

  const persons = data?.persons ?? [];
  const events = data?.timeline_events ?? [];
  const historicalEvents = data?.historical_context ?? [];
  const generations = persons.reduce(
    (max, person) => Math.max(max, person.generation_level),
    0,
  );

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#0A0F1A] text-white">
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
            <SearchBar persons={persons} onResults={setSearchResults} />
            <BranchFilter />
          </div>
          <button
            className="h-9 border border-white/15 px-3 text-sm text-slate-300 transition hover:border-white/35 hover:text-white"
            type="button"
            onClick={() => setResetSignal((current) => current + 1)}
          >
            Resetar zoom
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Pessoas"
            value={(data?.meta.total_persons ?? persons.length).toLocaleString("pt-BR")}
          />
          <StatCard label="Anos cobertos" value="559" />
          <StatCard label="Gerações" value={String(generations || 15)} />
          <StatCard label="Eventos" value={events.length.toLocaleString("pt-BR")} />
        </div>

        <FamilyTimeline
          events={events}
          historicalEvents={historicalEvents}
          persons={persons}
          resetSignal={resetSignal}
        />
      </div>

      <div
        id="timeline-tooltip"
        className="fixed z-[85] hidden max-w-xs border border-white/15 bg-slate-900 px-3 py-2 text-xs text-white shadow-2xl pointer-events-none"
      />

      {selectedPersonId ? (
        <PersonPanel
          personId={selectedPersonId}
          personsById={personsById}
          onClose={() => setSelectedPerson(null)}
          onNavigateTo={setSelectedPerson}
        />
      ) : null}
    </section>
  );
}
