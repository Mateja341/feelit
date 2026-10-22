import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import GuestWizard from "@/components/GuestWizard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Guest onboarding — Feelit" };

async function Guarded() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/onboarding/guest");

  let { data: profile } = await supabase
    .from("profiles")
    .select("guest_draft, guest_step, guest_onboarded, roles")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      roles: ["GUEST"],
    });
    profile = { guest_draft: {}, guest_step: 0, guest_onboarded: false, roles: ["GUEST"] };
  }
  if (profile.guest_onboarded) redirect("/profile");

  return (
    <GuestWizard
      initialDraft={(profile.guest_draft as Record<string, unknown>) ?? {}}
      initialStep={Math.min(profile.guest_step ?? 0, 7)}
    />
  );
}

export default function GuestOnboardingPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora left-[-10%] top-[20%] h-[30rem] w-[30rem] bg-gold/30" />
      <section className="relative mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-32">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
            Guest onboarding
          </p>
          <h1 className="mt-3 font-display text-4xl text-slate-100">
            Tell us about <span className="gold-text italic">you</span>
          </h1>
          <p className="mt-2 text-xs text-mist">
            Every step autosaves — you can leave and resume anytime.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <Guarded />
        </Suspense>
      </section>
    </main>
  );
}
