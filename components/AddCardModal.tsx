"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button, Field, Input, Modal, useToast } from "./ui";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

/** Add a card via Stripe SetupIntent — the card never touches our servers. */
export default function AddCardModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    fetch("/api/payment-methods/setup", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setClientSecret(d.client_secret ?? null));
  }, [open]);
  if (!stripePromise) {
    return (
      <Modal open={open} onClose={onClose} title="Add card">
        <p className="text-sm text-mist">
          Stripe publishable key is not configured.
        </p>
      </Modal>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="Add payment card">
      {clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#a855f7",
                colorBackground: "#10122a",
                colorText: "#e7e9f5",
                fontFamily: "Manrope, sans-serif",
              },
            },
          }}
        >
          <CardForm onDone={onAdded} onClose={onClose} />
        </Elements>
      ) : (
        <p className="py-8 text-center text-sm text-mist">Loading secure form…</p>
      )}
    </Modal>
  );
}

function CardForm({
  onDone,
  onClose,
}: {
  onDone: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <div className="space-y-4">
      <Field label="Cardholder name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <PaymentElement />
      <p className="text-[11px] text-mist/60">
        Card details go directly to Stripe — we only store the last 4 digits.
      </p>
      <Button
        loading={busy || !stripe}
        onClick={async () => {
          if (!stripe || !elements) return;
          setBusy(true);
          const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            confirmParams: { return_url: window.location.href },
            redirect: "if_required",
          });
          if (error) {
            toast("err", error.message ?? "Card declined");
            setBusy(false);
            return;
          }
          await fetch("/api/payment-methods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setup_intent_id: setupIntent?.id,
              cardholder_name: name,
            }),
          });
          toast("ok", "Card saved");
          onDone();
          onClose();
        }}
      >
        Save card
      </Button>
    </div>
  );
}
