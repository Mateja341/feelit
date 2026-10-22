"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Select,
  Stepper,
  Textarea,
  useToast,
} from "./ui";
import { uploadFile } from "@/lib/upload";
import { priceFmt } from "@/lib/format";

const STEPS = [
  "Basics",
  "Location",
  "Details",
  "Photos",
  "Pricing",
  "Rules",
  "Review",
];

const AMENITIES = [
  "pool", "wifi", "parking", "kitchen", "air conditioning", "heating",
  "washer", "hot tub", "gym", "ev charger", "breakfast", "pets allowed",
  "sea view", "fireplace", "workspace", "bbq",
];

/** Multi-step property create/edit wizard — saves to the API on each step. */
export default function ListingWizard({
  propertyId,
  onDone,
}: {
  propertyId?: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<any>({ amenities: [], house_rules: {} });
  const [photos, setPhotos] = useState<any[]>([]);
  const toast = useToast();
  const idRef = useRef(propertyId);
  const [id, setId] = useState(propertyId);

  useEffect(() => {
    if (!propertyId) return;
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.property) {
          setP({ house_rules: {}, amenities: [], ...d.property });
          setPhotos(d.property.property_photos ?? []);
        }
      });
  }, [propertyId]);

  const save = useCallback(
    async (patch?: object) => {
      const body = patch ?? p;
      if (!id) {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await res.json();
        if (res.ok) {
          idRef.current = d.property.id;
          setId(d.property.id);
          setP(d.property);
        }
        return d;
      }
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) setP((s: any) => ({ ...s, ...d.property }));
      return d;
    },
    [id, p],
  );

  const set = (k: string, v: unknown) => setP((s: any) => ({ ...s, [k]: v }));
  const num = (k: string) => (e: { target: { value: string } }) =>
    set(k, e.target.value === "" ? null : Number(e.target.value));
  const txt = (k: string) => (e: { target: { value: string } }) =>
    set(k, e.target.value);

  const next = async () => {
    const r = await save();
    if (r.error) return toast("err", r.error);
    toast("ok", "Saved");
    setStep((s) => s + 1);
  };

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-display text-2xl text-white">
          {id ? "Edit listing" : "New listing"}
        </p>
        <Button variant="ghost" onClick={onDone}>
          ← Back to properties
        </Button>
      </div>
      <Stepper steps={STEPS} current={step} onStepClick={setStep} />

      {step === 0 && (
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={p.title ?? ""} onChange={txt("title")} />
          </Field>
          <Field label="Description">
            <Textarea value={p.description ?? ""} onChange={txt("description")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property type">
              <Select value={p.type ?? "villa"} onChange={txt("type")}>
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="penthouse">Penthouse</option>
                <option value="chalet">Chalet</option>
              </Select>
            </Field>
            <Field label="Accent color">
              <Input
                type="color"
                value={p.accent ?? "#a855f7"}
                onChange={txt("accent")}
              />
            </Field>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Country" required>
            <Input value={p.country ?? ""} onChange={txt("country")} />
          </Field>
          <Field label="City" required>
            <Input value={p.city ?? ""} onChange={txt("city")} />
          </Field>
          <Field label="Address">
            <Input value={p.address ?? ""} onChange={txt("address")} />
          </Field>
          <Field label="Distance from center (km)">
            <Input type="number" step="0.1" value={p.distance_from_center ?? ""} onChange={num("distance_from_center")} />
          </Field>
          <Field label="Latitude">
            <Input type="number" step="0.000001" value={p.lat ?? ""} onChange={num("lat")} />
          </Field>
          <Field label="Longitude">
            <Input type="number" step="0.000001" value={p.lng ?? ""} onChange={num("lng")} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Bedrooms">
              <Input type="number" value={p.bedrooms ?? ""} onChange={num("bedrooms")} />
            </Field>
            <Field label="Beds">
              <Input type="number" value={p.beds ?? ""} onChange={num("beds")} />
            </Field>
            <Field label="Bathrooms">
              <Input type="number" value={p.bathrooms ?? ""} onChange={num("bathrooms")} />
            </Field>
            <Field label="Max guests">
              <Input type="number" value={p.max_guests ?? ""} onChange={num("max_guests")} />
            </Field>
            <Field label="Check-in from">
              <Input type="time" value={p.check_in_from ?? "15:00"} onChange={txt("check_in_from")} />
            </Field>
            <Field label="Check-out by">
              <Input type="time" value={p.check_out_by ?? "11:00"} onChange={txt("check_out_by")} />
            </Field>
          </div>
          <Field label="Amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() =>
                    set(
                      "amenities",
                      p.amenities?.includes(a)
                        ? p.amenities.filter((x: string) => x !== a)
                        : [...(p.amenities ?? []), a],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    p.amenities?.includes(a)
                      ? "border-gold bg-gold/20 text-gold-bright"
                      : "border-white/15 text-mist hover:border-gold/50"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 px-6 py-10 text-sm text-mist hover:border-gold hover:text-white">
            Upload photos (min 5 to publish)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                for (const f of files) {
                  try {
                    const { public_url } = await uploadFile("property-photos", f);
                    const res = await fetch(`/api/properties/${id}/photos`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: public_url }),
                    });
                    const d = await res.json();
                    if (res.ok) setPhotos(d.photos);
                  } catch {
                    toast("err", "Upload failed");
                  }
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((ph) => (
              <div key={ph.id} className="group relative">
                <img
                  src={ph.url}
                  className={`aspect-video w-full rounded-xl object-cover ${ph.is_cover ? "ring-2 ring-gold" : ""}`}
                />
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="rounded bg-black/70 px-2 text-[10px] text-gold-bright"
                    onClick={async () => {
                      await fetch(`/api/properties/${id}/photos`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: ph.id, is_cover: true }),
                      });
                      setPhotos((s) =>
                        s.map((x) => ({ ...x, is_cover: x.id === ph.id })),
                      );
                    }}
                  >
                    Cover
                  </button>
                  <button
                    className="rounded bg-black/70 px-2 text-[10px] text-red-300"
                    onClick={async () => {
                      const res = await fetch(
                        `/api/properties/${id}/photos?photo=${ph.id}`,
                        { method: "DELETE" },
                      );
                      const d = await res.json();
                      if (res.ok) setPhotos(d.photos);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nightly price" required>
            <Input type="number" value={p.nightly_price ?? ""} onChange={num("nightly_price")} />
          </Field>
          <Field label="Cleaning fee">
            <Input type="number" value={p.cleaning_fee ?? ""} onChange={num("cleaning_fee")} />
          </Field>
          <Field label="Deposit">
            <Input type="number" value={p.deposit ?? ""} onChange={num("deposit")} />
          </Field>
          <Field label="Min nights">
            <Input type="number" value={p.min_nights ?? ""} onChange={num("min_nights")} />
          </Field>
          <Field label="Max nights">
            <Input type="number" value={p.max_nights ?? ""} onChange={num("max_nights")} />
          </Field>
          <Field label="Weekend price (+nights Fri/Sat)">
            <Input type="number" value={p.weekend_price ?? ""} onChange={num("weekend_price")} />
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cancellation policy">
              <Select
                value={p.cancellation_policy ?? "moderate"}
                onChange={txt("cancellation_policy")}
              >
                <option value="flexible">Flexible — 100% refund ≥1 day before</option>
                <option value="moderate">Moderate — 100% refund ≥5 days before</option>
                <option value="strict">Strict — 50% refund ≥14 days before</option>
              </Select>
            </Field>
            <Field label="Instant book">
              <Checkbox
                label="Guests can book without approval"
                checked={!!p.instant_book}
                onChange={(e) => set("instant_book", e.target.checked)}
              />
            </Field>
          </div>
          <Field label="House rules (one per line)">
            <Textarea
              value={p.house_rules_text ?? ""}
              onChange={txt("house_rules_text")}
              placeholder="No parties&#10;No smoking indoors&#10;Quiet hours 22:00–08:00"
            />
          </Field>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Title", p.title],
              ["Location", [p.city, p.country].filter(Boolean).join(", ")],
              ["Type", p.type],
              ["Nightly", p.nightly_price ? priceFmt.format(p.nightly_price) : "—"],
              ["Guests", p.max_guests],
              ["Photos", `${photos.length}`],
              ["Policy", p.cancellation_policy],
              ["Instant book", p.instant_book ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between border-b border-white/5 py-2">
                <span className="text-mist">{k}</span>
                <span className="text-white">{String(v ?? "—")}</span>
              </div>
            ))}
          </div>
          {photos.length < 5 && (
            <p className="text-xs text-gold-bright">
              Add at least 5 photos to publish (currently {photos.length}).
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                const res = await fetch(`/api/properties/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "submit_review" }),
                });
                const d = await res.json();
                toast(res.ok ? "ok" : "err", res.ok ? "Submitted for review" : d.error);
                if (res.ok) onDone();
              }}
            >
              Submit for review
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch(`/api/properties/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "publish" }),
                });
                const d = await res.json();
                toast(res.ok ? "ok" : "err", res.ok ? "Published!" : d.error);
                if (res.ok) onDone();
              }}
            >
              Publish now
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        {step < 6 && <Button onClick={next}>Save & continue</Button>}
      </div>
    </Card>
  );
}
