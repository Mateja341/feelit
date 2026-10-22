"use client";

import { useCallback, useEffect, useState } from "react";
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
import ListingWizard from "./ListingWizard";
import PropertyCalendar from "./PropertyCalendar";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "properties", label: "Properties" },
  { id: "calendar", label: "Calendar" },
  { id: "reservations", label: "Reservations" },
  { id: "earnings", label: "Earnings" },
  { id: "media", label: "Media" },
  { id: "messages", label: "Messages" },
  { id: "settings", label: "Settings" },
];

export default function HostDashboard() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? "overview");
  const [profile, setProfile] = useState<any>(null);
  const [props_, setProps] = useState<any[] | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/properties?mine=1");
    if (res.status === 401) {
      router.push("/auth?next=/host");
      return;
    }
    const d = await res.json();
    setProfile(d.profile);
    setProps(d.properties ?? []);
  }, [router]);
  useEffect(() => {
    load();
  }, [load]);

  if (!profile || !props_) return <Skeleton className="h-80" />;

  const hp = profile.host_profiles?.[0] ?? profile.host_profiles;
  const verified = hp?.verification_status === "VERIFIED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
            Host dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">
            {hp?.display_name ?? "Your properties"}
          </h1>
        </div>
        <Badge tone={statusTone(hp?.verification_status)}>
          {hp?.verification_status ?? "NOT_VERIFIED"}
        </Badge>
      </div>
      {!verified && (
        <Card className="!border-gold/50">
          <p className="text-sm text-gold-bright">
            {hp?.verification_status === "REJECTED"
              ? `Verification rejected${hp.rejection_reason ? `: ${hp.rejection_reason}` : ""}. Update your documents in Settings.`
              : "Your host verification is pending — you can draft listings now and publish once verified."}
          </p>
        </Card>
      )}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === "overview" && <Overview props_={props_} />}
      {tab === "properties" && (
        <Properties props_={props_} reload={load} verified={verified} />
      )}
      {tab === "calendar" && <Calendar props_={props_} />}
      {tab === "reservations" && <Reservations />}
      {tab === "earnings" && <Earnings />}
      {tab === "media" && <Media props_={props_} />}
      {tab === "messages" && <MessagesPanel />}
      {tab === "settings" && <HostSettings profile={profile} reload={load} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ props_ }: { props_: any[] }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/host/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);
  const tile = (label: string, value: string | number) => (
    <Card>
      <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold-bright">{value}</p>
    </Card>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {tile("Earnings this month", priceFmt.format(stats?.earnings_month ?? 0))}
        {tile("Upcoming check-ins", stats?.upcoming_checkins ?? "…")}
        {tile("Pending requests", stats?.pending_requests ?? "…")}
        {tile("Occupancy", `${stats?.occupancy_pct ?? 0}%`)}
      </div>
      <Card>
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Your properties
        </p>
        {props_.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0"
          >
            <span className="text-white">{p.title}</span>
            <Badge tone={statusTone(p.status)}>{p.status}</Badge>
          </div>
        ))}
        {!props_.length && <p className="text-sm text-mist">No listings yet.</p>}
      </Card>
    </div>
  );
}

/* ---------------- Properties ---------------- */

