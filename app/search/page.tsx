import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SearchFeed from "@/components/SearchFeed";
import { getVillas } from "@/lib/villas";

async function SearchFeedSection() {
  const villas = await getVillas();
  return <SearchFeed villas={villas} />;
}

function SearchFeedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-24 pt-28">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="glass h-44 animate-pulse rounded-3xl"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="aurora left-1/2 top-[-20%] h-[50vh] w-[60vw] -translate-x-1/2"
          style={{ background: "#2d1552" }}
        />
        <div
          className="aurora bottom-[-30%] right-[-10%] h-[50vh] w-[40vw]"
          style={{ background: "#1a0f35" }}
        />
      </div>
      <Navbar />
      <div className="relative z-10">
        <Suspense fallback={<SearchFeedSkeleton />}>
          <SearchFeedSection />
        </Suspense>
      </div>
    </main>
  );
}
