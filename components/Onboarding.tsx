"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { KeyIcon, HouseIcon } from "./icons";
import CustomerSignup from "./CustomerSignup";
import OwnerOnboarding from "./OwnerOnboarding";

type Step = "role" | "customer" | "owner";

const slideVariants = {
  enter: { x: "60%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-45%", opacity: 0 },
};

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="aurora left-1/2 top-[-20%] h-[60vh] w-[70vw] -translate-x-1/2"
        style={{ background: "#2d1552" }}
      />
      <div
        className="aurora bottom-[-30%] left-[-10%] h-[50vh] w-[40vw]"
        style={{ background: "#1a0f35" }}
      />
      <div
        className="aurora bottom-[-20%] right-[-15%] h-[55vh] w-[45vw]"
        style={{ background: "#2d1552" }}
      />
    </div>
  );
}

function RoleCard({
  label,
  sub,
  icon,
  onSelect,
  delay,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  onSelect: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="glass group relative flex w-72 cursor-pointer flex-col items-center gap-6 rounded-3xl px-10 py-14 transition-shadow duration-500 hover:shadow-[0_0_80px_-10px_rgba(110,58,255,0.55)]"
      style={{ borderColor: "rgba(168,85,247,0.25)" }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 0 1px rgba(168,85,247,0.55)" }}
      />
      <span className="text-gold-bright transition-all duration-500 group-hover:-translate-y-1.5 group-hover:text-white">
        {icon}
      </span>
      <span className="text-xl font-semibold tracking-[0.35em] text-white">
        {label}
      </span>
      <span className="text-xs tracking-[0.15em] text-mist opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        {sub}
      </span>
    </motion.button>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState<Step>("role");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink">
      <Backdrop />
      <div className="relative z-10 w-full max-w-4xl px-6">
        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              variants={slideVariants}
              initial="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-3 text-[11px] uppercase tracking-[0.5em] text-gold-bright"
              >
                Feel it.
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display mb-14 text-center text-4xl text-white md:text-5xl"
              >
                Choose your <span className="gold-text italic">journey</span>
              </motion.h1>

              <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
                <RoleCard
                  label="CUSTOMER"
                  sub="BROWSE & EXPERIENCE VILLAS"
                  icon={<KeyIcon className="h-14 w-14" />}
                  delay={0.15}
                  onSelect={() => setStep("customer")}
                />
                <RoleCard
                  label="OWNER"
                  sub="LIST & SHOWCASE PROPERTY"
                  icon={<HouseIcon className="h-14 w-14" />}
                  delay={0.25}
                  onSelect={() => setStep("owner")}
                />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-14 text-sm text-mist"
              >
                Already have an account?{" "}
                <Link
                  href="/auth"
                  className="text-white underline decoration-gold/60 underline-offset-4 transition-colors hover:decoration-gold-bright hover:text-gold-bright"
                >
                  Log in
                </Link>
              </motion.p>
            </motion.div>
          )}

          {step === "customer" && (
            <motion.div
              key="customer"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <CustomerSignup onBack={() => setStep("role")} />
            </motion.div>
          )}

          {step === "owner" && (
            <motion.div
              key="owner"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <OwnerOnboarding onBack={() => setStep("role")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
