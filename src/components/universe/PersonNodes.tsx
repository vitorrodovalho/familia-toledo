"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Branch, PersonNode } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";
import { useRaycasting, type RaycastPointer } from "./useRaycasting";

const BRANCH_COLORS: Record<Branch, string> = {
  toledo_espanha: "#60a5fa",
  rodovalho: "#4ade80",
  toledo_pisa: "#c084fc",
  toledo_rodovalho: "#fb923c",
};

interface PersonNodesProps {
  nodes: PersonNode[];
  onHoverNode: (node: PersonNode | null, pointer: RaycastPointer | null) => void;
}

function getNodeSize(node: PersonNode): number {
  return Math.min(3.2 + node.descendant_count * 0.08, 11);
}

function createNodeMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 instanceColor;
      attribute float instanceOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      varying vec3 vNormal;

      void main() {
        vColor = instanceColor;
        vOpacity = instanceOpacity;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      varying vec3 vNormal;

      void main() {
        float light = dot(normalize(vNormal), normalize(vec3(0.35, 0.7, 1.0))) * 0.35 + 0.75;
        vec3 glow = vColor * light * 1.9 + vColor * 0.55;
        gl_FragColor = vec4(glow, vOpacity);
      }
    `,
  });
}

export function PersonNodes({ nodes, onHoverNode }: PersonNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const activeBranches = useFamilyStore((state) => state.activeBranches);
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const setCameraTarget = useFamilyStore((state) => state.setCameraTarget);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const material = useMemo(() => createNodeMaterial(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const opacities = new Float32Array(nodes.length);

    nodes.forEach((node, index) => {
      const active = activeBranches.has(node.branch);
      dummy.position.set(node.x, node.y, node.z);
      dummy.scale.setScalar(active ? getNodeSize(node) : getNodeSize(node) * 0.45);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);

      color.set(BRANCH_COLORS[node.branch] ?? "#ffffff");
      mesh.setColorAt(index, color);
      opacities[index] = active ? 1 : 0.1;
    });

    geometry.setAttribute(
      "instanceOpacity",
      new THREE.InstancedBufferAttribute(opacities, 1),
    );
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    const opacityAttribute = geometry.getAttribute("instanceOpacity");
    if (opacityAttribute) {
      opacityAttribute.needsUpdate = true;
    }
  }, [activeBranches, geometry, nodes]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useRaycasting(
    meshRef,
    nodes,
    (nodeIndex, pointer) => {
      const node = nodeIndex === null ? null : nodes[nodeIndex] ?? null;
      onHoverNode(node, pointer);
    },
    (nodeIndex) => {
      const node = nodes[nodeIndex];
      if (!node || !activeBranches.has(node.branch)) {
        return;
      }

      setSelectedPerson(node.id);
      setCameraTarget([node.x, node.y, node.z]);
    },
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, nodes.length]}
      frustumCulled={false}
    />
  );
}
