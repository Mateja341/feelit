"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  statusTone,
  useToast,
} from "./ui";
import { uploadFile } from "@/lib/upload";
import { priceFmt } from "@/lib/format";
import MediaSection from "./MediaSection";
import MessagesPanel from "./MessagesPanel";
import AddCardModal from "./AddCardModal";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal" },
  { id: "identity", label: "Identity" },
  { id: "payment", label: "Payment" },
  { id: "bookings", label: "Bookings" },
  { id: "favorites", label: "Favorites" },
  { id: "photos", label: "My photos" },
  { id: "media", label: "Villa media" },
  { id: "messages", label: "Messages" },
  { id: "reviews", label: "Reviews" },
  { id: "settings", label: "Settings" },
];

export default function ProfileTabs() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? "overview");
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  const toast = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.status === 401) {
      router.push("/auth?next=/profile");
      return;
    }
    setData(await res.json());
  }, [router]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  const p = data.profile ?? {};
  const tabs = TABS.map((t) => ({
    ...t,
    badge:
      t.id === "favorites"
        ? data.favorites.length
        : t.id === "bookings"
          ? undefined
          : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
            {p.roles?.includes("HOST") ? "Guest & host" : "Guest"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">
            {p.first_name ? `${p.first_name} ${p.last_name ?? ""}` : "Your profile"}
          </h1>
        </div>
        {!p.guest_onboarded && (
          <Link href="/onboarding/guest">
            <Button>Finish onboarding →</Button>
          </Link>
        )}
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "overview" && <Overview data={data} go={setTab} />}
      {tab === "personal" && <Personal p={p} reload={load} />}
      {tab === "identity" && <Identity docs={data.documents} reload={load} />}
      {tab === "payment" && <Payment pms={data.payment_methods} reload={load} />}
      {tab === "bookings" && <Bookings reload={load} />}
      {tab === "favorites" && <Favorites favs={data.favorites} reload={load} />}
      {tab === "photos" && <Photos photos={data.photos} reload={load} />}
      {tab === "media" && <GuestMedia />}
      {tab === "messages" && <MessagesPanel />}
      {tab === "reviews" && <MyReviews />}
      {tab === "settings" && <Settings p={p} reload={load} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ data, go }: { data: any; go: (t: string) => void }) {
  const p = data.profile ?? {};
  const done = [
    p.first_name,
    p.date_of_birth,
    data.documents.length,
    data.addresses.length,
    data.payment_methods.length,
  ].filter(Boolean).length;
  const pct = Math.round((done / 5) * 100);
  const [next, setNext] = useState<any>(null);
  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) =>
        setNext(
          (d.bookings ?? []).find(
            (b: any) =>
              ["CONFIRMED", "PENDING"].includes(b.status) &&
              b.check_out >= new Date().toISOString().slice(0, 10),
          ),
        ),
      );
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
          Profile completion
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gold shadow-[0_0_12px_rgba(168,85,247,0.7)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-mist">{pct}% complete</p>
        {pct < 100 && (
          <Button className="mt-4" variant="outline" onClick={() => go("personal")}>
            Complete profile
          </Button>
        )}
      </Card>
      <Card>
        <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
          Next trip
        </p>
        {next ? (
          <div className="mt-3">
            <p className="font-display text-xl text-white">
              {next.properties?.title}
            </p>
            <p className="mt-1 text-xs text-mist">
              {next.check_in} → {next.check_out} · {next.nights} nights
            </p>
            <Badge tone={statusTone(next.status)}>{next.status}</Badge>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-mist">No upcoming trips yet.</p>
            <Link href="/search">
              <Button className="mt-4">Browse villas →</Button>
            </Link>
          </div>
        )}
      </Card>
      <Card className="md:col-span-2">
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Notifications
        </p>
        {data.notifications.slice(0, 5).map((n: any) => (
          <div
            key={n.id}
            className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0"
          >
            <span className="text-white">{n.title}</span>
            <span className="text-xs text-mist">
              {new Date(n.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
        {!data.notifications.length && (
          <p className="text-sm text-mist">Nothing yet.</p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Personal ---------------- */

const PERSONAL_FIELDS: [string, string, string?][] = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["parent_name", "Parent's name"],
  ["date_of_birth", "Date of birth", "date"],
  ["gender", "Gender"],
  ["nationality", "Nationality"],
  ["country_of_residence", "Country of residence"],
  ["occupation", "Occupation"],
  ["phone", "Phone"],
  ["travel_purpose", "Travel purpose"],
  ["arrival_method", "Arrival method"],
  ["allergies_diet", "Allergies / diet"],
];

function Personal({ p, reload }: { p: any; reload: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      PERSONAL_FIELDS.map(([k]) => [k, p[k] ?? ""]),
    ),
  );
  const save = async (key: string) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: f[key] || null }),
    });
    toast(res.ok ? "ok" : "err", res.ok ? "Saved" : "Save failed");
    if (res.ok) reload();
  };
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {PERSONAL_FIELDS.map(([k, label, type]) => (
          <Field key={k} label={label}>
            <div className="flex gap-2">
              <Input
                type={type ?? "text"}
                value={f[k]}
                onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))}
                onBlur={() => f[k] !== (p[k] ?? "") && save(k)}
              />
            </div>
          </Field>
        ))}
        <Field label="Preferred currency">
          <Select
            value={f.preferred_currency ?? "USD"}
            onChange={async (e) => {
              setF((s) => ({ ...s, preferred_currency: e.target.value }));
              await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferred_currency: e.target.value }),
              });
              toast("ok", "Saved");
            }}
          >
            <option>USD</option>
            <option>EUR</option>
            <option>RSD</option>
            <option>GBP</option>
          </Select>
        </Field>
        <Field label="Pets">
          <Checkbox
            label="Travelling with pets"
            checked={!!p.pets}
            onChange={async (e) => {
              await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pets: e.target.checked }),
              });
              toast("ok", "Saved");
              reload();
            }}
          />
        </Field>
      </div>
    </Card>
  );
}

