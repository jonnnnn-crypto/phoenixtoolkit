"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lock, Cpu, Flag, Skull, Smartphone, Webhook } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const modules = [
  { icon: Lock, title: "Cryptography Lab", tools: "Hashcat, OpenSSL, CyberChef", desc: "Hash cracking, cipher decoding, and crypto attack simulation." },
  { icon: Cpu, title: "Reverse Engineering", tools: "Ghidra, Radare2, Pwntools", desc: "Binary analysis, decompilation, and exploit development." },
  { icon: Flag, title: "CTF Arena", tools: "Volatility, Binwalk, Steghide", desc: "Full-feature environment for Web, Pwn, Crypto, and Forensics." },
  { icon: Skull, title: "Malware Analysis", tools: "YARA, Cuckoo, REMnux", desc: "Behavioral analysis, sandboxing, and signature detection." },
  { icon: Smartphone, title: "Mobile Security", tools: "MobSF, APKTool, Frida", desc: "Android/iOS app dissection and dynamic instrumentation." },
  { icon: Webhook, title: "API Security", tools: "Kiterunner, GraphQLmap", desc: "Deep REST, GraphQL, and SOAP vulnerability testing." },
];

export default function AdvancedModules() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".module-card", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="modules" className="py-24 relative bg-[#070707] border-y border-[rgba(255,255,255,0.02)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="container mx-auto px-6" ref={sectionRef}>
        <div className="mb-16 text-center">
          <div className="inline-block px-3 py-1 mb-4 rounded border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.05)] text-[var(--cyber-blue)] text-xs font-mono uppercase tracking-widest">
            High-End Capabilities
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">Advanced Modules</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Beyond standard testing. Deep-dive environments for specialized security research.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((mod, i) => (
            <Link href={`/dashboard?engine=${encodeURIComponent(mod.title)}`} key={i} className="module-card glass p-8 rounded-2xl relative overflow-hidden group block hover:neon-border transition-all cursor-pointer hover:bg-[rgba(15,23,42,0.8)]">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                <mod.icon size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-[rgba(56,189,248,0.1)] flex items-center justify-center text-[var(--cyber-blue)] mb-6 transition-transform group-hover:scale-110">
                  <mod.icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[var(--neon-green)] transition-colors">{mod.title}</h3>
                <p className="text-gray-400 mb-6">{mod.desc}</p>
                <div className="text-sm font-mono text-[var(--cyber-blue)]">
                  {mod.tools}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
