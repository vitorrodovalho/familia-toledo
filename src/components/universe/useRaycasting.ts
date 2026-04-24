"use client";

import { useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PersonNode } from "@/types/family";

export interface RaycastPointer {
  clientX: number;
  clientY: number;
}

export function useRaycasting(
  meshRef: React.RefObject<THREE.InstancedMesh>,
  nodes: PersonNode[],
  onHover: (nodeIndex: number | null, pointer: RaycastPointer | null) => void,
  onClick: (nodeIndex: number) => void,
) {
  const { camera, gl } = useThree();

  const pickInstance = useCallback(
    (event: MouseEvent | PointerEvent): number | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      if (!meshRef.current) {
        return null;
      }

      const [hit] = raycaster.intersectObject(meshRef.current);
      if (hit?.instanceId === undefined || hit.instanceId >= nodes.length) {
        return null;
      }

      return hit.instanceId;
    },
    [camera, gl, meshRef, nodes.length],
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const instanceId = pickInstance(event);
      if (instanceId !== null) {
        onClick(instanceId);
      }
    },
    [onClick, pickInstance],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const instanceId = pickInstance(event);
      gl.domElement.style.cursor = instanceId === null ? "grab" : "pointer";
      onHover(
        instanceId,
        instanceId === null
          ? null
          : { clientX: event.clientX, clientY: event.clientY },
      );
    },
    [gl, onHover, pickInstance],
  );

  const handlePointerLeave = useCallback(() => {
    gl.domElement.style.cursor = "grab";
    onHover(null, null);
  }, [gl, onHover]);

  useEffect(() => {
    const element = gl.domElement;
    element.addEventListener("click", handleClick);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    element.style.cursor = "grab";

    return () => {
      element.removeEventListener("click", handleClick);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      element.style.cursor = "";
    };
  }, [gl, handleClick, handlePointerLeave, handlePointerMove]);

  return { handleClick };
}
