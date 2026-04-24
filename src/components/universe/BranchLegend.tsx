"use client";

import type { Branch } from "@/types/family";

const branches: Array<{ key: Branch; label: string; color: string }> = [
  { key: "toledo_espanha", label: "Toledo ES/MX", color: "#60a5fa" },
  { key: "rodovalho", label: "Rodovalho", color: "#4ade80" },
  { key: "toledo_pisa", label: "Toledo Pisa", color: "#c084fc" },
  { key: "toledo_rodovalho", label: "Toledo Rodovalho", color: "#fb923c" },
];

export function BranchLegend() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 border border-white/10 bg-[#0A0F1A]/70 p-3 text-xs text-sand/75 backdrop-blur">
      <div className="grid gap-2">
        {branches.map((branch) => (
          <div key={branch.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: branch.color }}
            />
            <span>{branch.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
