import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import HostWizard from "@/components/HostWizard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Host onboarding — Feelit" };

async function Guarded() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/onboarding/host");

  let { data: profile } = await supabase
    .from("profiles")
    .select("host_draft, host_step, host_onboarded, roles")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      roles: ["GUEST"],
    });
    profile = { host_draft: {}, host_step: 0, host_onboarded: false, roles: ["GUEST"] };
  }
  if (profile.host_onboarded) redirect("/host");

  return (
    <HostWizard
      initialDraft={(profile.host_draft as Record<string, unknown>) ?? {}}
      initialStep={Math.min(profile.host_step ?? 0, 6)}
    />
  );
}

export default function HostOnboardingPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora right-[-10%] top-[-10%] h-[30rem] w-[30rem] bg-gold/30" />
      <section className="relative mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-32">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.5em] text-gold">
            Host onboarding
          </p>
          <h1 className="mt-3 font-display text-4xl text-slate-100">
            List your <span className="gold-text italic">property</span>
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
