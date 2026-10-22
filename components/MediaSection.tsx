"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button, Card, useToast } from "./ui";
import { uploadFile } from "@/lib/upload";

const VillaCanvas = dynamic(() => import("./VillaCanvas"), { ssr: false });

type Media = {
  id?: string;
  kind: "MODEL_3D" | "DRONE_VIDEO" | "WALK_VIDEO";
  url: string | null;
  status: "NOT_GENERATED" | "PROCESSING" | "READY";
};

const LABELS: Record<Media["kind"], string> = {
  MODEL_3D: "3D model",
  DRONE_VIDEO: "Drone video",
  WALK_VIDEO: "Walk-through",
};

/**
 * 3D / drone / walk-through media cards. Status-driven: NOT_GENERATED →
 * placeholder, PROCESSING → spinner (polls for READY), READY → viewer/player.
 * Hosts (canManage) can upload/replace/delete each kind.
 */
export default function MediaSection({
  propertyId,
  media,
  canManage,
}: {
  propertyId: string;
  media: Media[];
  canManage: boolean;
}) {
  const [items, setItems] = useState<Media[]>(
    ["MODEL_3D", "DRONE_VIDEO", "WALK_VIDEO"].map(
      (k) =>
        media.find((m) => m.kind === k) ?? {
          kind: k as Media["kind"],
          url: null,
          status: "NOT_GENERATED" as const,
        },
    ),
  );
  const toast = useToast();
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll while anything is PROCESSING
  useEffect(() => {
    if (!items.some((m) => m.status === "PROCESSING")) return;
    poll.current = setInterval(async () => {
      const res = await fetch(`/api/properties/${propertyId}/media`);
      const d = await res.json();
      if (d.media) {
        setItems((prev) =>
          prev.map((m) => d.media.find((x: Media) => x.kind === m.kind) ?? m),
        );
      }
    }, 5000);
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [items, propertyId]);

  const setMedia = async (
    kind: Media["kind"],
    payload: { url?: string; generate?: boolean; delete?: boolean },
  ) => {
    const res = await fetch(`/api/properties/${propertyId}/media`, {
      method: payload.delete ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...payload }),
    });
    const d = await res.json();
    if (!res.ok) return toast("err", d.error ?? "failed");
    setItems((s) =>
      s.map((m) => (m.kind === kind ? { ...m, ...d.media } : m)),
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((m) => (
        <Card key={m.kind} className="overflow-hidden !p-0">
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mist">
              {LABELS[m.kind]}
            </span>
            <Badge
              tone={
                m.status === "READY"
                  ? "green"
                  : m.status === "PROCESSING"
                    ? "amber"
                    : "neutral"
              }
            >
              {m.status}
            </Badge>
          </div>
          <div className="mt-3 aspect-video w-full bg-ink-deep/60">
            {m.status === "READY" && m.kind === "MODEL_3D" ? (
              <VillaCanvas accent="#a855f7" model="estate" interactive />
            ) : m.status === "READY" && m.url ? (
              <video
                src={m.url}
                controls
                className="h-full w-full object-cover"
                playsInline
              />
            ) : m.status === "PROCESSING" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                <span className="text-xs text-mist">Generating…</span>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-mist/50">
                Not generated yet
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-2 px-5 py-3">
              <label className="cursor-pointer text-xs text-gold-bright hover:underline">
                {m.status === "READY" ? "Replace" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  accept={m.kind === "MODEL_3D" ? ".glb,.gltf" : "video/*"}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const { public_url } = await uploadFile(
                        "property-media",
                        f,
                      );
                      await setMedia(m.kind, { url: public_url });
                      toast("ok", `${LABELS[m.kind]} uploaded`);
                    } catch {
                      toast("err", "Upload failed");
                    }
                  }}
                />
              </label>
              {m.status !== "READY" && (
                <button
                  className="text-xs text-mist hover:text-gold-bright"
                  onClick={() => setMedia(m.kind, { generate: true })}
                >
                  Generate
                </button>
              )}
              {m.status === "READY" && (
                <button
                  className="ml-auto text-xs text-mist hover:text-red-300"
                  onClick={() => setMedia(m.kind, { delete: true })}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
