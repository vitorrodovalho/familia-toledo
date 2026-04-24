"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFamilyStore } from "@/store/familyStore";

const cameraOffset = new THREE.Vector3(50, 30, 100);
const targetPosition = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();

export function CameraController() {
  const { camera } = useThree();
  const cameraTarget = useFamilyStore((state) => state.cameraTarget);

  useFrame(() => {
    if (!cameraTarget) {
      return;
    }

    const [x, y, z] = cameraTarget;
    lookAtTarget.set(x, y, z);
    targetPosition.copy(lookAtTarget).add(cameraOffset);
    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(lookAtTarget);
  });

  return null;
}
