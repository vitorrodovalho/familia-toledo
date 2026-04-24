"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFamilyStore } from "@/store/familyStore";

const cameraOffset = new THREE.Vector3(70, 45, 140);
const targetPosition = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();

export function CameraController() {
  const { camera, controls } = useThree();
  const cameraTarget = useFamilyStore((state) => state.cameraTarget);
  const setCameraTarget = useFamilyStore((state) => state.setCameraTarget);

  useFrame(() => {
    if (!cameraTarget) {
      return;
    }

    const [x, y, z] = cameraTarget;
    lookAtTarget.set(x, y, z);
    targetPosition.copy(lookAtTarget).add(cameraOffset);
    camera.position.lerp(targetPosition, 0.07);
    camera.lookAt(lookAtTarget);

    const orbitControls = controls as unknown as
      | { target: THREE.Vector3; update: () => void }
      | undefined;

    if (orbitControls) {
      orbitControls.target.lerp(lookAtTarget, 0.12);
      orbitControls.update();
    }

    if (camera.position.distanceTo(targetPosition) < 2) {
      setCameraTarget(null);
    }
  });

  return null;
}
