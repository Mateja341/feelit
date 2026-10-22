import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProfileTabs from "@/components/ProfileTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Profile — Feelit" };

async function Guarded() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/profile");
  return <ProfileTabs />;
}

export default function ProfilePage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <section className="relative mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <Guarded />
        </Suspense>
      </section>
    </main>
  );
}