/* ---------------- Identity ---------------- */

function Identity({ docs, reload }: { docs: any[]; reload: () => void }) {
  const toast = useToast();
  const [revealId, setRevealId] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [revealed, setRevealed] = useState("");
  return (
    <div className="space-y-4">
      {docs.map((d) => (
        <Card key={d.id} className="flex flex-wrap items-center gap-4">
          <div className="min-w-40">
            <p className="text-sm font-semibold uppercase tracking-widest text-white">
              {d.doc_type.replace("_", " ")}
            </p>
            <p className="mt-1 font-mono text-sm text-mist">{d.number_masked}</p>
          </div>
          <div className="text-xs text-mist">
            {d.issuing_country}
            {d.expiry_date && ` · expires ${d.expiry_date}`}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge tone={statusTone(d.status)}>{d.status}</Badge>
            <Button variant="outline" onClick={() => setRevealId(d.id)}>
              Reveal
            </Button>
          </div>
          {d.reject_reason && (
            <p className="w-full text-xs text-red-300">
              Rejected: {d.reject_reason}
            </p>
          )}
        </Card>
      ))}
      {!docs.length && (
        <Empty
          title="No documents yet"
          hint="Complete guest onboarding to add your identity document."
          action={
            <Link href="/onboarding/guest">
              <Button>Open onboarding →</Button>
            </Link>
          }
        />
      )}
      <Modal open={!!revealId} onClose={() => setRevealId(null)} title="Reveal document number">
        <p className="mb-4 text-sm text-mist">
          Re-enter your password to view the full number.
        </p>
        <Field label="Password">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </Field>
        {revealed && (
          <p className="mt-4 font-mono text-lg text-gold-bright">{revealed}</p>
        )}
        <Button
          className="mt-4"
          onClick={async () => {
            const res = await fetch("/api/identity/reveal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: revealId, password: pw }),
            });
            const d = await res.json();
            if (res.ok) setRevealed(d.number);
            else toast("err", d.error ?? "failed");
          }}
        >
          Reveal
        </Button>
      </Modal>
    </div>
  );
}

/* ---------------- Payment ---------------- */

function Payment({ pms, reload }: { pms: any[]; reload: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>+ Add card</Button>
      </div>
      {pms.map((m) => (
        <Card key={m.id} className="flex items-center gap-4">
          <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-gold/30 bg-ink-deep font-mono text-xs text-gold-bright">
            {m.brand ?? "CARD"}
          </div>
          <div>
            <p className="font-mono text-sm text-white">•••• {m.last4}</p>
            <p className="text-xs text-mist">
              expires {m.exp_month}/{m.exp_year}
            </p>
          </div>
          {m.is_default && <Badge tone="purple">Default</Badge>}
          <div className="ml-auto flex gap-2">
            {!m.is_default && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await fetch("/api/payment-methods", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: m.id, is_default: true }),
                  });
                  reload();
                }}
              >
                Make default
              </Button>
            )}
            <ConfirmButton
              onConfirm={async () => {
                await fetch(`/api/payment-methods?id=${m.id}`, {
                  method: "DELETE",
                });
                toast("ok", "Card removed");
                reload();
              }}
            >
              Remove
            </ConfirmButton>
          </div>
        </Card>
      ))}
      {!pms.length && (
        <Empty
          title="No cards yet"
          hint="Add a card to book instantly. We never see your card number."
        />
      )}
      <AddCardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={reload}
      />
    </div>
  );
}

