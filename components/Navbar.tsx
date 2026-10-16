"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import UserMenu from "./UserMenu";

export default function Navbar() {
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
            Feelit
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-mist sm:inline">
            Private Villas
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-300">
          <Link
            href="/#villas"
            className="hidden transition-colors hover:text-gold-bright sm:inline"
          >
            Villas
          </Link>
          <Link
            href="/#experiences"
            className="hidden transition-colors hover:text-gold-bright sm:inline"
          >
            Experiences
          </Link>
          <Link
            href="/host"
            className="transition-colors hover:text-gold-bright"
          >
            Become a Host
          </Link>
          <UserMenu />
        </div>
      </nav>
    </motion.header>
  );
}
