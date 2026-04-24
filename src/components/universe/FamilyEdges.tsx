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
  const { primaryGeometry, glowGeometry } = useMemo(() => {
    const positions: number[] = [];
    const glowPositions: number[] = [];

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

      if (edge.type === "parent-child") {
        glowPositions.push(source.x, source.y, source.z);
        glowPositions.push(target.x, target.y, target.z);
      }
    }

    const primary = new THREE.BufferGeometry();
    primary.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const glow = new THREE.BufferGeometry();
    glow.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(glowPositions, 3),
    );

    return { primaryGeometry: primary, glowGeometry: glow };
  }, [activeBranches, edges, nodes]);

  useEffect(() => {
    return () => {
      primaryGeometry.dispose();
      glowGeometry.dispose();
    };
  }, [glowGeometry, primaryGeometry]);

  return (
    <>
      <lineSegments geometry={primaryGeometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#94a3b8"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={glowGeometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#f8fafc"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
}
