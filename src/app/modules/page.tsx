import Link from "next/link";
import { Terminal, Lock, ShieldAlert, Cpu, ArrowRight } from "lucide-react";

export default function ModulesPage() {
  const suites = [
    {
      title: "Terminal Dashboard",
      desc: "Remote Native Executable Hub. Launch Subfinder, Nmap, and HTTPX natively through the Vercel-to-Worker proxy loop.",
      icon: <Terminal size={32} />,
      href: "/dashboard",
      color: "border-purple-500/50 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] text-purple-400"
    },
    {
      title: "Cyberpunk Crypto Lab",
      desc: "Massive 10-Class CyberChef Engine mapping over 50 algorithms to pure JS and DeepSeek-driven universal decoding/encoding logic.",
      icon: <Lock size={32} />,
      href: "/ctf",
      color: "border-[var(--neon-green)]/50 hover:bg-[var(--neon-green)]/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] text-[var(--neon-green)]"
    },
    {
      title: "Threat Exploit Radar",
      desc: "Dual-fetch CVE scanner querying concurrent vulnerabilities from NVD and mining Live Proof of Concepts from GitHub Repositories.",
      icon: <ShieldAlert size={32} />,
      href: "/cve",
      color: "border-red-500/50 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] text-red-500"
    },
    {
      title: "AI Pentest Generator",
      desc: "Enterprise-grade intelligence compiler. Drafts HackerOne and Bugcrowd templated Markdown and HTML reports driven by DeepSeek R1.",
      icon: <Cpu size={32} />,
      href: "/ai",
      color: "border-[var(--cyber-blue)]/50 hover:bg-[var(--cyber-blue)]/10 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] text-[var(--cyber-blue)]"
    }
  ];

  return (
    <div className="container mx-auto px-6 py-20 min-h-[90vh]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
           <h1 className="text-4xl font-mono font-bold text-white mb-4">Phoenix <span className="text-[var(--neon-green)]">Modules Suites</span></h1>
           <p className="text-gray-400 font-mono text-sm max-w-2xl">A curated suite of offensive orchestration dashboards, vulnerability radars, and mathematical solvers. Navigate to your desired deployment interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {suites.map((s, i) => (
              <Link key={i} href={s.href} className={`bg-[#0a0a0a] border ${s.color} p-8 rounded-2xl flex flex-col justify-between transition-all group backdrop-blur-md`}>
                 <div>
                    <div className="mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform origin-left">
                       {s.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-widest uppercase text-sm mb-3">
                       {s.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 font-sans">
                       {s.desc}
                    </p>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                    Initialize Module <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform"/>
                 </div>
              </Link>
           ))}
        </div>
      </div>
    </div>
  );
}
