"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { PersonEdge, PersonNode } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";

interface FamilyEdgesProps {
  edges: PersonEdge[];
  nodes: ReadonlyMap<string, PersonNode>;
}

export function FamilyEdges({ edges, nodes }: FamilyEdgesProps) {
  const activeBranches = useFamilyStore((state) => state.activeBranches);
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];

    for (const edge of edges) {
      const source = nodes.get(edge.source);
      const target = nodes.get(edge.target);

      if (
        !source ||
        !target ||
        !activeBranches.has(source.branch) ||
        !activeBranches.has(target.branch)
      ) {
        continue;
      }

      positions.push(source.x, source.y, source.z);
      positions.push(target.x, target.y, target.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    return geometry;
  }, [activeBranches, edges, nodes]);

  useEffect(() => {
    return () => lineGeometry.dispose();
  }, [lineGeometry]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#334155" transparent opacity={0.3} />
    </lineSegments>
  );
}
