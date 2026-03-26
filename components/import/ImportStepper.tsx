"use client";

import { motion } from "framer-motion";
import { Upload, Table2, CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { label: "Upload", icon: Upload },
  { label: "Review Data", icon: Table2 },
  { label: "Confirm", icon: CheckCircle },
];

interface ImportStepperProps {
  currentStep: number;
}

export function ImportStepper({ currentStep }: ImportStepperProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const Icon = step.icon;

        return (
          <div key={step.label} className="flex items-center gap-1">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isActive || isCompleted ? "hsl(var(--primary))" : "transparent",
                borderColor: isActive || isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive || isCompleted
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}