/* ---------------- Bookings ---------------- */

function Bookings({ reload }: { reload: () => void }) {
  const [bookings, setBookings] = useState<any[] | null>(null);
  const toast = useToast();
  const load = useCallback(
    () =>
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((d) => setBookings(d.bookings ?? [])),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  if (!bookings) return <Skeleton className="h-64" />;
  const now = new Date().toISOString().slice(0, 10);
  const groups = {
    Upcoming: bookings.filter(
      (b) => ["CONFIRMED", "PENDING"].includes(b.status) && b.check_out >= now,
    ),
    Past: bookings.filter(
      (b) => b.status === "COMPLETED" || (b.check_out < now && b.status === "CONFIRMED"),
    ),
    Cancelled: bookings.filter((b) =>
      ["CANCELLED", "DECLINED"].includes(b.status),
    ),
  };
  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([name, list]) => (
        <div key={name}>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-mist">
            {name}
          </p>
          {!list.length && <p className="text-sm text-mist/60">None.</p>}
          <div className="space-y-3">
            {list.map((b) => (
              <Card key={b.id} className="flex flex-wrap items-center gap-4">
                <div className="min-w-48">
                  <p className="font-display text-lg text-white">
                    {b.properties?.title}
                  </p>
                  <p className="text-xs text-mist">
                    {b.check_in} → {b.check_out} · {b.guests_count} guests
                  </p>
                </div>
                <div className="text-sm text-gold-bright">
                  {priceFmt.format(Number(b.total))}
                </div>
                <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                <div className="ml-auto flex gap-2">
                  {["CONFIRMED", "PENDING"].includes(b.status) &&
                    b.check_in > now && (
                      <ConfirmButton
                        confirmText="Cancel booking?"
                        onConfirm={async () => {
                          const res = await fetch(`/api/bookings/${b.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "cancel" }),
                          });
                          const d = await res.json();
                          toast(
                            res.ok ? "ok" : "err",
                            res.ok
                              ? `Cancelled — refund ${priceFmt.format(d.refund ?? 0)}`
                              : d.error,
                          );
                          load();
                        }}
                      >
                        Cancel
                      </ConfirmButton>
                    )}
                  {b.status === "COMPLETED" && (
                    <Link href={`/villas/${b.property_id}`}>
                      <Button variant="outline">Review stay</Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Favorites ---------------- */

function Favorites({ favs, reload }: { favs: any[]; reload: () => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {favs.map((f) => {
        const p = f.properties;
        const img = p?.property_photos?.find((x: any) => x.is_cover)?.url ??
          p?.property_photos?.[0]?.url;
        return (
          <Card key={f.property_id} className="flex gap-4">
            {img ? (
              <img src={img} className="h-24 w-32 rounded-xl object-cover" />
            ) : (
              <div
                className="flex h-24 w-32 items-center justify-center rounded-xl font-display text-3xl italic text-white/20"
                style={{ background: `${p?.accent ?? "#a855f7"}22` }}
              >
                {p?.title?.[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-white">
                {p?.title}
              </p>
              <p className="text-xs text-mist">
                {[p?.city, p?.country].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-sm text-gold-bright">
                {priceFmt.format(Number(p?.nightly_price ?? 0))} / night
              </p>
            </div>
            <Link href={`/villas/${f.property_id}`}>
              <Button variant="outline">View →</Button>
            </Link>
          </Card>
        );
      })}
      {!favs.length && (
        <Empty
          title="No favorites yet"
          hint="Tap the heart on any villa to save it here."
          action={
            <Link href="/search">
              <Button>Browse villas →</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

/* ---------------- Photos ---------------- */

function Photos({ photos, reload }: { photos: any[]; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<any>(null);
  const [caption, setCaption] = useState("");
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label
        className="mb-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gold/40 bg-ink-deep/30 px-6 py-12 text-sm text-mist transition-all hover:border-gold hover:text-white"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files);
          await upload(files);
        }}
      >
        {busy ? "Uploading…" : "Drop photos here or click to browse"}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            await upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {photos.map((ph) => (
          <div key={ph.id} className="group relative">
            <img
              src={ph.url}
              alt={ph.caption ?? ""}
              className="aspect-square w-full cursor-zoom-in rounded-2xl object-cover"
              onClick={() => {
                setLightbox(ph);
                setCaption(ph.caption ?? "");
              }}
            />
            <button
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={async () => {
                await fetch(`/api/photos?id=${ph.id}`, { method: "DELETE" });
                reload();
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {!photos.length && (
        <Empty title="No photos yet" hint="Upload travel photos — they persist to your account." />
      )}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} wide>
        {lightbox && (
          <div>
            <img src={lightbox.url} className="w-full rounded-2xl" />
            <Field label="Caption">
              <div className="mt-3 flex gap-2">
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    await fetch("/api/photos", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: lightbox.id, caption }),
                    });
                    toast("ok", "Saved");
                    setLightbox(null);
                    reload();
                  }}
                >
                  Save
                </Button>
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );

  async function upload(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const { public_url } = await uploadFile("user-photos", f);
        await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: public_url }),
        });
      }
      toast("ok", `${files.length} photo(s) uploaded`);
      reload();
    } catch {
      toast("err", "Upload failed");
    }
    setBusy(false);
  }
}

/* ---------------- Guest media ---------------- */

function GuestMedia() {
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then(async (d) => {
        const props = [
          ...new Set(
            (d.bookings ?? []).map((b: any) => b.property_id as string),
          ),
        ];
        const media = await Promise.all(
          props.map(async (id) => ({
            id,
            title:
              (d.bookings ?? []).find((b: any) => b.property_id === id)
                ?.properties?.title ?? id,
            media: (await fetch(`/api/properties/${id}/media`).then((r) =>
              r.json(),
            )).media,
          })),
        );
        setList(media);
      });
  }, []);
  if (!list) return <Skeleton className="h-64" />;
  if (!list.length)
    return (
      <Empty
        title="No stays yet"
        hint="Media for villas you book shows up here."
      />
    );
  return (
    <div className="space-y-8">
      {list.map((p) => (
        <div key={p.id}>
          <p className="mb-3 font-display text-xl text-white">{p.title}</p>
          <MediaSection propertyId={p.id} media={p.media} canManage={false} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Reviews ---------------- */

function MyReviews() {
  const [reviews, setReviews] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/reviews?mine=1")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []));
  }, []);
  if (!reviews) return <Skeleton className="h-64" />;
  if (!reviews.length)
    return <Empty title="No reviews yet" hint="Review a property after your stay." />;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center gap-3">
            <Badge tone="purple">{"★".repeat(r.rating)}</Badge>
            <span className="text-xs text-mist">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-sm text-white">{r.text}</p>
          {r.reply && (
            <p className="mt-2 rounded-xl bg-white/5 p-3 text-xs text-mist">
              Host reply: {r.reply}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function Settings({ p, reload }: { p: any; reload: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [delOpen, setDelOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Notifications
        </p>
        <div className="space-y-3">
          <Checkbox
            label="Email notifications"
            checked={!!p.notify_email}
            onChange={async (e) => {
              await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notify_email: e.target.checked }),
              });
              toast("ok", "Saved");
              reload();
            }}
          />
          <Checkbox
            label="In-app notifications"
            checked={!!p.notify_inapp}
            onChange={async (e) => {
              await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notify_inapp: e.target.checked }),
              });
              toast("ok", "Saved");
              reload();
            }}
          />
        </div>
      </Card>
      <Card>
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Your data (GDPR)
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/account");
              const blob = await res.blob();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "feelit-data.json";
              a.click();
            }}
          >
            Download my data
          </Button>
          <Button variant="danger" onClick={() => setDelOpen(true)}>
            Delete my account
          </Button>
        </div>
      </Card>
      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Delete account">
        <p className="mb-4 text-sm text-mist">
          This permanently deletes your account and all data. Active bookings
          must be cancelled first. Re-enter your password to confirm.
        </p>
        <Field label="Password">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </Field>
        <Button
          variant="danger"
          className="mt-4"
          onClick={async () => {
            const res = await fetch("/api/account", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: pw }),
            });
            const d = await res.json();
            if (res.ok) {
              toast("ok", "Account deleted");
              router.push("/");
            } else toast("err", d.error ?? "failed");
          }}
        >
          Delete permanently
        </Button>
      </Modal>
    </div>
  );
}
