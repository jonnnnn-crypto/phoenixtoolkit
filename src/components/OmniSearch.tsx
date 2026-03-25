"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Terminal, ShieldAlert, Cpu, Globe, Crosshair } from "lucide-react";

export default function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const performAction = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm px-4">
      {/* Search Modal */}
      <div 
        className="w-full max-w-2xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        {/* Input Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
          <Search size={22} className="text-[var(--neon-green)]" />
          <input
            autoFocus
            type="text"
            placeholder="Type 'nmap', 'sqlmap', or press ↑↓ to navigate..."
            className="flex-1 bg-transparent text-white focus:outline-none text-lg placeholder:text-gray-500 font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-xs font-mono px-2 py-1 bg-[#222] text-gray-400 rounded">ESC</span>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
           <div className="text-[10px] uppercase font-bold text-gray-500 px-3 py-2 tracking-widest">Global Navigation</div>
           
           <button onClick={() => performAction("/dashboard")} className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors group">
              <Terminal size={18} className="text-gray-400 group-hover:text-[var(--neon-green)] transition-colors" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-[var(--neon-green)] transition-colors">Phoenix Operations Dashboard</div>
                <div className="text-xs text-gray-500 font-mono">Launch cloud scans, terminal emulators, OSINT</div>
              </div>
           </button>

           <button onClick={() => performAction("/ctf")} className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors group">
              <Cpu size={18} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Elite CTF Cyber Lab</div>
                <div className="text-xs text-gray-500 font-mono">Crypto, Web Payloads, Regex automation</div>
              </div>
           </button>

           <button onClick={() => performAction("/cve")} className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors group">
              <ShieldAlert size={18} className="text-gray-400 group-hover:text-red-400 transition-colors" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">NVD Vulnerability Database</div>
                <div className="text-xs text-gray-500 font-mono">Search modern CVEs and zero-days real-time</div>
              </div>
           </button>

           <button onClick={() => performAction("/ai")} className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors group">
              <Globe size={18} className="text-gray-400 group-hover:text-[var(--cyber-blue)] transition-colors" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-[var(--cyber-blue)] transition-colors">DeepSeek AI Pentest Assistant</div>
                <div className="text-xs text-gray-500 font-mono">Generate EN/ID reports automatically</div>
              </div>
           </button>

           <div className="text-[10px] uppercase font-bold text-gray-500 px-3 pt-6 pb-2 tracking-widest">Quick Actions (Mockup)</div>
           <div className="flex items-center gap-4 px-4 py-3 opacity-50 cursor-not-allowed">
              <Crosshair size={18} className="text-gray-600" />
              <div>
                <div className="text-sm font-bold text-gray-500 line-through">Run Port Scan on uber.com</div>
                <div className="text-xs text-gray-600 font-mono">Action requires target definition</div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between text-xs text-gray-500 font-mono">
          <div className="flex gap-4">
             <span className="flex items-center gap-1"><kbd className="bg-[#222] px-1.5 py-0.5 rounded">↑</kbd><kbd className="bg-[#222] px-1.5 py-0.5 rounded">↓</kbd> to navigate</span>
             <span className="flex items-center gap-1"><kbd className="bg-[#222] px-1.5 py-0.5 rounded">↵</kbd> to select</span>
          </div>
          <div className="text-[var(--neon-green)]/50">Phoenix Omni-Search v1.0</div>
        </div>
      </div>
    </div>
  );
}
