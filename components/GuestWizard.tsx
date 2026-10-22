"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wizard, WizardNav, useWizard } from "./Wizard";
import {
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  PasswordInput,
  Select,
  useToast,
} from "./ui";
import { uploadFile } from "@/lib/upload";
import { validateJMBG } from "@/lib/validation";

const STEPS = [
  "Account",
  "Personal",
  "Identity",
  "Address",
  "Contacts",
  "Payment",
  "Consents",
  "Review",
];

function get<T>(d: Record<string, unknown>, k: string): T {
  return (d[k] ?? {}) as T;
}
type R = Record<string, string>;

/* ---------- step bodies ---------- */

function StepAccount() {
  const { draft, save, goTo } = useWizard();
  const a = get<R>(draft, "account");
  const [email, setEmail] = useState(a.email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [phone, setPhone] = useState(a.phone ?? "");
  const strength = pw.length >= 10 ? 3 : pw.length > 0 ? 1 : 0;
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Your account</h2>
      <Field label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password" required hint="Minimum 10 characters">
        <PasswordInput
          value={pw}
          strength={strength}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••••"
        />
      </Field>
      <Field label="Repeat password" required>
        <PasswordInput
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="••••••••••"
        />
      </Field>
      <Field label="Phone (with country code)" hint="e.g. +381641234567">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+381…"
        />
      </Field>
      <WizardNav
        showBack={false}
        onNext={async () => {
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
            return "Enter a valid email";
          if (pw.length < 10) return "Password needs 10+ characters";
          if (pw !== pw2) return "Passwords don't match";
          await save(
            { account: { email, phone } },
            1,
          );
        }}
      />
    </div>
  );
}

function StepPersonal() {
  const { draft, save } = useWizard();
  const p = get<R>(draft, "personal");
  const [f, setF] = useState<R>({
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    parent_name: p.parent_name ?? "",
    date_of_birth: p.date_of_birth ?? "",
    gender: p.gender ?? "",
    nationality: p.nationality ?? "",
    country_of_residence: p.country_of_residence ?? "",
    preferred_language: p.preferred_language ?? "en",
    preferred_currency: p.preferred_currency ?? "USD",
    occupation: p.occupation ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Personal data</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" required>
          <Input value={f.first_name} onChange={set("first_name")} />
        </Field>
        <Field label="Last name" required>
          <Input value={f.last_name} onChange={set("last_name")} />
        </Field>
        <Field label="Parent's name (optional)">
          <Input value={f.parent_name} onChange={set("parent_name")} />
        </Field>
        <Field label="Date of birth (18+)" required>
          <Input
            type="date"
            value={f.date_of_birth}
            onChange={set("date_of_birth")}
          />
        </Field>
        <Field label="Gender (optional)">
          <Select value={f.gender} onChange={set("gender")}>
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Nationality" required>
          <Input value={f.nationality} onChange={set("nationality")} />
        </Field>
        <Field label="Country of residence" required>
          <Input
            value={f.country_of_residence}
            onChange={set("country_of_residence")}
          />
        </Field>
        <Field label="Occupation">
          <Input value={f.occupation} onChange={set("occupation")} />
        </Field>
        <Field label="Preferred language">
          <Select
            value={f.preferred_language}
            onChange={set("preferred_language")}
          >
            <option value="en">English</option>
            <option value="sr">Srpski</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
          </Select>
        </Field>
        <Field label="Preferred currency">
          <Select
            value={f.preferred_currency}
            onChange={set("preferred_currency")}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="RSD">RSD</option>
            <option value="GBP">GBP</option>
          </Select>
        </Field>
      </div>
      <WizardNav
        onNext={async () => {
          if (!f.first_name || !f.last_name) return "Name is required";
          if (!f.date_of_birth) return "Date of birth is required";
          const age =
            (Date.now() - new Date(f.date_of_birth).getTime()) /
            (365.25 * 86400e3);
          if (age < 18) return "You must be 18 or older";
          if (!f.nationality || !f.country_of_residence)
            return "Nationality and residence are required";
          await save({ personal: f }, 2);
        }}
      />
    </div>
  );
}

function DocUpload({
  label,
  value,
  onDone,
}: {
  label: string;
  value?: string;
  onDone: (path: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Field label={label}>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 bg-ink-deep/40 px-4 py-6 text-xs text-mist transition-all hover:border-gold hover:text-white">
        {busy ? "Uploading…" : value ? "✓ Uploaded — tap to replace" : "Drop image or click"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const { path } = await uploadFile("private-docs", file);
              onDone(path);
              toast("ok", `${label} uploaded`);
            } catch {
              toast("err", "Upload failed");
            }
            setBusy(false);
          }}
        />
      </label>
    </Field>
  );
}

