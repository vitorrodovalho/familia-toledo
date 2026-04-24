export interface Coordinates {
  lat: number;
  lng: number;
}

export type Branch =
  | "toledo_espanha"
  | "rodovalho"
  | "toledo_pisa"
  | "toledo_rodovalho";

export type Gender = "male" | "female" | "unknown";
export type EventType = "birth" | "death";
export type HistoricalType = "family" | "historical";

export interface Person {
  id: string;
  name: string;
  generation_level: number;
  birth_year: number | null;
  birth_year_approx: boolean;
  birth_place: string | null;
  birth_country: string | null;
  birth_coordinates: Coordinates | null;
  death_year: number | null;
  gender: Gender;
  is_living: boolean;
  parents: string[];
  children: string[];
  spouses: string[];
  branch: Branch;
  raw_line: string;
}

export interface TimelineEvent {
  type: EventType;
  year: number;
  person_id: string;
  person_name: string;
  place: string | null;
  country: string | null;
  coordinates: Coordinates | null;
  generation: number | null;
  branch: Branch;
}

export interface HistoricalEvent {
  year: number;
  event: string;
  type: HistoricalType;
  region: string;
}

export interface MigrationRoute {
  id: string;
  from_place: string;
  to_place: string;
  from_coordinates: Coordinates;
  to_coordinates: Coordinates;
  period: string;
  generation_range: [number, number];
  key_person: string;
  description: string;
}

export interface FamilyMeta {
  title: string;
  total_persons: number;
  year_range: { min: number; max: number };
  branches: Record<Branch, string>;
  origin_summary: string;
}

export interface FamilyData {
  meta: FamilyMeta;
  persons: Person[];
  timeline_events: TimelineEvent[];
  migration_routes: MigrationRoute[];
  historical_context: HistoricalEvent[];
}

export interface PersonNode extends Person {
  x: number;
  y: number;
  z: number;
  descendant_count: number;
  ancestor_count: number;
}

export interface PersonEdge {
  source: string;
  target: string;
  type: "parent-child" | "spouse";
}

export interface FamilyGraph {
  nodes: PersonNode[];
  edges: PersonEdge[];
  byId: Map<string, PersonNode>;
}

export interface RawPerson extends Omit<Person, "gender" | "branch"> {
  gender: string;
  branch: string;
}

export interface RawTimelineEvent
  extends Omit<TimelineEvent, "type" | "place" | "country" | "coordinates" | "branch"> {
  type: string;
  place?: string | null;
  country?: string | null;
  coordinates?: Coordinates | null;
  branch?: string | null;
}

export interface RawHistoricalEvent extends Omit<HistoricalEvent, "type"> {
  type: string;
}

export interface RawMigrationRoute extends Omit<MigrationRoute, "generation_range"> {
  generation_range: number[];
}

export interface RawFamilyData
  extends Omit<
    FamilyData,
    "persons" | "timeline_events" | "migration_routes" | "historical_context"
  > {
  persons: RawPerson[];
  timeline_events: RawTimelineEvent[];
  migration_routes: RawMigrationRoute[];
  historical_context: RawHistoricalEvent[];
}
