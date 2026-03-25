import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[rgba(255,255,255,0.05)] py-12 bg-[#020202] z-10 relative">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Phoenix CyberSec. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/ctf" className="hover:text-[var(--neon-green)] transition-colors">CTF Lab</Link>
          <Link href="/ai" className="hover:text-[var(--neon-green)] transition-colors">AI Engine</Link>
          <Link href="/cve" className="hover:text-[var(--neon-green)] transition-colors">Pentest Recon</Link>
        </div>
        <p className="text-[var(--neon-green)] font-mono text-xs tracking-widest drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
          // Production by PhoenixCySec
        </p>
      </div>
    </footer>
  );
}
