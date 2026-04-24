"use client";

import { useMemo, useState } from "react";
import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { FamilyGraph, PersonNode } from "@/types/family";
import { CameraController } from "./CameraController";
import { FamilyEdges } from "./FamilyEdges";
import { PersonNodes } from "./PersonNodes";
import { StarBackground } from "./StarBackground";
import type { RaycastPointer } from "./useRaycasting";

interface HoveredNode {
  node: PersonNode;
  pointer: RaycastPointer;
}

function getGraphView(nodes: PersonNode[]) {
  if (!nodes.length) {
    return {
      center: [0, -420, 0] as [number, number, number],
      camera: [0, -180, 760] as [number, number, number],
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
    minZ = Math.min(minZ, node.z);
    maxZ = Math.max(maxZ, node.z);
  }

  const center: [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ];
  const spread = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const distance = Math.max(620, Math.min(1050, spread * 0.72));

  return {
    center,
    camera: [center[0], center[1] + distance * 0.22, center[2] + distance] as [
      number,
      number,
      number,
    ],
  };
}

function formatTooltipMeta(node: PersonNode): string {
  const year = node.is_living
    ? "Vivo(a)"
    : node.birth_year?.toString() ?? "Ano desconhecido";
  const place = node.birth_place ?? node.birth_country ?? "Local desconhecido";

  return `${year} · ${place}`;
}

export function FamilyUniverse({ graph }: { graph: FamilyGraph }) {
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
  const graphView = useMemo(() => getGraphView(graph.nodes), [graph.nodes]);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: graphView.camera, fov: 52 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0A0F1A" }}
        dpr={[1, 2]}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 220, 420]} intensity={1.5} />

        <StarBackground count={2000} />
        <PersonNodes
          nodes={graph.nodes}
          onHoverNode={(node, pointer) =>
            setHoveredNode(node && pointer ? { node, pointer } : null)
          }
        />
        <FamilyEdges edges={graph.edges} nodes={graph.byId} />
        <CameraController />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          zoomSpeed={0.5}
          panSpeed={0.5}
          minDistance={35}
          maxDistance={2600}
          target={graphView.center}
        />
      </Canvas>

      {hoveredNode ? (
        <div
          className="pointer-events-none fixed z-[85] max-w-64 border border-white/15 bg-[#0A0F1A]/95 px-3 py-2 text-sm text-sand shadow-2xl backdrop-blur"
          style={{
            left: hoveredNode.pointer.clientX + 14,
            top: hoveredNode.pointer.clientY + 14,
          }}
        >
          <p className="truncate font-medium text-white">{hoveredNode.node.name}</p>
          <p className="mt-1 truncate text-xs text-sand/65">
            {formatTooltipMeta(hoveredNode.node)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