function StepIdentity() {
  const { draft, save } = useWizard();
  const i = get<R>(draft, "identity");
  const [f, setF] = useState<R>({
    doc_type: i.doc_type ?? "national_id",
    doc_number: i.doc_number ?? "",
    issue_date: i.issue_date ?? "",
    expiry_date: i.expiry_date ?? "",
    issuing_country: i.issuing_country ?? "",
    front_path: i.front_path ?? "",
    back_path: i.back_path ?? "",
    selfie_path: i.selfie_path ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Identity document</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Document type" required>
          <Select value={f.doc_type} onChange={set("doc_type")}>
            <option value="national_id">National ID</option>
            <option value="jmbg">JMBG (Serbia)</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver's license</option>
          </Select>
        </Field>
        <Field
          label={f.doc_type === "jmbg" ? "JMBG (13 digits)" : "Document number"}
          required
          error={
            f.doc_type === "jmbg" && f.doc_number && !validateJMBG(f.doc_number)
              ? "Invalid JMBG"
              : undefined
          }
        >
          <Input value={f.doc_number} onChange={set("doc_number")} />
        </Field>
        <Field label="Issue date">
          <Input
            type="date"
            value={f.issue_date}
            onChange={set("issue_date")}
          />
        </Field>
        <Field label="Expiry date">
          <Input
            type="date"
            value={f.expiry_date}
            onChange={set("expiry_date")}
          />
        </Field>
        <Field label="Issuing country" required>
          <Input value={f.issuing_country} onChange={set("issuing_country")} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <DocUpload
          label="Front"
          value={f.front_path}
          onDone={(p) => setF((s) => ({ ...s, front_path: p }))}
        />
        <DocUpload
          label="Back"
          value={f.back_path}
          onDone={(p) => setF((s) => ({ ...s, back_path: p }))}
        />
        <DocUpload
          label="Selfie"
          value={f.selfie_path}
          onDone={(p) => setF((s) => ({ ...s, selfie_path: p }))}
        />
      </div>
      <p className="text-[11px] text-mist/60">
        Documents are stored encrypted in a private vault — only you and
        verification can open them.
      </p>
      <WizardNav
        onNext={async () => {
          if (!f.doc_number || !f.issuing_country) return "Fill required fields";
          if (f.doc_type === "jmbg" && !validateJMBG(f.doc_number))
            return "Invalid JMBG";
          await save({ identity: f }, 3);
        }}
      />
    </div>
  );
}

function StepAddress() {
  const { draft, save } = useWizard();
  const r = get<R>(draft, "residential");
  const b = get<R>(draft, "billing");
  const [res, setRes] = useState<R>({
    line1: r.line1 ?? "",
    line2: r.line2 ?? "",
    city: r.city ?? "",
    postal_code: r.postal_code ?? "",
    country: r.country ?? "",
  });
  const [same, setSame] = useState<boolean>(draft.billing_same !== false);
  const [bil, setBil] = useState<R>({
    line1: b.line1 ?? "",
    line2: b.line2 ?? "",
    city: b.city ?? "",
    postal_code: b.postal_code ?? "",
    country: b.country ?? "",
  });
  const setR = (k: string) => (e: { target: { value: string } }) =>
    setRes((s) => ({ ...s, [k]: e.target.value }));
  const setB = (k: string) => (e: { target: { value: string } }) =>
    setBil((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Addresses</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Street & number" required>
          <Input value={res.line1} onChange={setR("line1")} />
        </Field>
        <Field label="Apt / suite (optional)">
          <Input value={res.line2} onChange={setR("line2")} />
        </Field>
        <Field label="City" required>
          <Input value={res.city} onChange={setR("city")} />
        </Field>
        <Field label="Postal code">
          <Input value={res.postal_code} onChange={setR("postal_code")} />
        </Field>
        <Field label="Country" required>
          <Input value={res.country} onChange={setR("country")} />
        </Field>
      </div>
      <Checkbox
        label="Billing address same as residential"
        checked={same}
        onChange={(e) => setSame(e.target.checked)}
      />
      {!same && (
        <Card className="grid grid-cols-2 gap-4 !p-4">
          <Field label="Billing street">
            <Input value={bil.line1} onChange={setB("line1")} />
          </Field>
          <Field label="Apt / suite">
            <Input value={bil.line2} onChange={setB("line2")} />
          </Field>
          <Field label="City">
            <Input value={bil.city} onChange={setB("city")} />
          </Field>
          <Field label="Postal code">
            <Input value={bil.postal_code} onChange={setB("postal_code")} />
          </Field>
          <Field label="Country">
            <Input value={bil.country} onChange={setB("country")} />
          </Field>
        </Card>
      )}
      <WizardNav
        onNext={async () => {
          if (!res.line1 || !res.city || !res.country)
            return "Residential address is required";
          await save({ residential: res, billing_same: same, billing: bil }, 4);
        }}
      />
    </div>
  );
}

function StepContacts() {
  const { draft, save } = useWizard();
  const e = get<R>(draft, "emergency");
  const t = get<R>(draft, "travel");
  const extra = (draft.additional_guests ?? []) as R[];
  const [em, setEm] = useState<R>({
    name: e.name ?? "",
    phone: e.phone ?? "",
    relationship: e.relationship ?? "",
  });
  const [tr, setTr] = useState<R>({
    travel_purpose: t.travel_purpose ?? "",
    arrival_method: t.arrival_method ?? "",
    special_requests: t.special_requests ?? "",
    allergies_diet: t.allergies_diet ?? "",
  });
  const [pets, setPets] = useState(Boolean(t.pets));
  const [guests, setGuests] = useState<R[]>(extra);
  const addGuest = () =>
    setGuests((g) => [
      ...g,
      { full_name: "", date_of_birth: "", id_number: "", relationship: "" },
    ]);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Contacts & travel</h2>
      <Card className="grid grid-cols-3 gap-3 !p-4">
        <Field label="Emergency contact">
          <Input
            value={em.name}
            onChange={(e) => setEm((s) => ({ ...s, name: e.target.value }))}
          />
        </Field>
        <Field label="Phone">
          <Input
            value={em.phone}
            onChange={(e) => setEm((s) => ({ ...s, phone: e.target.value }))}
          />
        </Field>
        <Field label="Relationship">
          <Input
            value={em.relationship}
            onChange={(e) =>
              setEm((s) => ({ ...s, relationship: e.target.value }))
            }
          />
        </Field>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Travel purpose">
          <Select
            value={tr.travel_purpose}
            onChange={(e) =>
              setTr((s) => ({ ...s, travel_purpose: e.target.value }))
            }
          >
            <option value="">—</option>
            <option>Leisure</option>
            <option>Business</option>
            <option>Family</option>
            <option>Event</option>
          </Select>
        </Field>
        <Field label="Arrival method">
          <Select
            value={tr.arrival_method}
            onChange={(e) =>
              setTr((s) => ({ ...s, arrival_method: e.target.value }))
            }
          >
            <option value="">—</option>
            <option>Car</option>
            <option>Flight</option>
            <option>Private transfer</option>
            <option>Boat</option>
          </Select>
        </Field>
        <Field label="Special requests">
          <Input
            value={tr.special_requests}
            onChange={(e) =>
              setTr((s) => ({ ...s, special_requests: e.target.value }))
            }
          />
        </Field>
        <Field label="Allergies / diet">
          <Input
            value={tr.allergies_diet}
            onChange={(e) =>
              setTr((s) => ({ ...s, allergies_diet: e.target.value }))
            }
          />
        </Field>
      </div>
      <Checkbox
        label="Travelling with pets"
        checked={pets}
        onChange={(e) => setPets(e.target.checked)}
      />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mist">
            Additional guests
          </span>
          <Button variant="outline" onClick={addGuest}>
            + Add
          </Button>
        </div>
        {guests.map((g, i) => (
          <Card key={i} className="mb-2 grid grid-cols-4 gap-2 !p-3">
            <Input
              placeholder="Full name"
              value={g.full_name}
              onChange={(e) =>
                setGuests((s) =>
                  s.map((x, j) => (j === i ? { ...x, full_name: e.target.value } : x)),
                )
              }
            />
            <Input
              type="date"
              value={g.date_of_birth}
              onChange={(e) =>
                setGuests((s) =>
                  s.map((x, j) =>
                    j === i ? { ...x, date_of_birth: e.target.value } : x,
                  ),
                )
              }
            />
            <Input
              placeholder="ID number"
              value={g.id_number}
              onChange={(e) =>
                setGuests((s) =>
                  s.map((x, j) => (j === i ? { ...x, id_number: e.target.value } : x)),
                )
              }
            />
            <Input
              placeholder="Relationship"
              value={g.relationship}
              onChange={(e) =>
                setGuests((s) =>
                  s.map((x, j) =>
                    j === i ? { ...x, relationship: e.target.value } : x,
                  ),
                )
              }
            />
          </Card>
        ))}
      </div>
      <WizardNav
        onNext={async () =>
          save(
            {
              emergency: em,
              travel: { ...tr, pets },
              additional_guests: guests.filter((g) => g.full_name),
            },
            5,
          )
        }
      />
    </div>
  );
}

function StepPayment() {
  const { save } = useWizard();
  const [cards, setCards] = useState<{
    brand?: string;
    last4?: string;
  }[]>([]);
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Payment method</h2>
      <p className="text-sm text-mist">
        Cards are added securely via Stripe and can be managed later in your
        profile. You can skip this step and add a card before your first
        booking.
      </p>
      <Button
        variant="outline"
        onClick={() => router.push("/profile?tab=payment&add_card=1")}
      >
        Add card via Stripe →
      </Button>
      {cards.length > 0 && (
        <div className="text-xs text-mist">
          {cards.length} card(s) saved
        </div>
      )}
      <WizardNav onNext={async () => save({}, 6)} />
    </div>
  );
}

