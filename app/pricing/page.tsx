"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PricingCard } from "@/components/pricing/PricingCard";
import { BillingToggle } from "@/components/pricing/BillingToggle";

const plans = [
  {
    name: "Starter",
    description:
      "Perfect for individuals and small teams getting started with cold email outreach.",
    monthlyPrice: 150,
    yearlyPrice: 120,
    cta: "Get started",
    features: [
      { text: "1 sender email account", highlight: true },
      { text: "1,000 emails per month" },
      { text: "Basic email warmup" },
      { text: "CSV & Excel import" },
      { text: "Campaign management" },
      { text: "Open & reply tracking" },
      { text: "Basic analytics dashboard" },
      { text: "Email scheduling" },
      { text: "Email support" },
    ],
  },
  {
    name: "Professional",
    description:
      "For growing teams that need higher volume, advanced automation, and LinkedIn outreach.",
    monthlyPrice: 350,
    yearlyPrice: 280,
    popular: true,
    cta: "Get started",
    features: [
      { text: "Unlimited sender emails", highlight: true },
      { text: "25,000 emails per month", highlight: true },
      { text: "Advanced email warmup with AI" },
      { text: "CSV & Excel import" },
      { text: "Campaign management" },
      { text: "Open, reply & click tracking" },
      { text: "Advanced analytics & reports" },
      { text: "LinkedIn outreach integration" },
      { text: "Webhook & N8N automation" },
      { text: "Smart scheduling & sequences" },
      { text: "Lead scoring & classification" },
      { text: "Priority support" },
    ],
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <AppLayout>
      <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Gradient orb top-right */}
          <motion.div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Gradient orb bottom-left */}
          <motion.div
            className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl dark:bg-primary/8"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            >
              Scale your outreach,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                not your costs
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground"
            >
              Choose the plan that fits your needs. Start with a 7-day free trial, upgrade anytime
              as your outreach grows.
            </motion.p>

            {/* Billing toggle */}
            <div className="mt-8">
              <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
            </div>
          </div>

          {/* Pricing cards */}
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {plans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} isYearly={isYearly} index={index} />
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>SSL encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Need a custom plan for your enterprise?{" "}
              <a
                href="mailto:contact@ialabtracker.com"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Contact us
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
