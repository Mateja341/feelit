"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import UserMenu from "./UserMenu";
import { HomeIcon, HeartIcon } from "./icons";

export default function Navbar() {
  const [favCount, setFavCount] = useState(0);
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFavCount(d?.ids?.length ?? 0))
      .catch(() => {});
  }, []);
  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <nav className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-6 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-wide gold-text">
            Feel it.
          </span>
        </Link>
        <div className="flex items-center gap-5 text-mist">
          <Link
            href="/"
            aria-label="Home"
            className="transition-colors hover:text-gold-bright"
          >
            <HomeIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/profile?tab=favorites"
            aria-label="Liked properties"
            className="relative transition-colors hover:text-gold-bright"
          >
            <HeartIcon className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <UserMenu />
        </div>
      </nav>
    </motion.header>
  );
}
