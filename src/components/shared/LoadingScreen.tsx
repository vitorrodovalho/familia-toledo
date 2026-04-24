"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  loading?: boolean;
  minimumDurationMs?: number;
  totalStories?: number;
}

export function LoadingScreen({
  loading = true,
  minimumDurationMs = 800,
  totalStories = 2996,
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0A0F1A] px-6 text-sand"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full max-w-sm text-center">
            <div className="relative mx-auto mb-8 h-28 w-28">
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  key={index}
                  className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]"
                  style={{
                    left: `${18 + ((index * 31) % 68)}%`,
                    top: `${12 + ((index * 23) % 72)}%`,
                    animation: `starlight 1.4s ease-in-out ${index * 0.12}s infinite alternate`,
                  }}
                />
              ))}
            </div>

            <p className="font-serif text-2xl font-semibold text-white">
              Carregando {totalStories.toLocaleString("pt-BR")} histórias...
            </p>
            <div className="mt-6 h-2 overflow-hidden bg-white/10">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-terracotta"
                transition={{ ease: "linear", duration: 0.08 }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
