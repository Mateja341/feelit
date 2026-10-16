import Navbar from "@/components/Navbar";
import HostOnboarding from "@/components/HostOnboarding";

export const metadata = {
  title: "Become a Host — Feelit",
};

export default function HostPage() {
  return (
    <main className="relative flex-1">
      <Navbar />
      <div className="aurora right-[-10%] top-[-10%] h-[30rem] w-[30rem] bg-gold/30" />
      <HostOnboarding />
    </main>
  );
}