function Properties({
  props_,
  reload,
  verified,
}: {
  props_: any[];
  reload: () => void;
  verified: boolean;
}) {
  const [wizard, setWizard] = useState<null | { id?: string }>(null);
  const toast = useToast();
  if (wizard)
    return (
      <ListingWizard
        propertyId={wizard.id}
        onDone={() => {
          setWizard(null);
          reload();
        }}
      />
    );
  const act = async (id: string, action: string) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    toast(res.ok ? "ok" : "err", res.ok ? `${action} done` : d.error);
    reload();
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={async () => {
          const res = await fetch("/api/properties", { method: "POST" });
          const d = await res.json();
          if (res.ok) setWizard({ id: d.property.id });
          else toast("err", d.error);
        }}>
          + Add property
        </Button>
      </div>
      {props_.map((p) => (
        <Card key={p.id} className="flex flex-wrap items-center gap-4">
          <div className="min-w-52">
            <p className="font-display text-lg text-white">{p.title}</p>
            <p className="text-xs text-mist">
              {[p.city, p.country].filter(Boolean).join(", ")} ·{" "}
              {priceFmt.format(Number(p.nightly_price))}/night
            </p>
          </div>
          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setWizard({ id: p.id })}>
              Edit
            </Button>
            {p.status === "DRAFT" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => act(p.id, "submit_review")}
                >
                  Submit for review
                </Button>
                <Button onClick={() => act(p.id, "publish")}>Publish</Button>
              </>
            )}
            {p.status === "PENDING_REVIEW" && (
              <Button onClick={() => act(p.id, "publish")}>Publish</Button>
            )}
            {p.status === "PUBLISHED" && (
              <Button variant="outline" onClick={() => act(p.id, "pause")}>
                Pause
              </Button>
            )}
            {p.status === "PAUSED" && (
              <Button onClick={() => act(p.id, "unpause")}>Unpause</Button>
            )}
            <ConfirmButton
              onConfirm={async () => {
                const res = await fetch(`/api/properties/${p.id}`, {
                  method: "DELETE",
                });
                const d = await res.json().catch(() => ({}));
                toast(res.ok ? "ok" : "err", res.ok ? "Deleted" : d.error);
                reload();
              }}
            >
              Delete
            </ConfirmButton>
          </div>
        </Card>
      ))}
      {!props_.length && (
        <Empty
          title="No listings yet"
          hint={verified ? "Create your first villa listing." : "Draft a listing — publish after verification."}
        />
      )}
    </div>
  );
}

/* ---------------- Calendar ---------------- */

