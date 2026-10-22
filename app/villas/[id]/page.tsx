import { Suspense } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VillaDetail from "@/components/VillaDetail";
import PropertyDetail from "@/components/PropertyDetail";
import { getVillaById, getVillas } from "@/lib/villas";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Real host-created property first
  const db = createServiceRoleClient();
  if (db) {
    const { data: property } = await db
      .from("properties")
      .select("*, property_photos(*), property_media(*)")
      .eq("id", id)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (property) return <PropertyDetail property={property} />;
  }

  // Legacy seed villas
  const [villa, all] = await Promise.all([getVillaById(id), getVillas()]);
  if (!villa) notFound();
  const related = all.filter((v) => v.id !== villa.id).slice(0, 3);
  return <VillaDetail villa={villa} related={related} />;
}

export default function VillaPage({
  params,
}: PageProps<"/villas/[id]">) {
  return (
    <main className="relative flex-1">
      <Navbar />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
            <div className="glass h-[30rem] animate-pulse rounded-3xl bg-white/5" />
          </div>
        }
      >
        <Detail params={params} />
      </Suspense>
    </main>
  );
}
