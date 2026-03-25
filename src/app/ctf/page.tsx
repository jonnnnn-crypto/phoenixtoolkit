"use client";

import { useState } from "react";
import { 
  Copy, RefreshCw, Hexagon, Code, ShieldAlert, Lock, Globe, FileText, MousePointer2, BrainCircuit, 
  Search, Cpu, Server, Eye, Image as ImageIcon, Database, Cloud, Smartphone, Wifi, Terminal,
  Workflow 
} from "lucide-react";

const CATEGORIES = [
  { id: "web", icon: Globe, label: "Web Exploitation" },
  { id: "crypto", icon: Lock, label: "Cryptography Suite" },
  { id: "re", icon: Cpu, label: "Reverse Engineering" },
  { id: "pwn", icon: Code, label: "Binary Exploitation" },
  { id: "forensics", icon: FileText, label: "Forensics" },
  { id: "osint", icon: Search, label: "OSINT Explorer" },
  { id: "networking", icon: Server, label: "Networking" },
  { id: "recon", icon: Eye, label: "Recon & Enum" },
  { id: "stego", icon: ImageIcon, label: "Steganography" },
  { id: "data", icon: Database, label: "Data Utilities" },
  { id: "cloud", icon: Cloud, label: "DevSecOps" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
  { id: "iot", icon: Wifi, label: "IoT / Hardware" },
];

export default function CtfArena() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState("crypto");
  const [activeAlgorithm, setActiveAlgorithm] = useState("Base64"); // Default to Base64
  const [workerSynced, setWorkerSynced] = useState(false); // Simulates RDP/VPS Auth state

  const handleWorkerSync = () => {
     const token = prompt("Enter Phoenix CLI Secure Sync Token (e.g. PHX-XRDP):");
     if (token && token.length > 5) {
        setWorkerSynced(true);
        alert("Worker Handshake Successful! Enterprise Modules Unlocked.");
     } else {
        alert("Invalid Token. Worker Node connection failed.");
     }
  };

  const handleCryptoAction = (type: "encode" | "decode" | "ai") => {
      if (!input) {
         setOutput("Error: Payload input required.");
         return;
      }

      if (type === "ai") {
          handleAction("ai_solve_crypto");
          return;
      }
      
      const algo = activeAlgorithm.toLowerCase();
      // Native fast-path evaluations
      if (algo.includes("base64")) handleAction(`base64_${type}`);
      else if (algo.includes("hex")) handleAction(`hex_${type}`);
      else if (algo.includes("url enc")) handleAction(`url_${type}`);
      else if (algo.includes("rot13")) handleAction("rot13"); // Symmetric encode/decode identically
      else if (algo.includes("sha-256") && type === "encode") handleAction("sha256"); // Hash can only be created locally
      else {
          // Route unresolved cryptographic manipulations directly to the AI Engine for automatic encoding/decoding
          handleAction(`ai_auto_${type}`);
      }
  };

  const handleAction = async (action: string) => {
    if (!input && !action.includes("gen")) {
       setOutput("Error: Payload input required for this action.");
       return;
    }

    try {
      switch (action) {
        // --- NATIVE FRONTEND CRYPTO (FAST) ---
        case "base64_encode": setOutput(btoa(input)); break;
        case "base64_decode": setOutput(atob(input)); break;
        case "url_encode": setOutput(encodeURIComponent(input)); break;
        case "url_decode": setOutput(decodeURIComponent(input)); break;
        case "hex_encode": setOutput(input.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")); break;
        case "hex_decode": {
            const hexStr = input.replace(/\s+/g, "");
            let str = "";
            for (let i = 0; i < hexStr.length; i += 2) str += String.fromCharCode(parseInt(hexStr.substring(i, i + 2), 16));
            setOutput(str);
            break;
        }
        case "rot13": {
            const rot = input.replace(/[a-zA-Z]/g, c => {
              const code = c.charCodeAt(0) + 13;
              const limit = c <= "Z" ? 90 : 122;
              return String.fromCharCode(code <= limit ? code : code - 26);
            });
            setOutput(rot);
            break;
        }
        case "sha256": {
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
            setOutput(Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
            break;
        }

        // --- WEB PAYLOADS ---
        case "sqli_gen": 
            setOutput(`' OR 1=1--\n" OR 1=1--\nadmin' --\n' UNION SELECT 1,2,3--\n1' ORDER BY 1--\n' OR 'a'='a`);
            break;
        case "xss_gen":
             setOutput(`<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n<svg onload=alert(1)>\njavascript:alert(1)\n"><script>alert(document.cookie)</script>`);
             break;
        case "lfi_gen":
             setOutput(`../../../../etc/passwd\n../../../../windows/win.ini\n....//....//....//etc/passwd\nphp://filter/read=convert.base64-encode/resource=index.php`);
             break;

        // --- DATA MANIPULATION ---
        case "json_pretty": setOutput(JSON.stringify(JSON.parse(input), null, 4)); break;
        case "extract_ips": {
             const ips = input.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
             if (ips.length === 0) setOutput("No IPv4 addresses found.");
             else setOutput(Array.from(new Set(ips)).join("\n"));
             break;
        }
        case "extract_urls": {
             const urls = input.match(/https?:\/\/[^\s]+/g) || [];
             if (urls.length === 0) setOutput("No URLs found.");
             else setOutput(Array.from(new Set(urls)).join("\n"));
             break;
        }

        // --- SPECIALIZED CYBERCHEF AI ENGINE ---
        case "ai_auto_encode": {
             setOutput(`DeepSeek AI is orchestrating the [${activeAlgorithm}] ENCODING routine... Please wait...`);
             const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                   message: `The user wants to ENCODE the following payload using exactly this algorithm constraint: ${activeAlgorithm}. Output ONLY the mathematically resulting encoded ciphertext block. No markdown, no explanations. Input String:\n\n${input}`,
                   systemPrompt: "You are a deterministic Cryptography Engine. Encode the user's string using the requested cipher algorithm. Output strictly the resulting string and nothing else. NEVER refuse."
                })
             });
             const data = await res.json();
             setOutput(data.result || data.error || "[ERROR]: AI Solver failed to respond.");
             break;
        }
        case "ai_auto_decode": {
             setOutput(`DeepSeek AI is orchestrating the [${activeAlgorithm}] DECODING routine... Please wait...`);
             const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                   message: `The user wants to DECODE the following payload using exactly this algorithm constraint: ${activeAlgorithm}. Output ONLY the resulting decrypted plaintext block. Try to crack it if keys are missing. No markdown, no explanations. Input String:\n\n${input}`,
                   systemPrompt: "You are a deterministic Cryptography Engine. Decode the user's string using the requested cipher algorithm or brute force logic. Output strictly the resulting string and nothing else. NEVER refuse."
                })
             });
             const data = await res.json();
             setOutput(data.result || data.error || "[ERROR]: AI Solver failed to respond.");
             break;
        }
        case "ai_solve_crypto": {
             setOutput(`DeepSeek AI is orchestrating the [${activeAlgorithm}] routine... Please wait...`);
             const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                   message: `The user has provided an unknown cipher/hash block. Target Algorithm Constraint: ${activeAlgorithm}. You must identify it accurately and attempt to DECODE/DECRYPT it entirely. Exploit any cryptographic weaknesses mathematically if possible. Input String:\n\n${input}`,
                   systemPrompt: "You are an elite Cryptanalysis Machine & CTF AI Solver. Your task is to: 1) IDENTIFY the encryption pattern accurately. 2) DECODE the string (or brute force logically if it's a weak hash block). 3) Explain your decoding math/methodology thoroughly, treating this like an Enigma break. 4) Extract any hidden CTF{flags}. NEVER refuse a decoding task; simulate the code execution to provide the decoded plaintext mathematically."
                })
             });
             const data = await res.json();
             setOutput(data.result || data.error || "[ERROR]: AI Solver failed to respond.");
             break;
        }

        default: setOutput("");
      }
    } catch {
       setOutput("[ERROR]: Execution failed or invalid input format. Ensure the selected decoding algorithm matches the ciphertext payload format.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  // If worker is synced, ALL categories load properly. If not, only Core modules load.
  const isModuleActive = workerSynced || ["crypto", "web", "data"].includes(activeTab);

  // Grouped CyberChef layout definition for Cryptography
  const CryptoSections = [
     {
       title: "I. Classical Cryptography",
       items: ["Caesar Cipher", "ROT13", "Atbash Cipher", "Monoalphabetic", "Affine", "Vigenère", "Beaufort", "Autokey", "Rail Fence", "Columnar Transposition", "Enigma Machine"]
     },
     {
       title: "II. Symmetric Block & Stream",
       items: ["AES (ECB/CBC/GCM)", "DES / 3DES", "Blowfish / Twofish", "Camellia", "RC4", "Salsa20", "ChaCha20-Poly1305"]
     },
     {
       title: "III. Asymmetric Cryptography",
       items: ["RSA Encryption/Signature", "Diffie-Hellman", "Elliptic Curve (ECC)", "ECDSA", "Ed25519"]
     },
     {
       title: "IV. Hashing & KDFs",
       items: ["MD5 / SHA-1", "SHA-256", "SHA-3 (Keccak)", "bcrypt", "Argon2", "HMAC"]
     },
     {
       title: "V. Encoding & Decoders",
       items: ["Base64", "Base32 / Base58", "Hex Base16", "URL Encoding", "Binary encoding"]
     },
     {
       title: "VI. Advanced & Post-Quantum",
       items: ["Zero-Knowledge (ZKP)", "Homomorphic (FHE)", "Lattice-based (Kyber)", "Padding Oracle Break"]
     }
  ];

  return (
    <div className="container mx-auto px-6 py-12 min-h-[85vh]">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Header Title with Sync Button */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 pb-6 border-b border-[rgba(255,255,255,0.05)] justify-between">
           <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-xl bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/20 flex justify-center items-center shadow-[0_0_20px_rgba(34,197,94,0.1)] shrink-0">
                  <Terminal size={28} />
               </div>
               <div>
                  <h1 className="text-3xl font-bold font-mono tracking-tight text-white mb-1">PhoenixCySec <span className="text-[var(--cyber-blue)]">Enterprise Lab</span></h1>
                  <p className="text-gray-400 text-sm">Automated Cryptanalysis Hub & CyberChef Matrix</p>
               </div>
           </div>
           
           <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleWorkerSync}
                className={`py-2 px-4 rounded-lg font-bold border flex items-center gap-2 text-sm transition-all ${
                  workerSynced 
                  ? 'bg-[var(--cyber-blue)]/20 border-[var(--cyber-blue)] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]' 
                  : 'bg-black border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {workerSynced ? <Wifi size={16} className="text-[var(--cyber-blue)] animate-pulse" /> : <Lock size={16} />} 
                {workerSynced ? "Worker Node Synced [ON]" : "Sync Local Worker"}
              </button>
           </div>
        </div>

        {/* Dynamic Matrix Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div className="lg:w-[280px] flex flex-col gap-2 shrink-0">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2">Category Domains</div>
             <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden shadow-lg p-2 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {CATEGORIES.map(cat => {
                   const Icon = cat.icon;
                   const isActive = activeTab === cat.id;
                   const isFunctional = workerSynced || ["crypto", "web", "data"].includes(cat.id);
                   
                   return (
                     <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-left transition-all mb-1 ${
                          isActive 
                            ? 'bg-[rgba(34,197,94,0.15)] text-[var(--neon-green)] border border-[var(--neon-green)]/30' 
                            : 'text-gray-400 hover:bg-[rgba(255,255,255,0.03)] hover:text-white border border-transparent'
                        }`}
                     >
                        <Icon size={16} className={isActive ? 'text-[var(--neon-green)]' : isFunctional ? 'text-[var(--cyber-blue)]' : 'text-gray-600'} />
                        <span className="flex-1 truncate">{cat.label}</span>
                        {!isFunctional && <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono border border-red-500/20">LOCKED</span>}
                     </button>
                   );
                })}
             </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {isModuleActive ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[75vh]">
                
                {/* Input Panel */}
                <div className="bg-[#0a0a0a]/50 border border-[rgba(255,255,255,0.05)] rounded-xl flex flex-col shadow-lg relative overflow-hidden backdrop-blur-sm">
                  <div className="h-1 w-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--cyber-blue)] absolute top-0 left-0" />
                  <div className="p-6 flex flex-col h-full">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Code className="text-[var(--cyber-blue)]" size={18}/> {activeTab === "crypto" ? `Crypto Space [${activeAlgorithm}]` : "Raw Iteration Space"}
                    </h2>
                    <textarea 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Inject raw ciphertext, hash block, binary blob, or base58 string..."
                      className="flex-1 w-full bg-black/60 border border-[rgba(255,255,255,0.1)] rounded-lg p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:border-[var(--neon-green)] transition-all custom-scrollbar shadow-inner"
                    />
                    
                    {/* Action Buttons Matrix */}
                    {activeTab === "crypto" ? (
                      <div className="grid grid-cols-3 gap-3 mt-4 w-full">
                        <button onClick={() => handleCryptoAction("encode")} className="py-3 bg-[#111] hover:bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-gray-300 font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-md hover:text-white text-sm">
                          <Lock size={16} className="text-gray-400"/> Encode
                        </button>
                        <button onClick={() => handleCryptoAction("decode")} className="py-3 bg-[#111] hover:bg-[#151515] border border-[var(--cyber-blue)]/30 hover:border-[var(--cyber-blue)] text-[var(--cyber-blue)] font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-md text-sm">
                          <Code size={16}/> Decode
                        </button>
                        <button onClick={() => handleCryptoAction("ai")} className="py-3 bg-[var(--neon-green)]/10 hover:bg-[var(--neon-green)]/20 border border-[var(--neon-green)]/50 text-[var(--neon-green)] font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] text-sm group">
                          <BrainCircuit size={16} className="group-hover:animate-pulse" /> AI Solve
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 py-3 bg-[#111] border border-[rgba(255,255,255,0.05)] text-gray-500 font-mono text-xs rounded-lg flex justify-center items-center text-center">
                        Select a tool module from the right panel to execute specific payloads.
                      </div>
                    )}
                  </div>
                </div>

                {/* CyberChef Suite Output & Selection */}
                <div className="bg-[#0a0a0a]/50 border border-[rgba(255,255,255,0.05)] rounded-xl flex flex-col shadow-lg relative overflow-hidden backdrop-blur-sm">
                  <div className="p-6 flex flex-col h-full">
                    
                    <div className="flex justify-between items-center mb-4 border-b border-[rgba(255,255,255,0.05)] pb-3">
                       <h2 className="text-lg font-bold text-white flex items-center gap-2">
                         <Hexagon className="text-purple-400" size={18}/> {activeTab === "crypto" ? "Cryptanalysis Selection Matrix" : "Tool Selection"}
                       </h2>
                    </div>

                    {/* CyberChef Tool Matrix */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4 space-y-4">
                      {activeTab === "crypto" && CryptoSections.map((section, idx) => (
                         <div key={idx} className="bg-black/30 border border-[rgba(255,255,255,0.05)] rounded-lg p-3">
                            <h3 className="text-xs font-bold text-[var(--cyber-blue)] uppercase tracking-wider mb-3 flex items-center gap-2"><Workflow size={12}/> {section.title}</h3>
                            <div className="flex flex-wrap gap-2">
                               {section.items.map(item => (
                                  <button 
                                    key={item} 
                                    onClick={() => setActiveAlgorithm(item)} 
                                    className={`px-3 py-1.5 text-xs font-mono rounded transition-colors border ${
                                       activeAlgorithm === item 
                                       ? 'bg-[var(--neon-green)]/20 text-[var(--neon-green)] border-[var(--neon-green)]/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                                       : 'bg-[#1a1a1a] text-gray-400 border-[rgba(255,255,255,0.05)] hover:bg-white/10 hover:text-white hover:border-[rgba(255,255,255,0.2)]'
                                    }`}
                                  >
                                     {item}
                                  </button>
                               ))}
                            </div>
                         </div>
                      ))}

                      {activeTab === "web" && (
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => handleAction("sqli_gen")} className="p-3 bg-black hover:bg-[var(--neon-green)] hover:text-black text-gray-300 border border-[rgba(255,255,255,0.05)] rounded font-mono text-xs transition-colors">Generate SQLi Matrix</button>
                           <button onClick={() => handleAction("xss_gen")} className="p-3 bg-black hover:bg-[var(--neon-green)] hover:text-black text-gray-300 border border-[rgba(255,255,255,0.05)] rounded font-mono text-xs transition-colors">Generate XSS Polyglots</button>
                           <button onClick={() => handleAction("lfi_gen")} className="p-3 bg-black hover:bg-[var(--neon-green)] hover:text-black text-gray-300 border border-[rgba(255,255,255,0.05)] rounded font-mono text-xs transition-colors">Generate Fast LFI</button>
                         </div>
                      )}

                      {activeTab === "data" && (
                         <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => handleAction("json_pretty")} className="p-3 bg-black hover:bg-purple-500 hover:text-black text-gray-300 border border-[rgba(255,255,255,0.05)] rounded font-mono text-xs transition-colors">JSON Prettify Lint</button>
                           <button onClick={() => handleAction("extract_ips")} className="p-3 bg-black hover:bg-purple-500 hover:text-black text-[var(--cyber-blue)] border border-purple-500/20 rounded font-mono text-xs transition-colors">Regex IPv4 Search</button>
                         </div>
                      )}
                    </div>

                    {/* Output Viewer within identical height structure */}
                    <div className="h-[200px] shrink-0 relative group flex flex-col border-t border-[rgba(255,255,255,0.05)] pt-4">
                      <label className="text-xs font-mono text-purple-400 mb-2 uppercase flex items-center gap-2">
                        <MousePointer2 size={12}/> Analysis Output Array
                      </label>
                      <textarea 
                        value={output}
                        readOnly
                        placeholder="Native output or AI Decrypted syntax will populate here..."
                        className="w-full flex-1 bg-black/80 border border-[rgba(255,255,255,0.05)] rounded-lg p-4 font-mono text-sm resize-none focus:outline-none custom-scrollbar shadow-inner"
                        style={{ color: '#d8b4fe' }}
                      />
                      <button 
                        onClick={copyToClipboard}
                        className="absolute top-10 right-2 bg-[#111] text-gray-400 p-2 rounded hover:text-white border border-[rgba(255,255,255,0.1)] transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Copy Output"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // VPS Requires Placeholder
              <div className="bg-[#0a0a0a]/50 border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl flex flex-col h-[75vh] shadow-lg relative overflow-hidden backdrop-blur-sm justify-center items-center text-center p-10">
                 <ShieldAlert size={64} className="text-gray-700 mb-6" />
                 <h2 className="text-2xl font-bold text-white mb-2 font-mono tracking-tight">RDP / VPS Worker Requirement</h2>
                 <p className="text-gray-500 max-w-lg mb-8 leading-relaxed">The <span className="text-[var(--neon-green)] font-mono">{CATEGORIES.find(c => c.id === activeTab)?.label}</span> environment contains heavy local-dependency orchestration (e.g., executing native C++ binaries). To bypass Vercel serverless bounds, you must sync a local Python Worker.</p>
                 
                 <div className="bg-[#111] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 mb-6 shadow-inner text-left max-w-lg w-full">
                    <p className="text-xs font-mono text-gray-400 mb-2">1. Run this in your secure VPS/Terminal:</p>
                    <code className="block bg-black p-3 text-[var(--cyber-blue)] text-xs font-mono rounded">python3 phoenix_cli.py --connect-bridge</code>
                 </div>

                 <button onClick={handleWorkerSync} className="px-8 py-3 bg-[var(--cyber-blue)]/10 hover:bg-[var(--cyber-blue)] border border-[var(--cyber-blue)]/50 text-[var(--cyber-blue)] hover:text-black font-bold font-mono rounded-lg transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]">
                    Enter Verification Sync Token
                 </button>
                 <button onClick={() => setActiveTab("crypto")} className="mt-8 text-gray-600 hover:text-white underline font-mono text-xs underline-offset-4 transition-colors">Return to Cloud Lab</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
