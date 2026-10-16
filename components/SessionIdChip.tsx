"use client";

import { useSearchParams } from "next/navigation";

export default function SessionIdChip() {
  const sessionId = useSearchParams().get("session_id");
  if (!sessionId) return null;
  return (
    <p className="glass mt-8 rounded-xl px-4 py-2 font-mono text-[11px] text-mist">
      session: {sessionId}
    </p>
  );
}
