"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BillingToggleProps {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}

export function BillingToggle({ isYearly, onToggle }: BillingToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex items-center justify-center gap-3"
    >
      <button
        onClick={() => onToggle(false)}
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          !isYearly ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Monthly
      </button>

      {/* Custom toggle */}
      <button
        onClick={() => onToggle(!isYearly)}
        className="relative flex h-7 w-[52px] cursor-pointer items-center rounded-full bg-secondary p-0.5 transition-colors duration-300 data-[state=checked]:bg-primary"
        data-state={isYearly ? "checked" : "unchecked"}
      >
        <motion.div
          className="h-6 w-6 rounded-full bg-white shadow-md"
          animate={{ x: isYearly ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggle(true)}
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            isYearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Yearly
        </button>
        {isYearly && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400"
          >
            -20%
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
