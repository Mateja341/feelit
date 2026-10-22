"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Stepper, useToast } from "./ui";

type WizardCtx = {
  role: "guest" | "host";
  step: number;
  draft: Record<string, unknown>;
  save: (patch: Record<string, unknown>, nextStep?: number) => Promise<void>;
  goTo: (step: number) => void;
  submitting: boolean;
  submit: () => Promise<void>;
};
const Ctx = createContext<WizardCtx | null>(null);
export const useWizard = () => useContext(Ctx)!;

/**
 * Multi-step wizard shell: stepper, slide transitions, autosave each
 * step's data to /api/onboarding (draft persists in the DB → resume later).
 */
export function Wizard({
  role,
  steps,
  initialDraft,
  initialStep,
  donePath,
  children,
}: {
  role: "guest" | "host";
  steps: string[];
  initialDraft: Record<string, unknown>;
  initialStep: number;
  donePath: string;
  children: ReactNode;
}) {
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const toast = useToast();
  const router = useRouter();

  const save = useCallback(
    async (patch: Record<string, unknown>, nextStep?: number) => {
      const merged = { ...draftRef.current, ...patch };
      setDraft(merged);
      const target = nextStep ?? step;
      try {
        await fetch("/api/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, step: target, data: patch }),
        });
      } catch {
        toast("err", "Autosave failed — check your connection");
      }
      if (nextStep !== undefined) {
        setDir(nextStep > step ? 1 : -1);
        setStep(nextStep);
      }
    },
    [role, step, toast],
  );

  const goTo = useCallback(
    (s: number) => {
      setDir(s > step ? 1 : -1);
      setStep(s);
      fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, step: s, data: {} }),
      }).catch(() => {});
    },
    [role, step],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("err", data.error ?? "submit failed");
        setSubmitting(false);
        return;
      }
      toast("ok", "All set — welcome aboard");
      router.push(donePath);
    } catch {
      toast("err", "Network error");
      setSubmitting(false);
    }
  }, [role, donePath, router, toast]);

  return (
    <Ctx.Provider
      value={{ role, step, draft, save, goTo, submitting, submit }}
    >
      <div className="glass mx-auto w-full max-w-2xl rounded-3xl p-6 sm:p-8">
        <Stepper steps={steps} current={step} onStepClick={goTo} />
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 60 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * dir }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

/** Back / Next row with autosave on Next. `validate` may return an error string. */
export function WizardNav({
  onNext,
  nextLabel = "Continue",
  showBack = true,
  loading,
}: {
  onNext?: () => Promise<string | void> | string | void;
  nextLabel?: string;
  showBack?: boolean;
  loading?: boolean;
}) {
  const { step, goTo, submitting } = useWizard();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <div className="mt-8 flex items-center justify-between">
      {showBack && step > 0 ? (
        <Button variant="ghost" onClick={() => goTo(step - 1)}>
          ← Back
        </Button>
      ) : (
        <span />
      )}
      <Button
        loading={busy || loading || submitting}
        onClick={async () => {
          if (!onNext) return;
          setBusy(true);
          const result = await onNext();
          setBusy(false);
          if (typeof result === "string") toast("err", result);
        }}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
