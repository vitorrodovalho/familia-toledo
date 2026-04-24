"use client";

import { useMemo } from "react";

export function StarBackground({ count = 2000 }: { count?: number }) {
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (Math.random() - 0.5) * 4000;
      values[index * 3 + 1] = (Math.random() - 0.5) * 4000;
      values[index * 3 + 2] = (Math.random() - 0.5) * 4000;
    }

    return values;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.5}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}
