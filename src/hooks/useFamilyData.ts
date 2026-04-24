"use client";

import { useEffect, useState } from "react";
import type {
  Branch,
  EventType,
  FamilyData,
  Gender,
  HistoricalEvent,
  HistoricalType,
  MigrationRoute,
  Person,
  RawFamilyData,
  RawHistoricalEvent,
  RawMigrationRoute,
  RawPerson,
  RawTimelineEvent,
  TimelineEvent,
} from "@/types/family";

interface UseFamilyDataReturn {
  data: FamilyData | null;
  loading: boolean;
  error: string | null;
}

const BRANCHES = [
  "toledo_espanha",
  "rodovalho",
  "toledo_pisa",
  "toledo_rodovalho",
] as const satisfies readonly Branch[];

const GENDERS = ["male", "female", "unknown"] as const satisfies readonly Gender[];
const EVENT_TYPES = ["birth", "death"] as const satisfies readonly EventType[];
const HISTORICAL_TYPES = [
  "family",
  "historical",
] as const satisfies readonly HistoricalType[];

function isOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
): value is T {
  return (allowed as readonly string[]).includes(value);
}

function normalizeBranch(value: string | null | undefined): Branch | null {
  return value !== null && value !== undefined && isOneOf(value, BRANCHES)
    ? value
    : null;
}

function normalizeGender(value: string): Gender {
  return isOneOf(value, GENDERS) ? value : "unknown";
}

function normalizeEventType(value: string): EventType {
  if (!isOneOf(value, EVENT_TYPES)) {
    throw new Error(`Tipo de evento invalido: ${value}`);
  }

  return value;
}

function normalizeHistoricalType(value: string): HistoricalType {
  if (!isOneOf(value, HISTORICAL_TYPES)) {
    throw new Error(`Tipo de contexto historico invalido: ${value}`);
  }

  return value;
}

function normalizePerson(rawPerson: RawPerson): Person {
  const branch = normalizeBranch(rawPerson.branch);
  if (branch === null) {
    throw new Error(`Ramo familiar invalido: ${rawPerson.branch}`);
  }

  return {
    ...rawPerson,
    gender: normalizeGender(rawPerson.gender),
    branch,
  };
}

function resolveEventBranch(
  event: RawTimelineEvent,
  personsById: Map<string, Person>,
): Branch {
  return (
    normalizeBranch(event.branch) ??
    personsById.get(event.person_id)?.branch ??
    "toledo_rodovalho"
  );
}

function normalizeMigrationRoute(route: RawMigrationRoute): MigrationRoute {
  const [startGeneration, endGeneration] = route.generation_range;
  if (startGeneration === undefined || endGeneration === undefined) {
    throw new Error(`Rota migratoria invalida: ${route.id}`);
  }

  return {
    ...route,
    generation_range: [startGeneration, endGeneration],
  };
}

function normalizeHistoricalEvent(event: RawHistoricalEvent): HistoricalEvent {
  return {
    ...event,
    type: normalizeHistoricalType(event.type),
  };
}

function normalizeFamilyData(raw: RawFamilyData): FamilyData {
  const persons = raw.persons.map(normalizePerson);
  const personsById = new Map(persons.map((person) => [person.id, person]));
  const timeline_events: TimelineEvent[] = raw.timeline_events.map((event) => ({
    ...event,
    type: normalizeEventType(event.type),
    place: event.place ?? null,
    country: event.country ?? null,
    coordinates: event.coordinates ?? null,
    branch: resolveEventBranch(event, personsById),
  }));

  return {
    ...raw,
    persons,
    timeline_events,
    migration_routes: raw.migration_routes.map(normalizeMigrationRoute),
    historical_context: raw.historical_context.map(normalizeHistoricalEvent),
  };
}

export function useFamilyData(): UseFamilyDataReturn {
  const [data, setData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/familia_toledo.json") // Unica linha que muda na Etapa 2.
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar dados familiares: ${response.status}`);
        }

        return response.json() as Promise<RawFamilyData>;
      })
      .then((json) => {
        setData(normalizeFamilyData(json));
        setError(null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Erro desconhecido");
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
