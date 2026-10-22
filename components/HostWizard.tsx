"use client";

import { useState } from "react";
import { Wizard, WizardNav, useWizard } from "./Wizard";
import {
  Card,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from "./ui";
import { uploadFile } from "@/lib/upload";
import { validateJMBG } from "@/lib/validation";

const STEPS = [
  "Account",
  "Host type",
  "Identity",
  "Payout",
  "Profile",
  "Consents",
  "Review",
];
type R = Record<string, string>;
const get = <T,>(d: Record<string, unknown>, k: string) => (d[k] ?? {}) as T;

function StepHostType() {
  const { draft, save } = useWizard();
  const h = get<R>(draft, "host");
  const [f, setF] = useState<R>({
    host_type: h.host_type ?? "individual",
    id_type: h.id_type ?? "national_id",
    id_number: h.id_number ?? "",
    date_of_birth: h.date_of_birth ?? "",
    address: h.address ?? "",
    legal_name: h.legal_name ?? "",
    registration_number: h.registration_number ?? "",
    tax_id: h.tax_id ?? "",
    vat_number: h.vat_number ?? "",
    legal_address: h.legal_address ?? "",
    rep_full_name: h.rep_full_name ?? "",
    rep_id_number: h.rep_id_number ?? "",
    country: h.country ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Host type</h2>
      <div className="grid grid-cols-2 gap-3">
        {(["individual", "company"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setF((s) => ({ ...s, host_type: t }))}
            className={`glass rounded-2xl p-5 text-left transition-all ${
              f.host_type === t
                ? "border-gold shadow-[0_0_20px_-4px_rgba(168,85,247,0.7)]"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {t === "individual" ? "Individual" : "Company"}
            </span>
            <span className="mt-1 block text-xs text-mist">
              {t === "individual"
                ? "You rent out your own property"
                : "A registered business entity"}
            </span>
          </button>
        ))}
      </div>
      {f.host_type === "individual" ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID type" required>
            <Select value={f.id_type} onChange={set("id_type")}>
              <option value="national_id">National ID</option>
              <option value="jmbg">JMBG (Serbia)</option>
              <option value="passport">Passport</option>
            </Select>
          </Field>
          <Field
            label={f.id_type === "jmbg" ? "JMBG" : "ID number"}
            required
            error={
              f.id_type === "jmbg" && f.id_number && !validateJMBG(f.id_number)
                ? "Invalid JMBG"
                : undefined
            }
          >
            <Input value={f.id_number} onChange={set("id_number")} />
          </Field>
          <Field label="Date of birth" required>
            <Input
              type="date"
              value={f.date_of_birth}
              onChange={set("date_of_birth")}
            />
          </Field>
          <Field label="Address" required>
            <Input value={f.address} onChange={set("address")} />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Legal name" required>
            <Input value={f.legal_name} onChange={set("legal_name")} />
          </Field>
          <Field label="Registration number" required>
            <Input
              value={f.registration_number}
              onChange={set("registration_number")}
            />
          </Field>
          <Field label="Tax ID / PIB" required>
            <Input value={f.tax_id} onChange={set("tax_id")} />
          </Field>
          <Field label="VAT number">
            <Input value={f.vat_number} onChange={set("vat_number")} />
          </Field>
          <Field label="Legal address" required>
            <Input value={f.legal_address} onChange={set("legal_address")} />
          </Field>
          <Field label="Authorized representative">
            <Input value={f.rep_full_name} onChange={set("rep_full_name")} />
          </Field>
          <Field label="Representative ID number">
            <Input value={f.rep_id_number} onChange={set("rep_id_number")} />
          </Field>
        </div>
      )}
      <WizardNav
        onNext={async () => {
          if (
            f.host_type === "individual" &&
            (!f.id_number || !f.date_of_birth || !f.address)
          )
            return "Fill all required fields";
          if (f.id_type === "jmbg" && f.id_number && !validateJMBG(f.id_number))
            return "Invalid JMBG";
          if (
            f.host_type === "company" &&
            (!f.legal_name || !f.registration_number || !f.tax_id || !f.legal_address)
          )
            return "Fill all required fields";
          await save({ host: f }, 2);
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
  return (
    <Field label={label}>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 bg-ink-deep/40 px-4 py-6 text-xs text-mist transition-all hover:border-gold hover:text-white">
        {busy ? "Uploading…" : value ? "✓ Uploaded — tap to replace" : "Drop file or click"}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const { path } = await uploadFile("private-docs", file);
              onDone(path);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </Field>
  );
}

function StepIdentity() {
  const { draft, save } = useWizard();
  const i = get<R>(draft, "identity");
  const o = get<R>(draft, "ownership");
  const [f, setF] = useState<R>({
    doc_type: i.doc_type ?? "national_id",
    doc_number: i.doc_number ?? "",
    issuing_country: i.issuing_country ?? "",
    front_path: i.front_path ?? "",
    back_path: i.back_path ?? "",
    selfie_path: i.selfie_path ?? "",
    address_proof: i.address_proof ?? "",
  });
  const [own, setOwn] = useState<R>({
    path: o.path ?? "",
    note: o.note ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Identity & verification</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Document type">
          <Select value={f.doc_type} onChange={set("doc_type")}>
            <option value="national_id">National ID</option>
            <option value="jmbg">JMBG (Serbia)</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver's license</option>
          </Select>
        </Field>
        <Field label="Document number" required>
          <Input value={f.doc_number} onChange={set("doc_number")} />
        </Field>
        <Field label="Issuing country" required>
          <Input value={f.issuing_country} onChange={set("issuing_country")} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <DocUpload
          label="ID front"
          value={f.front_path}
          onDone={(p) => setF((s) => ({ ...s, front_path: p }))}
        />
        <DocUpload
          label="ID back"
          value={f.back_path}
          onDone={(p) => setF((s) => ({ ...s, back_path: p }))}
        />
        <DocUpload
          label="Selfie"
          value={f.selfie_path}
          onDone={(p) => setF((s) => ({ ...s, selfie_path: p }))}
        />
      </div>
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-3">
          <DocUpload
            label="Proof of address"
            value={f.address_proof}
            onDone={(p) => setF((s) => ({ ...s, address_proof: p }))}
          />
          <DocUpload
            label="Ownership / right to rent (title deed, lease…)"
            value={own.path}
            onDone={(p) => setOwn((s) => ({ ...s, path: p }))}
          />
        </div>
      </Card>
      <WizardNav
        onNext={async () => {
          if (!f.doc_number || !f.issuing_country) return "Fill required fields";
          await save({ identity: f, ownership: own }, 3);
        }}
      />
    </div>
  );
}

function StepPayout() {
  const { draft, save } = useWizard();
  const p = get<R>(draft, "payout");
  const [f, setF] = useState<R>({
    kind: p.kind ?? "bank",
    account_holder: p.account_holder ?? "",
    iban: p.iban ?? "",
    swift: p.swift ?? "",
    bank_name: p.bank_name ?? "",
    currency: p.currency ?? "USD",
    tax_residency: p.tax_residency ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Payout setup</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Account holder" required>
          <Input value={f.account_holder} onChange={set("account_holder")} />
        </Field>
        <Field label="IBAN" required hint="Encrypted at rest">
          <Input value={f.iban} onChange={set("iban")} placeholder="RS35…" />
        </Field>
        <Field label="SWIFT / BIC">
          <Input value={f.swift} onChange={set("swift")} />
        </Field>
        <Field label="Bank name">
          <Input value={f.bank_name} onChange={set("bank_name")} />
        </Field>
        <Field label="Currency">
          <Select value={f.currency} onChange={set("currency")}>
            <option>USD</option>
            <option>EUR</option>
            <option>RSD</option>
          </Select>
        </Field>
        <Field label="Tax residency (country)">
          <Input value={f.tax_residency} onChange={set("tax_residency")} />
        </Field>
      </div>
      <p className="text-[11px] text-mist/60">
        Stripe Connect onboarding can replace a bank account later from Host
        settings.
      </p>
      <WizardNav
        onNext={async () => {
          if (!f.account_holder || !f.iban) return "IBAN and holder required";
          await save({ payout: f }, 4);
        }}
      />
    </div>
  );
}

function StepProfile() {
  const { draft, save } = useWizard();
  const p = get<R>(draft, "public");
  const [f, setF] = useState<R>({
    display_name: p.display_name ?? "",
    photo_url: p.photo_url ?? "",
    bio: p.bio ?? "",
    languages: p.languages ?? "",
    response_time: p.response_time ?? "within a day",
    years_hosting: p.years_hosting ?? "",
  });
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Public host profile</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display name" required>
          <Input
            value={f.display_name}
            onChange={(e) => setF((s) => ({ ...s, display_name: e.target.value }))}
          />
        </Field>
        <Field label="Languages (comma-separated)">
          <Input
            value={f.languages}
            placeholder="English, Srpski"
            onChange={(e) => setF((s) => ({ ...s, languages: e.target.value }))}
          />
        </Field>
        <Field label="Typical response time">
          <Select
            value={f.response_time}
            onChange={(e) =>
              setF((s) => ({ ...s, response_time: e.target.value }))
            }
          >
            <option>within an hour</option>
            <option>within a few hours</option>
            <option>within a day</option>
          </Select>
        </Field>
        <Field label="Years hosting">
          <Input
            type="number"
            value={f.years_hosting}
            onChange={(e) =>
              setF((s) => ({ ...s, years_hosting: e.target.value }))
            }
          />
        </Field>
      </div>
      <Field label="Bio">
        <Textarea
          value={f.bio}
          onChange={(e) => setF((s) => ({ ...s, bio: e.target.value }))}
          placeholder="Tell guests about yourself…"
        />
      </Field>
      <WizardNav
        onNext={async () => {
          if (!f.display_name) return "Display name is required";
          await save({ public: f }, 5);
        }}
      />
    </div>
  );
}

function StepConsents() {
  const { draft, save } = useWizard();
  const c = (draft.consents ?? {}) as Record<string, boolean>;
  const [f, setF] = useState({
    host_terms: !!c.host_terms,
    privacy: !!c.privacy,
    cancellation: !!c.cancellation,
    regulation: !!c.regulation,
    marketing: !!c.marketing,
  });
  const cb = (k: keyof typeof f, label: string) => (
    <Checkbox
      label={label}
      checked={f[k]}
      onChange={(e) => setF((s) => ({ ...s, [k]: e.target.checked }))}
    />
  );
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Host consents</h2>
      {cb("host_terms", "I agree to the Host Terms")}
      {cb("privacy", "I agree to the Privacy Policy (GDPR)")}
      {cb(
        "cancellation",
        "I acknowledge the cancellation policy and guest refund rules",
      )}
      {cb(
        "regulation",
        "I declare compliance with local rental regulations and tourist tax",
      )}
      {cb("marketing", "Send me occasional product updates")}
      <WizardNav
        onNext={async () => {
          if (!f.host_terms || !f.privacy || !f.cancellation || !f.regulation)
            return "Required consents are missing";
          await save({ consents: f }, 6);
        }}
      />
    </div>
  );
}

function StepReview() {
  const { draft, goTo, submit, submitting } = useWizard();
  const h = get<R>(draft, "host");
  const p = get<R>(draft, "public");
  const py = get<R>(draft, "payout");
  const row = (t: string, v?: string) => (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-mist">{t}</span>
      <span className="text-white">{v || "—"}</span>
    </div>
  );
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Review & submit</h2>
      <Card className="space-y-1 !p-4">
        <div className="mb-1 flex justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            Host
          </span>
          <button
            className="text-[10px] uppercase tracking-widest text-mist hover:text-gold-bright"
            onClick={() => goTo(1)}
          >
            Edit
          </button>
        </div>
        {row("Type", h.host_type)}
        {h.host_type === "company" ? row("Company", h.legal_name) : null}
        {row(
          "ID",
          h.id_number ? `••••${h.id_number.slice(-4)}` : undefined,
        )}
      </Card>
      <Card className="space-y-1 !p-4">
        <div className="mb-1 flex justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            Payout
          </span>
          <button
            className="text-[10px] uppercase tracking-widest text-mist hover:text-gold-bright"
            onClick={() => goTo(3)}
          >
            Edit
          </button>
        </div>
        {row("IBAN", py.iban ? `••••${py.iban.slice(-4)}` : undefined)}
        {row("Bank", py.bank_name)}
      </Card>
      <Card className="space-y-1 !p-4">
        {row("Display name", p.display_name)}
      </Card>
      <WizardNav
        nextLabel={submitting ? "Submitting…" : "Become a host"}
        onNext={async () => submit()}
      />
    </div>
  );
}

export default function HostWizard({
  initialDraft,
  initialStep,
}: {
  initialDraft: Record<string, unknown>;
  initialStep: number;
}) {
  const bodies = [
    <StepAccount key={0} />,
    <StepHostType key={1} />,
    <StepIdentity key={2} />,
    <StepPayout key={3} />,
    <StepProfile key={4} />,
    <StepConsents key={5} />,
    <StepReview key={6} />,
  ];
  return (
    <Wizard
      role="host"
      steps={STEPS}
      initialDraft={initialDraft}
      initialStep={initialStep}
      donePath="/host"
    >
      <WizardBody bodies={bodies} />
    </Wizard>
  );
}

function StepAccount() {
  const { draft, save } = useWizard();
  const a = get<R>(draft, "account");
  const [email, setEmail] = useState(a.email ?? "");
  const [phone, setPhone] = useState(a.phone ?? "");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-white">Account</h2>
      <Field label="Contact email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Phone (with country code)">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <WizardNav
        showBack={false}
        onNext={async () => {
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
            return "Enter a valid email";
          await save({ account: { email, phone } }, 1);
        }}
      />
    </div>
  );
}

function WizardBody({ bodies }: { bodies: React.ReactNode[] }) {
  const { step } = useWizard();
  return <>{bodies[step]}</>;
}
