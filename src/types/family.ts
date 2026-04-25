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

export interface Marriage {
  order: number;
  spouse_name: string;
  date: string | null;
  year: number | null;
  place: string | null;
}

export interface Person {
  id: string;
  name: string;
  slug: string;
  generation_level: number;
  gender: Gender;
  is_living: boolean;
  branch: Branch;
  page: number | null;
  birth_date: string | null;
  birth_year: number | null;
  birth_year_approx: boolean;
  birth_place: string | null;
  birth_country: string | null;
  birth_coordinates: Coordinates | null;
  death_date: string | null;
  death_year: number | null;
  death_year_approx: boolean;
  death_place: string | null;
  death_country: string | null;
  baptism_date: string | null;
  baptism_place: string | null;
  burial_place: string | null;
  parents: string[];
  children: string[];
  spouses: string[];
  marriages: Marriage[];
  father_name: string | null;
  mother_name: string | null;
  paternal_grandfather: string | null;
  maternal_grandfather: string | null;
  profession: string[];
  titles: string[];
  marital_status: string | null;
  children_count: number | null;
  has_descendants: boolean;
  bio_narrative: string | null;
  photo_filename: string | null;
  photo_url: string | null;
  raw_text: string | null;
}

export interface TimelineEvent {
  type: EventType;
  year: number;
  year_approx: boolean;
  person_id: string;
  person_name: string;
  place: string | null;
  country: string | null;
  coordinates: Coordinates | null;
  generation: number | null;
  branch: Branch;
  profession: string[];
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
  key_person: string;
  description: string;
}

export interface NotablePerson {
  name: string;
  year: number;
  note: string;
}

export interface FamilyMeta {
  title: string;
  subtitle: string;
  author: string;
  source_pdf: string;
  extractor_version: string;
  extracted: string;
  total_persons: number;
  with_birth_year: number;
  with_location: number;
  with_photo: number;
  with_bio: number;
  with_profession: number;
  with_marriage: number;
  multi_marriage: number;
  estimated_living: number;
  with_parent_links: number;
  year_range: { min: number; max: number };
  branches: Record<Branch, string>;
  origin_summary: string;
  notable_persons: NotablePerson[];
}

export interface PhotoIndex {
  filename: string;
  caption: string;
  gen_num: number | null;
  first_name: string | null;
  page: number | null;
}

export interface FamilyData {
  meta: FamilyMeta;
  persons: Person[];
  timeline_events: TimelineEvent[];
  migration_routes: MigrationRoute[];
  historical_context: HistoricalEvent[];
  photos_index: PhotoIndex[];
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

type RawStringArray = string[] | null | undefined;
type RawMarriageArray = Marriage[] | null | undefined;

export interface RawPerson
  extends Omit<
    Person,
    | "gender"
    | "branch"
    | "parents"
    | "children"
    | "spouses"
    | "profession"
    | "titles"
    | "marriages"
  > {
  gender: string;
  branch: string;
  parents: RawStringArray;
  children: RawStringArray;
  spouses: RawStringArray;
  profession: RawStringArray;
  titles: RawStringArray;
  marriages: RawMarriageArray;
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

export interface RawFamilyData
  extends Omit<
    FamilyData,
    "persons" | "timeline_events" | "migration_routes" | "historical_context"
  > {
  persons: RawPerson[];
  timeline_events: RawTimelineEvent[];
  migration_routes: MigrationRoute[];
  historical_context: RawHistoricalEvent[];
}
