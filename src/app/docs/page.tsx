import { FileText, Terminal, Box, Play } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="container mx-auto px-6 py-20 min-h-[90vh]">
      <div className="max-w-4xl mx-auto text-left">
        
        <div className="mb-14">
           <h1 className="text-4xl font-mono font-bold text-white mb-4 flex items-center gap-4">
              <FileText className="text-[var(--neon-green)]" size={36}/> Platform Documentation
           </h1>
           <p className="text-gray-400 font-sans text-lg">Official Knowledge Base for Phoenix CyberSec Enterprise.</p>
        </div>

        <div className="space-y-12">
           
           <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold font-mono text-white mb-4 border-b border-[rgba(255,255,255,0.05)] pb-4 flex items-center gap-3">
                 <Terminal className="text-[var(--cyber-blue)]" /> 1. Getting Started: The CLI Worker
              </h2>
              <div className="text-gray-400 text-sm leading-loose space-y-4 font-sans">
                 <p>
                    Phoenix OS is natively a <strong>headless cloud-orchestration</strong> engine. While functions like Cryptanalysis and AI are processed instantly entirely via Vercel serverless bounds, heavy localized infrastructure payloads (e.g. <code>Nmap</code>, <code>Subfinder</code>, Native Exploits) require a linked Execution Node.
                 </p>
                 <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl font-mono text-[var(--neon-green)] shadow-inner">
                    python3 phoenix_cli.py --connect-bridge
                 </div>
                 <p>
                    Execute the above command in your VPS, AWS EC2, or local Kali Linux machine. This will instantiate a bridging Daemon and provide you with a <strong>Sync Token</strong> (e.g., <code>PHX-XRDP-...</code>). You must enter this token in the web interface to unlock all Enterprise capabilities.
                 </p>
              </div>
           </section>

           <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold font-mono text-white mb-4 border-b border-[rgba(255,255,255,0.05)] pb-4 flex items-center gap-3">
                 <Box className="text-purple-400" /> 2. DeepSeek AI Cryptanalysis Integration
              </h2>
              <div className="text-gray-400 text-sm leading-loose space-y-4 font-sans">
                 <p>
                    The Cyberpunk Crypto Lab orchestrates the deployment of 50+ localized and algorithmic ciphers. We merge native WebCrypto specifications directly with intelligent Neural fallback parsing via DeepSeek-R1.
                 </p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Native Execution:</strong> Algorithms that are mathematically valid (e.g. Base64, Hex, SHA-256) evaluate instantaneously on your hardware through Web APIs.</li>
                    <li><strong>AI Auto-Encoding:</strong> Advanced constraints (e.g. <code>Enigma Machine</code>, <code>ChaCha20</code>) are captured gracefully and evaluated by our explicit System Prompts enforcing strict Output Determinism from the AI.</li>
                 </ul>
              </div>
           </section>

           <section className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold font-mono text-white mb-4 border-b border-[rgba(255,255,255,0.05)] pb-4 flex items-center gap-3">
                 <Play className="text-red-400" /> 3. Bug Bounty Scope Templates
              </h2>
              <div className="text-gray-400 text-sm leading-loose space-y-4 font-sans">
                 <p>
                    In the AI Pentest Generator, selecting the <strong>HackerOne Scope</strong> or <strong>Bugcrowd VRT</strong> format explicitly overrides the markdown rendering engine to mimic enterprise reporting constraints. Always utilize the Export Blob (<code>.MD</code>, <code>.HTML</code>) functionalities to save structured findings directly to local memory before execution boundaries expire.
                 </p>
              </div>
           </section>

        </div>
      </div>
    </div>
  );
}
