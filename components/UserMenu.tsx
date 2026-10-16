"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(!isSupabaseConfigured);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoaded(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!loaded || !user) {
    return (
      <Link
        href="/auth"
        className="gold-border rounded-full px-4 py-1.5 text-gold-bright transition-all hover:bg-gold/10"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="hidden text-mist transition-colors hover:text-gold-bright sm:inline"
      >
        Dashboard
      </Link>
      <button
        onClick={async () => {
          const supabase = createSupabaseBrowserClient();
          await supabase?.auth.signOut();
          router.refresh();
        }}
        title={user.email ?? "Account"}
        className="gold-border flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-gold-bright transition-colors hover:bg-gold/15"
      >
        {(user.email ?? "F").slice(0, 1).toUpperCase()}
      </button>
    </div>
  );
}
