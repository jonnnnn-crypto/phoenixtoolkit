"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShieldAlert, Network, Bug, Terminal, Unlock, ServerCrash, Search, Cloud, Globe, Wrench } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { icon: Search, name: "Reconnaissance", count: "100+", desc: "Passive & active recon, Attack surface mapping", popular: "Subfinder, Amass, Katana" },
  { icon: Network, name: "Network Scan", count: "100+", desc: "Port scanning, Service detection", popular: "Nmap, Naabu, RustScan" },
  { icon: Bug, name: "Web Vulnerability", count: "200+", desc: "Template-based scanning, Payloads", popular: "Nuclei, Nikto, Wapiti" },
  { icon: Terminal, name: "Fuzzing & Discovery", count: "150+", desc: "Directory brute force, API fuzzing", popular: "FFUF, Dirsearch, Gobuster" },
  { icon: ServerCrash, name: "Exploitation", count: "200+", desc: "SQLi, XSS, SSRF, RCE chains", popular: "SQLMap, Dalfox, Ghauri" },
  { icon: Unlock, name: "Auth & Access", count: "100+", desc: "Brute force, Credential stuffing", popular: "Hydra, CrackMapExec" },
  { icon: Globe, name: "OSINT", count: "100+", desc: "Data enrichment, Exposure mapping", popular: "Shodan, Censys, Maltego" },
  { icon: Cloud, name: "Cloud Security", count: "80+", desc: "AWS/GCP/Azure posture assessment", popular: "ScoutSuite, Pacu" },
  { icon: ShieldAlert, name: "Subdomain Takeover", count: "50+", desc: "Dangling DNS, CNAME hijacking", popular: "Subzy, Subjack" },
  { icon: Wrench, name: "Utilities", count: "200+", desc: "Core engine support tools", popular: "httpx, SecLists, Interactsh" },
];

export default function ToolEcosystem() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".tool-card", {
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="tools" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Massive Tool Ecosystem</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            1000+ natively integrated security tools, categorized for precision and scale.
          </p>
        </div>
        
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link href={`/dashboard?engine=${encodeURIComponent(cat.name)}`} key={i} className="tool-card block glass p-6 rounded-xl hover:bg-[rgba(15,23,42,0.8)] transition-all group hover:neon-border cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-[rgba(34,197,94,0.1)] text-[var(--neon-green)] group-hover:scale-110 transition-transform">
                  <cat.icon size={24} />
                </div>
                <span className="text-xs font-mono text-[var(--cyber-blue)] bg-[rgba(56,189,248,0.1)] px-2 py-1 rounded">
                  {cat.count} tools
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
              <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{cat.desc}</p>
              <div className="border-t border-[rgba(255,255,255,0.05)] pt-4 mt-auto">
                <p className="text-xs text-gray-500 font-mono">
                  <span className="text-gray-300">Incl:</span> {cat.popular}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
