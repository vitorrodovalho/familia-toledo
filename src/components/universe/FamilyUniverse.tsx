"use client";

import { useState } from "react";
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

function formatTooltipMeta(node: PersonNode): string {
  const year = node.is_living
    ? "Vivo(a)"
    : node.birth_year?.toString() ?? "Ano desconhecido";
  const place = node.birth_place ?? node.birth_country ?? "Local desconhecido";

  return `${year} · ${place}`;
}

export function FamilyUniverse({ graph }: { graph: FamilyGraph }) {
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 200, 600], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0A0F1A" }}
        dpr={[1, 2]}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 200, 0]} intensity={1} />

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
          minDistance={50}
          maxDistance={2000}
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
