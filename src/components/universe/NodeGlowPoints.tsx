"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Branch, PersonNode } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";

const BRANCH_COLORS: Record<Branch, string> = {
  toledo_espanha: "#93c5fd",
  rodovalho: "#86efac",
  toledo_pisa: "#d8b4fe",
  toledo_rodovalho: "#fdba74",
};

function createGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 color;
      attribute float alpha;
      attribute float pointSize;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float distanceFromCenter = length(center);
        float glow = smoothstep(0.5, 0.0, distanceFromCenter);
        float core = smoothstep(0.18, 0.0, distanceFromCenter);
        gl_FragColor = vec4(vColor * (0.9 + core * 1.8), vAlpha * glow);
      }
    `,
  });
}

export function NodeGlowPoints({ nodes }: { nodes: PersonNode[] }) {
  const activeBranches = useFamilyStore((state) => state.activeBranches);
  const geometry = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const colors = new Float32Array(nodes.length * 3);
    const alpha = new Float32Array(nodes.length);
    const pointSize = new Float32Array(nodes.length);
    const color = new THREE.Color();

    nodes.forEach((node, index) => {
      positions[index * 3] = node.x;
      positions[index * 3 + 1] = node.y;
      positions[index * 3 + 2] = node.z;

      color.set(BRANCH_COLORS[node.branch]);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      alpha[index] = 1;
      pointSize[index] = Math.min(7 + node.descendant_count * 0.12, 18);
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    bufferGeometry.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
    bufferGeometry.setAttribute("pointSize", new THREE.BufferAttribute(pointSize, 1));

    return bufferGeometry;
  }, [nodes]);
  const material = useMemo(() => createGlowMaterial(), []);

  useEffect(() => {
    const alpha = geometry.getAttribute("alpha");
    const pointSize = geometry.getAttribute("pointSize");

    nodes.forEach((node, index) => {
      const active = activeBranches.has(node.branch);
      alpha.setX(index, active ? 0.95 : 0.08);
      pointSize.setX(index, active ? Math.min(7 + node.descendant_count * 0.12, 18) : 3);
    });

    alpha.needsUpdate = true;
    pointSize.needsUpdate = true;
  }, [activeBranches, geometry, nodes]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
