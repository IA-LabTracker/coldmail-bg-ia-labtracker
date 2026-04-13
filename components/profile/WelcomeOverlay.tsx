"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface WelcomeOverlayProps {
  name: string;
  onComplete: () => void;
}

export function WelcomeOverlay({ name, onComplete }: WelcomeOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ perspective: "800px" }}>
        <motion.div
          className="text-center"
          initial={{ rotateX: 40, scale: 0.15, opacity: 0, translateZ: -600 }}
          animate={{ rotateX: 0, scale: 1, opacity: 1, translateZ: 0 }}
          exit={{ scale: 1.3, opacity: 0, translateZ: 200 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.h1
            className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Welcome, {name}!
          </motion.h1>
          <motion.p
            className="mt-3 text-base text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Good to see you here
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
