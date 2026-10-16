import { Suspense } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VillaDetail from "@/components/VillaDetail";
import { getVillaById, getVillas } from "@/lib/villas";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