function Calendar({ props_ }: { props_: any[] }) {
  const [sel, setSel] = useState(props_[0]?.id);
  useEffect(() => {
    if (!sel && props_[0]) setSel(props_[0].id);
  }, [props_, sel]);
  if (!props_.length) return <Empty title="No properties" hint="Add a property first." />;
  return (
    <div className="space-y-4">
      <Select value={sel} onChange={(e) => setSel(e.target.value)}>
        {props_.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </Select>
      {sel && <PropertyCalendar propertyId={sel} />}
    </div>
  );
}

/* ---------------- Reservations ---------------- */

function Reservations() {
  const [bookings, setBookings] = useState<any[] | null>(null);
  const toast = useToast();
  const load = useCallback(
    () =>
      fetch("/api/bookings?host=1")
        .then((r) => r.json())
        .then((d) => setBookings(d.bookings ?? [])),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const act = async (id: string, action: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    toast(res.ok ? "ok" : "err", res.ok ? `${action} done` : d.error);
    load();
  };
  if (!bookings) return <Skeleton className="h-64" />;
  if (!bookings.length)
    return <Empty title="No reservations" hint="Guest requests appear here." />;
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card key={b.id} className="flex flex-wrap items-center gap-4">
          <div className="min-w-48">
            <p className="font-display text-lg text-white">
              {b.properties?.title}
            </p>
            <p className="text-xs text-mist">
              {b.check_in} → {b.check_out} · {b.guests_count} guests
            </p>
            {b.status === "CONFIRMED" && b.guest && (
              <p className="mt-1 text-xs text-mist">
                {b.guest.first_name} {b.guest.last_name} · {b.guest.email}
              </p>
            )}
          </div>
          <div className="text-sm text-gold-bright">
            {priceFmt.format(Number(b.total))}
          </div>
          <Badge tone={statusTone(b.status)}>{b.status}</Badge>
          <div className="ml-auto flex gap-2">
            {b.status === "PENDING" && (
              <>
                <Button onClick={() => act(b.id, "accept")}>Accept</Button>
                <Button variant="danger" onClick={() => act(b.id, "decline")}>
                  Decline
                </Button>
              </>
            )}
            {b.status === "CONFIRMED" &&
              b.check_out < new Date().toISOString().slice(0, 10) && (
                <Button variant="outline" onClick={() => act(b.id, "complete")}>
                  Mark complete
                </Button>
              )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Earnings ---------------- */

function Earnings() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/host/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);
  if (!stats) return <Skeleton className="h-64" />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
            This month
          </p>
          <p className="mt-2 font-display text-3xl text-gold-bright">
            {priceFmt.format(stats.earnings_month)}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
            Total earned
          </p>
          <p className="mt-2 font-display text-3xl text-gold-bright">
            {priceFmt.format(stats.earnings_total ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
            Next payout
          </p>
          <p className="mt-2 font-display text-3xl text-gold-bright">
            {priceFmt.format(stats.next_payout ?? 0)}
          </p>
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-mist">
            Per-booking breakdown
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const rows = (stats.breakdown ?? []).map((b: any) =>
                [b.check_in, b.title, b.total, b.fee, b.taxes, b.net].join(","),
              );
              const csv =
                "check_in,property,total,fee,taxes,net\n" + rows.join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv]));
              a.download = "earnings.csv";
              a.click();
            }}
          >
            Export CSV
          </Button>
        </div>
        {(stats.breakdown ?? []).map((b: any, i: number) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-2 border-b border-white/5 py-2 text-xs last:border-0"
          >
            <span className="text-mist">{b.check_in}</span>
            <span className="truncate text-white">{b.title}</span>
            <span className="text-right text-mist">
              {priceFmt.format(b.total)}
            </span>
            <span className="text-right text-mist">-{priceFmt.format(b.fee)}</span>
            <span className="text-right text-gold-bright">
              {priceFmt.format(b.net)}
            </span>
          </div>
        ))}
        {!(stats.breakdown ?? []).length && (
          <p className="text-sm text-mist">No earnings yet.</p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Media ---------------- */

function Media({ props_ }: { props_: any[] }) {
  const [sel, setSel] = useState(props_[0]?.id);
  const [media, setMedia] = useState<any[]>([]);
  useEffect(() => {
    if (!sel && props_[0]) setSel(props_[0].id);
  }, [props_, sel]);
  useEffect(() => {
    if (!sel) return;
    fetch(`/api/properties/${sel}/media`)
      .then((r) => r.json())
      .then((d) => setMedia(d.media ?? []));
  }, [sel]);
  if (!props_.length) return <Empty title="No properties" />;
  return (
    <div className="space-y-4">
      <Select value={sel} onChange={(e) => setSel(e.target.value)}>
        {props_.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </Select>
      {sel && <MediaSection propertyId={sel} media={media} canManage />}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function HostSettings({ profile, reload }: { profile: any; reload: () => void }) {
  const toast = useToast();
  const hp = profile.host_profiles?.[0] ?? profile.host_profiles ?? {};
  const [f, setF] = useState({
    display_name: hp.display_name ?? "",
    bio: hp.bio ?? "",
    languages: hp.languages ?? "",
    response_time: hp.response_time ?? "",
  });
  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Public host profile
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <Input
              value={f.display_name}
              onChange={(e) =>
                setF((s) => ({ ...s, display_name: e.target.value }))
              }
            />
          </Field>
          <Field label="Languages">
            <Input
              value={f.languages}
              onChange={(e) => setF((s) => ({ ...s, languages: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea
            value={f.bio}
            onChange={(e) => setF((s) => ({ ...s, bio: e.target.value }))}
          />
        </Field>
        <Button
          className="mt-3"
          onClick={async () => {
            const res = await fetch("/api/host/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(f),
            });
            toast(res.ok ? "ok" : "err", res.ok ? "Saved" : "Save failed");
            reload();
          }}
        >
          Save
        </Button>
      </Card>
      <Card>
        <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-mist">
          Payout account
        </p>
        <p className="text-sm text-mist">
          {hp.iban_masked
            ? `IBAN ${hp.iban_masked} · ${hp.bank_name ?? ""}`
            : "No payout account on file."}
        </p>
      </Card>
    </div>
  );
}
