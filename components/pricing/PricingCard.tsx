"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PricingFeature {
  text: string;
  highlight?: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PricingFeature[];
  popular?: boolean;
  cta: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
}

export function PricingCard({ plan, isYearly, index }: PricingCardProps) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savedPerMonth = plan.monthlyPrice - plan.yearlyPrice;
  const savedPerYear = savedPerMonth * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="relative"
    >
      {/* Glow effect for popular plan */}
      {plan.popular && (
        <motion.div
          className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-primary/40 via-primary/20 to-primary/5 blur-[2px]"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden transition-all duration-500",
          plan.popular
            ? "border-primary/30 bg-card shadow-lg shadow-primary/5 dark:border-primary/40 dark:shadow-primary/10"
            : "border-border/60 bg-card hover:border-border dark:border-border/40 dark:hover:border-border/60",
        )}
      >
        {/* Popular badge */}
        {plan.popular && (
          <div className="flex justify-center pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:text-primary">
                Most popular
              </Badge>
            </motion.div>
          </div>
        )}

        <CardHeader className={cn("space-y-3 pb-2", !plan.popular && "pt-6")}>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold tracking-tight text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 pt-2">
            <motion.span
              key={price}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-extrabold tracking-tight text-foreground"
            >
              ${price}
            </motion.span>
            <span className="text-sm font-medium text-muted-foreground">/month</span>
          </div>

          {/* Savings badge */}
          {isYearly && savedPerYear > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                Save ${savedPerYear}/year
              </span>
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5 pt-2">
          {/* CTA Button */}
          <Button
            className={cn(
              "w-full font-semibold transition-all duration-300",
              plan.popular
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            size="lg"
          >
            {plan.cta}
          </Button>

          <Separator className="opacity-50" />

          {/* Features list */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What&apos;s included
            </p>
            <ul className="space-y-2.5">
              {plan.features.map((feature, i) => (
                <motion.li
                  key={feature.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.15 + i * 0.05 + 0.3,
                  }}
                  className="flex items-start gap-2.5"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                      plan.popular
                        ? "bg-primary/15 text-primary dark:bg-primary/25"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                  <span
                    className={cn(
                      "text-sm leading-tight",
                      feature.highlight ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {feature.text}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
