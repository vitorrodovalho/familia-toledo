"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  loading?: boolean;
  minimumDurationMs?: number;
  totalPeople?: number;
}

export function LoadingScreen({
  loading = true,
  minimumDurationMs = 800,
  totalPeople = 7234,
}: LoadingScreenProps) {
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const minimumTimer = window.setTimeout(
      () => setMinimumElapsed(true),
      minimumDurationMs,
    );
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, Math.round((elapsed / 2000) * 100)));
    }, 40);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearInterval(progressTimer);
    };
  }, [minimumDurationMs]);

  const visible = loading || !minimumElapsed;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#f4efe7] px-6 text-[#111111]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full max-w-sm border border-[#cfc5b2] bg-[#fffdf8] px-8 py-10 text-center shadow-[0_18px_45px_rgba(63,46,25,0.12)]">
            <p className="text-sm font-semibold text-[#111111]">1</p>
            <p className="mt-8 font-serif text-3xl font-semibold italic leading-tight text-[#b80000]">
              Genealogia da família Toledo
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              1466 a 2025
            </p>

            <div className="mx-auto mt-8 h-px w-28 bg-[#d8cdbb]" />

            <p className="mt-8 text-sm text-[#3d352b]">
              Carregando {totalPeople.toLocaleString("pt-BR")} histórias...
            </p>
            <div className="mt-5 h-2 overflow-hidden border border-[#d8cdbb] bg-white">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-[#b80000]"
                transition={{ ease: "linear", duration: 0.08 }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
