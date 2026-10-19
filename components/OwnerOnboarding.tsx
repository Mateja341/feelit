"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LinkIcon,
  CloudUploadIcon,
  CheckIcon,
  CloseIcon,
} from "./icons";

type Stage = "link-check" | "upload";

const URL_RE = /^https?:\/\/[\w.-]+\.[a-z]{2,}([/?#].*)?$/i;

function LinkCheck({ onManual }: { onManual: () => void }) {
  const router = useRouter();
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [link, setLink] = useState("");
  const linkValid = URL_RE.test(link.trim());

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLink(text.trim());
    } catch {
      /* clipboard permission denied — user can type/paste manually */
    }
  }

  const choiceBtn = (v: "yes" | "no", label: string) => (
    <motion.button
      key={v}
      type="button"
      onClick={() => setChoice(v)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`glass w-40 rounded-2xl py-4 text-sm font-semibold tracking-[0.25em] transition-all ${
        choice === v
          ? "border-gold/70 text-white shadow-[0_0_36px_-6px_rgba(168,85,247,0.7)]"
          : "text-mist hover:text-white"
      }`}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-xl flex-col items-center text-center"
    >
      <p className="mb-3 text-[11px] uppercase tracking-[0.5em] text-gold-bright">
        Owner onboarding
      </p>
      <h2 className="font-display mb-10 text-3xl leading-snug text-white md:text-4xl">
        Do you have your property on{" "}
        <span className="gold-text italic">any other site?</span>
      </h2>

      <div className="flex gap-5">
        {choiceBtn("yes", "YES")}
        {choiceBtn("no", "NO")}
      </div>

      <AnimatePresence mode="wait">
        {choice === "yes" && (
          <motion.div
            key="link-input"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 w-full overflow-hidden"
          >
            <div
              className={`glass flex items-center rounded-2xl transition-all ${
                linkValid
                  ? "border-emerald-400/60 shadow-[0_0_28px_-8px_rgba(52,211,153,0.6)]"
                  : ""
              }`}
            >
              <LinkIcon className="ml-4 h-4 w-4 shrink-0 text-mist" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste link here…"
                className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-mist/60"
              />
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="mr-2 shrink-0 rounded-lg border border-gold/40 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-gold-bright transition-colors hover:bg-gold/20"
              >
                PASTE
              </button>
            </div>
            <AnimatePresence>
              {linkValid && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => router.push("/host")}
                  className="mt-5 w-full rounded-xl bg-gold py-3.5 text-sm font-semibold tracking-widest text-ink transition-all hover:bg-gold-bright hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.9)]"
                >
                  IMPORT LISTING →
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {choice === "no" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 w-full overflow-hidden"
          >
            <button
              onClick={onManual}
              className="w-full rounded-xl bg-gold py-3.5 text-sm font-semibold tracking-widest text-ink transition-all hover:bg-gold-bright hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.9)]"
            >
              CONTINUE TO MANUAL LISTING →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhotoUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [roomsChecked, setRoomsChecked] = useState(false);
  const [outsideChecked, setOutsideChecked] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const next = [...prev, ...imgs];
      if (next.length >= 4) setRoomsChecked(true);
      return next;
    });
  };

  const ready = files.length > 0 && roomsChecked && outsideChecked;

  const checklist = (
    label: string,
    checked: boolean,
    toggle: () => void
  ) => (
    <button
      type="button"
      onClick={toggle}
      className="flex cursor-pointer items-center gap-3 text-left text-sm text-mist transition-colors hover:text-white"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
          checked
            ? "border-gold bg-gold text-ink shadow-[0_0_14px_-2px_rgba(168,85,247,0.8)]"
            : "border-white/20 bg-white/[0.04]"
        }`}
      >
        {checked && <CheckIcon className="h-3.5 w-3.5" />}
      </span>
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl"
    >
      <h2 className="font-display mb-2 text-center text-3xl text-white md:text-4xl">
        Place pictures of your property{" "}
        <span className="gold-text italic">in the rectangle below</span>
      </h2>
      <div className="relative mb-8 flex items-center justify-center gap-2 text-sm text-mist">
        Make sure pictures are high quality
        <button
          type="button"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onClick={() => setShowTip((s) => !s)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/50 text-[11px] text-gold-bright transition-colors hover:bg-gold/20"
          aria-label="Photo tips"
        >
          ?
        </button>
        <AnimatePresence>
          {showTip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="glass-strong absolute top-8 z-20 w-80 rounded-2xl p-4 text-left text-xs leading-relaxed text-mist"
            >
              For best results and AI 3D rendering, upload high-resolution
              photos that clearly show every area of the house, both interior
              and exterior.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 transition-all ${
          dragging
            ? "border-gold bg-gold/10 shadow-[0_0_50px_-8px_rgba(168,85,247,0.8)]"
            : "border-gold/40 hover:border-gold/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <CloudUploadIcon className="h-10 w-10 text-gold-bright" />
        <p className="text-sm text-mist">
          Drag & drop photos here, or{" "}
          <span className="text-gold-bright underline underline-offset-4">
            browse files
          </span>
        </p>

        {files.length > 0 && (
          <div className="mt-2 grid w-full grid-cols-4 gap-3 sm:grid-cols-6">
            {files.map((f, i) => (
              <div
                key={i}
                className="group/thumb relative aspect-square overflow-hidden rounded-xl border border-white/10"
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiles((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {checklist("Photo of every room", roomsChecked, () =>
          setRoomsChecked((c) => !c)
        )}
        {checklist("Outside photos", outsideChecked, () =>
          setOutsideChecked((c) => !c)
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          disabled={!ready}
          onClick={() => router.push("/host")}
          className="rounded-xl bg-gold px-8 py-3.5 text-sm font-semibold tracking-widest text-ink transition-all hover:bg-gold-bright hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          CONTINUE →
        </button>
      </div>
    </motion.div>
  );
}

export default function OwnerOnboarding({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>("link-check");
  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 text-xs uppercase tracking-[0.25em] text-mist transition-colors hover:text-white"
      >
        ← Back
      </button>
      <AnimatePresence mode="wait">
        {stage === "link-check" ? (
          <motion.div
            key="link"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
          >
            <LinkCheck onManual={() => setStage("upload")} />
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhotoUpload />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
