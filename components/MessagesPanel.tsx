"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Empty, Input, Skeleton, useToast } from "./ui";

/** Guest↔host messaging: conversation list + thread with send. */
export default function MessagesPanel() {
  const [convos, setConvos] = useState<any[] | null>(null);
  const [active, setActive] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const toast = useToast();
  const bottom = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(
    () =>
      fetch("/api/messages")
        .then((r) => r.json())
        .then((d) => setConvos(d.conversations ?? [])),
    [],
  );
  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  const open = async (c: any) => {
    setActive(c);
    const res = await fetch(`/api/messages?conversation=${c.id}`);
    const d = await res.json();
    setMsgs(d.messages ?? []);
    setTimeout(() => bottom.current?.scrollIntoView(), 50);
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: active.id, text }),
    });
    if (res.ok) {
      const d = await res.json();
      setMsgs((s) => [...s, d.message]);
      setText("");
      setTimeout(() => bottom.current?.scrollIntoView(), 50);
    } else toast("err", "Failed to send");
  };

  if (!convos) return <Skeleton className="h-80" />;

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        {convos.map((c) => (
          <button
            key={c.id}
            onClick={() => open(c)}
            className={`glass w-full rounded-2xl p-4 text-left transition-all ${
              active?.id === c.id ? "border-gold" : "hover:border-gold/40"
            }`}
          >
            <p className="truncate text-sm font-semibold text-white">
              {c.other_name ?? "Conversation"}
            </p>
            <p className="mt-1 truncate text-xs text-mist">
              {c.last_message ?? "No messages yet"}
            </p>
          </button>
        ))}
        {!convos.length && (
          <Empty title="No conversations" hint="Message a host from a villa page." />
        )}
      </div>
      <div className="glass flex min-h-[24rem] flex-col rounded-2xl p-4">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-mist/50">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto pb-3">
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.mine
                      ? "ml-auto bg-gold/25 text-white"
                      : "bg-white/8 text-slate-200"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-3">
              <Input
                value={text}
                placeholder="Write a message…"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button onClick={send}>Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