function StepConsents() {
  const { draft, save } = useWizard();
  const c = (draft.consents ?? {}) as Record<string, boolean>;
  const [f, setF] = useState({
    terms: !!c.terms,
    privacy: !!c.privacy,
    house_rules: !!c.house_rules,
    deposit: !!c.deposit,
    marketing: !!c.marketing,
  });
  const cb = (k: keyof typeof f, label: string, req = false) => (
    <Checkbox
      label={
        <span>
          {label}
          {req && <span className="text-gold-bright"> *</span>}
        </span>
      }
      checked={f[k]}
      onChange={(e) => setF((s) => ({ ...s, [k]: e.target.checked }))}
    />
  );
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Consents</h2>
      {cb("terms", "I agree to the Terms of Use", true)}
      {cb("privacy", "I agree to the Privacy Policy (GDPR)", true)}
      {cb("house_rules", "I will respect house rules of properties I book", true)}
      {cb(
        "deposit",
        "I authorize a security-deposit hold on my payment method",
        true,
      )}
      {cb("marketing", "Send me occasional offers and inspiration")}
      <p className="text-[11px] text-mist/60">
        Timestamp, IP and document version are recorded with each consent.
      </p>
      <WizardNav
        onNext={async () => {
          if (!f.terms || !f.privacy || !f.house_rules || !f.deposit)
            return "Required consents are missing";
          await save({ consents: f }, 7);
        }}
      />
    </div>
  );
}

