"use client";

import { useEffect, useMemo, useState } from "react";
import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { FamilyGraph, PersonNode } from "@/types/family";
import { CameraController } from "./CameraController";
import { FamilyEdges } from "./FamilyEdges";
import { NodeGlowPoints } from "./NodeGlowPoints";
import { PersonNodes } from "./PersonNodes";
import { StarBackground } from "./StarBackground";
import type { RaycastPointer } from "./useRaycasting";

interface HoveredNode {
  node: PersonNode;
  pointer: RaycastPointer;
}

interface HomeCameraProps {
  cameraPosition: [number, number, number];
  target: [number, number, number];
  resetSignal: number;
}

function HomeCamera({ cameraPosition, target, resetSignal }: HomeCameraProps) {
  const { camera, controls } = useThree();

  useEffect(() => {
    camera.position.set(...cameraPosition);
    camera.lookAt(...target);

    const orbitControls = controls as unknown as
      | { target: THREE.Vector3; update: () => void }
      | undefined;

    if (orbitControls) {
      orbitControls.target.set(...target);
      orbitControls.update();
    }
  }, [camera, cameraPosition, controls, resetSignal, target]);

  return null;
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
  const distance = Math.max(380, Math.min(720, spread * 0.42));

  return {
    center,
    camera: [center[0], center[1] + distance * 0.16, center[2] + distance] as [
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
  const [resetSignal, setResetSignal] = useState(0);
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
        <NodeGlowPoints nodes={graph.nodes} />
        <PersonNodes
          nodes={graph.nodes}
          onHoverNode={(node, pointer) =>
            setHoveredNode(node && pointer ? { node, pointer } : null)
          }
        />
        <FamilyEdges edges={graph.edges} nodes={graph.byId} />
        <CameraController />
        <HomeCamera
          cameraPosition={graphView.camera}
          target={graphView.center}
          resetSignal={resetSignal}
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          zoomSpeed={1}
          panSpeed={0.8}
          minDistance={35}
          maxDistance={3200}
          target={graphView.center}
          makeDefault
        />
      </Canvas>

      <div className="absolute bottom-5 right-5 z-30 flex gap-2">
        <button
          className="h-10 border border-white/15 bg-[#0A0F1A]/80 px-3 text-sm text-sand backdrop-blur transition hover:border-white/35 hover:text-white"
          type="button"
          onClick={() => setResetSignal((current) => current + 1)}
        >
          Reenquadrar
        </button>
      </div>

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
