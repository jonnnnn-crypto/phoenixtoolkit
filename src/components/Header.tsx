import { Shield } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-[var(--neon-green)] drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-xl font-bold tracking-wider text-white">
            PHOENIX<span className="text-[var(--neon-green)] drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">OS</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <Link href="/dashboard" className="hover:text-[var(--neon-green)] transition-colors">Tools</Link>
          <Link href="/modules" className="hover:text-[var(--neon-green)] transition-colors">Modules</Link>
          <Link href="/docs" className="hover:text-[var(--neon-green)] transition-colors">Docs</Link>
          <Link href="/api-docs" className="hover:text-[var(--neon-green)] transition-colors">API</Link>
        </nav>
        <button className="neon-border px-6 py-2 rounded-md text-sm font-semibold text-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          Launch System
        </button>
      </div>
    </header>
  );
}
