import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import HostDashboard from "@/components/HostDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Host — Feelit" };

async function Guarded() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/host");
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles, host_onboarded")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.host_onboarded) redirect("/onboarding/host");
  return <HostDashboard />;
}

export default function HostPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <section className="relative mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <Guarded />
        </Suspense>
      </section>
    </main>
  );
}
