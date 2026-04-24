"use client";

import { useMemo } from "react";
import * as d3Force3d from "d3-force-3d";
import type {
  FamilyGraph,
  Person,
  PersonEdge,
  PersonNode,
} from "@/types/family";

interface ForceLink {
  source: string;
  target: string;
}

function countDescendants(
  personId: string,
  childrenById: Map<string, string[]>,
  cache: Map<string, number>,
  visiting = new Set<string>(),
): number {
  const cached = cache.get(personId);
  if (cached !== undefined) {
    return cached;
  }

  if (visiting.has(personId)) {
    return 0;
  }

  visiting.add(personId);
  const children = childrenById.get(personId) ?? [];
  const total = children.reduce(
    (sum, childId) =>
      sum + 1 + countDescendants(childId, childrenById, cache, visiting),
    0,
  );
  visiting.delete(personId);
  cache.set(personId, total);

  return total;
}

function countAncestors(
  personId: string,
  parentsById: Map<string, string[]>,
  cache: Map<string, number>,
  visiting = new Set<string>(),
): number {
  const cached = cache.get(personId);
  if (cached !== undefined) {
    return cached;
  }

  if (visiting.has(personId)) {
    return 0;
  }

  visiting.add(personId);
  const parents = parentsById.get(personId) ?? [];
  const total = parents.reduce(
    (sum, parentId) =>
      sum + 1 + countAncestors(parentId, parentsById, cache, visiting),
    0,
  );
  visiting.delete(personId);
  cache.set(personId, total);

  return total;
}

export function usePersonGraph(persons: Person[]): FamilyGraph {
  return useMemo(() => {
    if (!persons.length) {
      return { nodes: [], edges: [], byId: new Map() };
    }

    const personIds = new Set(persons.map((person) => person.id));
    const childrenById = new Map(
      persons.map((person) => [
        person.id,
        person.children.filter((childId) => personIds.has(childId)),
      ]),
    );
    const parentsById = new Map(
      persons.map((person) => [
        person.id,
        person.parents.filter((parentId) => personIds.has(parentId)),
      ]),
    );

    const descendantCount = new Map<string, number>();
    const ancestorCount = new Map<string, number>();

    for (const person of persons) {
      countDescendants(person.id, childrenById, descendantCount);
      countAncestors(person.id, parentsById, ancestorCount);
    }

    const edges: PersonEdge[] = [];
    const seenEdges = new Set<string>();

    for (const person of persons) {
      for (const childId of childrenById.get(person.id) ?? []) {
        const key = `${person.id}->${childId}:parent-child`;
        if (!seenEdges.has(key)) {
          edges.push({ source: person.id, target: childId, type: "parent-child" });
          seenEdges.add(key);
        }
      }

      for (const spouseId of person.spouses.filter((id) => personIds.has(id))) {
        const [source, target] =
          person.id < spouseId ? [person.id, spouseId] : [spouseId, person.id];
        const key = `${source}->${target}:spouse`;
        if (!seenEdges.has(key)) {
          edges.push({ source, target, type: "spouse" });
          seenEdges.add(key);
        }
      }
    }

    const nodes: PersonNode[] = persons.map((person, index) => {
      const angle = index * 2.399963229728653;
      const radius = 180 + (index % 29) * 14;

      return {
        ...person,
        x: Math.cos(angle) * radius,
        y: -(person.generation_level ?? 0) * 80,
        z: Math.sin(angle) * radius,
        descendant_count: descendantCount.get(person.id) ?? 0,
        ancestor_count: ancestorCount.get(person.id) ?? 0,
      };
    });

    const simulationLinks: ForceLink[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const simulation = d3Force3d
      .forceSimulation<PersonNode>(nodes, 3)
      .force(
        "link",
        d3Force3d
          .forceLink<PersonNode, ForceLink>(simulationLinks)
          .id((node) => node.id)
          .distance((link) => (link.source === link.target ? 120 : 70)),
      )
      .force("charge", d3Force3d.forceManyBody<PersonNode>().strength(-30))
      .force("center", d3Force3d.forceCenter<PersonNode>(0, 0, 0))
      .stop();

    for (let index = 0; index < 150; index += 1) {
      simulation.tick();
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));

    return { nodes, edges, byId };
  }, [persons]);
}
