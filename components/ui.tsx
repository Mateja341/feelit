"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ============================== BUTTON ============================== */

export function Button({
  variant = "primary",
  className = "",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const styles = {
    primary:
      "bg-gold text-ink hover:bg-gold-bright hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.9)]",
    outline:
      "border border-gold/40 text-white hover:border-gold hover:text-gold-bright hover:shadow-[0_0_20px_-6px_rgba(168,85,247,0.7)]",
    ghost: "text-mist hover:text-white",
    danger:
      "border border-red-400/40 text-red-300 hover:border-red-400 hover:bg-red-400/10",
  } as const;
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ============================== FIELDS ============================== */

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-ink-deep/60 px-4 py-3 text-sm text-white placeholder:text-mist/50 outline-none transition-all focus:border-gold/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.15)] disabled:opacity-50";

export function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.25em] text-mist">
          {label}
          {required && <span className="text-gold-bright"> *</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
      {!error && hint && (
        <span className="mt-1 block text-[11px] text-mist/70">{hint}</span>
      )}
    </label>
  );
}

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${fieldBase} ${props.className ?? ""}`} />
);

export const Textarea = (
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) => (
  <textarea
    rows={3}
    {...props}
    className={`${fieldBase} resize-none ${props.className ?? ""}`}
  />
);

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${fieldBase} appearance-none bg-ink-deep pr-8 ${props.className ?? ""}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a1a5c4' stroke-width='1.5'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
      }}
    />
  );
}

export function Checkbox({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-mist">
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
          <input type="checkbox" className="peer sr-only" {...props} />
          <span className="absolute inset-0 rounded-md border border-white/20 bg-ink-deep/60 transition-all peer-checked:border-gold peer-checked:bg-gold/30 peer-checked:shadow-[0_0_12px_-2px_rgba(168,85,247,0.8)]" />
          <svg
            viewBox="0 0 12 12"
            className="absolute inset-0 m-auto h-3 w-3 text-gold-bright opacity-0 transition-opacity peer-checked:opacity-100"
          >
            <path
              d="M1.5 6.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>{label}</span>
      </label>
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </div>
  );
}

export function PasswordInput({
  strength,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { strength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={show ? "text" : "password"}
          className={`${fieldBase} pr-12 ${props.className ?? ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-mist transition-colors hover:text-gold-bright"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "◌" : "◉"}
        </button>
      </div>
      {strength !== undefined && (
        <div className="mt-2 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < strength ? "bg-gold" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== CARD / BADGE ============================== */

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`glass rounded-3xl p-6 ${className}`}>{children}</div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "purple" | "green" | "amber" | "red";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-white/15 text-mist",
    purple: "border-gold/50 text-gold-bright shadow-[0_0_12px_-4px_rgba(168,85,247,0.8)]",
    green: "border-emerald-400/50 text-emerald-300",
    amber: "border-amber-400/50 text-amber-300",
    red: "border-red-400/50 text-red-300",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function statusTone(s: string): "neutral" | "purple" | "green" | "amber" | "red" {
  switch (s) {
    case "VERIFIED":
    case "PUBLISHED":
    case "CONFIRMED":
    case "COMPLETED":
    case "READY":
    case "paid":
      return "green";
    case "PENDING":
    case "PENDING_REVIEW":
    case "PROCESSING":
    case "pending":
      return "amber";
    case "REJECTED":
    case "CANCELLED":
    case "DECLINED":
    case "failed":
      return "red";
    case "DRAFT":
    case "PAUSED":
    case "NOT_VERIFIED":
    case "NOT_GENERATED":
      return "neutral";
    default:
      return "purple";
  }
}

/* ============================== TABS ============================== */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-ink-deep/50 p-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all ${
            active === t.id
              ? "bg-gold/20 text-gold-bright shadow-[0_0_16px_-4px_rgba(168,85,247,0.8)]"
              : "text-mist hover:text-white"
          }`}
        >
          {t.label}
          {t.badge !== undefined && t.badge > 0 && (
            <span className="rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-ink">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ============================== STEPPER ============================== */

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  current: number;
  onStepClick?: (i: number) => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className={`h-1.5 rounded-full transition-all ${
                i <= current
                  ? "bg-gold shadow-[0_0_10px_-2px_rgba(168,85,247,0.9)]"
                  : "bg-white/10"
              } ${onStepClick && i <= current ? "cursor-pointer" : "cursor-default"}`}
              aria-label={s}
            />
            <span
              className={`hidden text-[9px] uppercase tracking-[0.18em] sm:block ${
                i <= current ? "text-gold-bright" : "text-mist/50"
              }`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== MODAL ============================== */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-deep/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`glass-strong max-h-[85vh] w-full overflow-y-auto rounded-3xl p-6 ${
              wide ? "max-w-3xl" : "max-w-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              {title && (
                <h3 className="font-display text-xl text-white">{title}</h3>
              )}
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-2 text-mist transition-colors hover:text-gold-bright"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================== EMPTY / SKELETON ============================== */

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-3xl border-dashed py-14 text-center">
      <span className="font-display text-2xl italic text-mist/60">{title}</span>
      {hint && <span className="max-w-sm text-xs text-mist/70">{hint}</span>}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/5 ${className}`}
      aria-hidden
    />
  );
}

/* ============================== TOAST ============================== */

type Toast = { id: number; kind: "ok" | "err" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(
  () => {},
);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[99] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`glass-strong pointer-events-auto rounded-2xl border px-4 py-3 text-sm ${
                t.kind === "ok"
                  ? "border-emerald-400/40 text-emerald-200"
                  : t.kind === "err"
                    ? "border-red-400/40 text-red-200"
                    : "border-gold/40 text-white"
              }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ============================== MISC ============================== */

export function ConfirmButton({
  confirmText = "Confirm?",
  onConfirm,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmText?: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      variant={armed ? "danger" : "outline"}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        if (!armed) setArmed(true);
        else onConfirm();
      }}
    >
      {armed ? confirmText : children}
    </Button>
  );
}