function StepReview() {
  const { draft, goTo, submit, submitting } = useWizard();
  const p = get<R>(draft, "personal");
  const i = get<R>(draft, "identity");
  const r = get<R>(draft, "residential");
  const section = (
    title: string,
    step: number,
    rows: [string, string | undefined][],
  ) => (
    <Card className="!p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
          {title}
        </span>
        <button
          className="text-[10px] uppercase tracking-widest text-mist hover:text-gold-bright"
          onClick={() => goTo(step)}
        >
          Edit
        </button>
      </div>
      <dl className="space-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-mist">{k}</dt>
            <dd className="truncate text-white">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Review & submit</h2>
      {section("Personal", 1, [
        ["Name", `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()],
        ["Born", p.date_of_birth],
        ["Nationality", p.nationality],
        ["Residence", p.country_of_residence],
      ])}
      {section("Identity", 2, [
        ["Document", i.doc_type],
        ["Number", i.doc_number ? `••••${i.doc_number.slice(-4)}` : "—"],
        ["Issued by", i.issuing_country],
      ])}
      {section("Address", 3, [
        ["Street", r.line1],
        ["City", r.city],
        ["Country", r.country],
      ])}
      <WizardNav
        nextLabel={submitting ? "Submitting…" : "Create my account"}
        onNext={async () => submit()}
      />
    </div>
  );
}

export default function GuestWizard({
  initialDraft,
  initialStep,
}: {
  initialDraft: Record<string, unknown>;
  initialStep: number;
}) {
  const bodies = [
    <StepAccount key={0} />,
    <StepPersonal key={1} />,
    <StepIdentity key={2} />,
    <StepAddress key={3} />,
    <StepContacts key={4} />,
    <StepPayment key={5} />,
    <StepConsents key={6} />,
    <StepReview key={7} />,
  ];
  return (
    <Wizard
      role="guest"
      steps={STEPS}
      initialDraft={initialDraft}
      initialStep={initialStep}
      donePath="/profile"
    >
      <WizardBody bodies={bodies} />
    </Wizard>
  );
}

function WizardBody({ bodies }: { bodies: React.ReactNode[] }) {
  const { step } = useWizard();
  return <>{bodies[step]}</>;
}
