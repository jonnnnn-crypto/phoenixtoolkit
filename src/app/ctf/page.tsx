"use client";

import { useState } from "react";
import CryptoJS from "crypto-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BrainCircuit, Copy, RefreshCw, ChevronRight, Lock, Hash, Code, Shuffle,
  Globe, Activity, Shield, Eye, Cpu, Terminal, Wifi, FileText, Layers
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Op = {
  id: string; label: string; category: string;
  hasKey?: boolean; keyPlaceholder?: string;
  encode: (input: string, key?: string) => string;
  decode: (input: string, key?: string) => string;
};

// ─── CRYPTO OPERATIONS ───────────────────────────────────────────────────────
const CRYPTO_OPS: Op[] = [
  { id:"base64", label:"Base64", category:"Encoding",
    encode:(i)=>btoa(unescape(encodeURIComponent(i))),
    decode:(i)=>decodeURIComponent(escape(atob(i.trim()))) },
  { id:"hex", label:"Hex (Base16)", category:"Encoding",
    encode:(i)=>Array.from(new TextEncoder().encode(i)).map(b=>b.toString(16).padStart(2,"0")).join(""),
    decode:(i)=>new TextDecoder().decode(new Uint8Array((i.replace(/\s+/g,"").match(/.{2}/g)||[]).map(b=>parseInt(b,16)))) },
  { id:"binary", label:"Binary", category:"Encoding",
    encode:(i)=>Array.from(new TextEncoder().encode(i)).map(b=>b.toString(2).padStart(8,"0")).join(" "),
    decode:(i)=>new TextDecoder().decode(new Uint8Array(i.trim().split(/\s+/).map(b=>parseInt(b,2)))) },
  { id:"url", label:"URL Encode", category:"Encoding",
    encode:(i)=>encodeURIComponent(i), decode:(i)=>decodeURIComponent(i) },
  { id:"rot13", label:"ROT13", category:"Classical",
    encode:(i)=>i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b);}),
    decode:(i)=>i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b);}) },
  { id:"caesar", label:"Caesar Cipher", category:"Classical", hasKey:true, keyPlaceholder:"Shift (default 13)",
    encode:(i,k="13")=>{const s=((parseInt(k)||13)%26+26)%26;return i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+s)%26)+b);});},
    decode:(i,k="13")=>{const s=((26-((parseInt(k)||13)%26+26)%26)%26+26)%26;return i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(((c.charCodeAt(0)-b+s)%26)+b);});} },
  { id:"atbash", label:"Atbash", category:"Classical",
    encode:(i)=>i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(b+25-(c.charCodeAt(0)-b));}),
    decode:(i)=>i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;return String.fromCharCode(b+25-(c.charCodeAt(0)-b));}) },
  { id:"vigenere", label:"Vigenère", category:"Classical", hasKey:true, keyPlaceholder:"Key (letters)",
    encode:(i,k="key")=>{const K=(k||"key").replace(/[^a-zA-Z]/g,"").toUpperCase()||"KEY";let ki=0;return i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;const sh=((c.charCodeAt(0)-b+K.charCodeAt(ki%K.length)-65)%26+26)%26;ki++;return String.fromCharCode(sh+b);});},
    decode:(i,k="key")=>{const K=(k||"key").replace(/[^a-zA-Z]/g,"").toUpperCase()||"KEY";let ki=0;return i.replace(/[a-zA-Z]/g,c=>{const b=c<="Z"?65:97;const sh=((c.charCodeAt(0)-b-(K.charCodeAt(ki%K.length)-65)+26)%26);ki++;return String.fromCharCode(sh+b);});} },
  { id:"md5", label:"MD5", category:"Hashing",
    encode:(i)=>CryptoJS.MD5(i).toString(), decode:()=>"[Hash is one-way — use AI Solver]" },
  { id:"sha1", label:"SHA-1", category:"Hashing",
    encode:(i)=>CryptoJS.SHA1(i).toString(), decode:()=>"[Hash is one-way — use AI Solver]" },
  { id:"sha256", label:"SHA-256", category:"Hashing",
    encode:(i)=>CryptoJS.SHA256(i).toString(), decode:()=>"[Hash is one-way — use AI Solver]" },
  { id:"sha512", label:"SHA-512", category:"Hashing",
    encode:(i)=>CryptoJS.SHA512(i).toString(), decode:()=>"[Hash is one-way — use AI Solver]" },
  { id:"hmac", label:"HMAC-SHA256", category:"Hashing", hasKey:true, keyPlaceholder:"Secret Key",
    encode:(i,k="key")=>CryptoJS.HmacSHA256(i,k||"key").toString(), decode:()=>"[HMAC — one-way]" },
  { id:"aes", label:"AES-256 (CBC)", category:"Symmetric", hasKey:true, keyPlaceholder:"Passphrase",
    encode:(i,k="phoenix")=>CryptoJS.AES.encrypt(i,k||"phoenix").toString(),
    decode:(i,k="phoenix")=>{try{return CryptoJS.AES.decrypt(i,k||"phoenix").toString(CryptoJS.enc.Utf8)||"[Wrong key?]";}catch{return "[Decryption failed]";}} },
  { id:"des", label:"DES", category:"Symmetric", hasKey:true, keyPlaceholder:"Passphrase",
    encode:(i,k="phoenix")=>CryptoJS.DES.encrypt(i,k||"phoenix").toString(),
    decode:(i,k="phoenix")=>{try{return CryptoJS.DES.decrypt(i,k||"phoenix").toString(CryptoJS.enc.Utf8)||"[Wrong key?]";}catch{return "[Decryption failed]";}} },
  { id:"rc4", label:"RC4", category:"Symmetric", hasKey:true, keyPlaceholder:"Key",
    encode:(i,k="phoenix")=>CryptoJS.RC4.encrypt(i,k||"phoenix").toString(),
    decode:(i,k="phoenix")=>{try{return CryptoJS.RC4.decrypt(i,k||"phoenix").toString(CryptoJS.enc.Utf8)||"[Failed]";}catch{return "[Decryption failed]";}} },
  { id:"morse", label:"Morse Code", category:"Utilities",
    encode:(i)=>{const M:Record<string,string>={A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",6:"-....",7:"--...",8:"---..",9:"----."};return i.toUpperCase().split("").map(c=> c===" " ? " / " : M[c]||"?").join(" ");},
    decode:(i)=>{const M:Record<string,string>={".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"};return i.split(" / ").map(w=>w.trim().split(" ").map(c=>M[c]||"?").join("")).join(" ");} },
  { id:"reverse", label:"Reverse String", category:"Utilities",
    encode:(i)=>i.split("").reverse().join(""), decode:(i)=>i.split("").reverse().join("") },
];

const CRYPTO_CATEGORIES = [...new Set(CRYPTO_OPS.map(o=>o.category))];
const CAT_ICONS:Record<string,React.ReactNode>={
  "Encoding":<Code size={12}/>, "Classical":<Shuffle size={12}/>,
  "Hashing":<Hash size={12}/>, "Symmetric":<Lock size={12}/>, "Utilities":<Globe size={12}/>
};

// ─── CTF CHALLENGE MODULE DEFINITIONS ────────────────────────────────────────
const CTF_MODULES = [
  { id:"crypto", label:"Cryptography", icon: <Lock size={15}/>, color:"text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id:"web",    label:"Web",          icon: <Globe size={15}/>, color:"text-green-400 border-green-500/30 bg-green-500/10" },
  { id:"for",    label:"Forensics",    icon: <FileText size={15}/>, color:"text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  { id:"rev",    label:"Reverse Eng",  icon: <Cpu size={15}/>, color:"text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { id:"pwn",    label:"Pwn / Binary", icon: <Terminal size={15}/>, color:"text-red-400 border-red-500/30 bg-red-500/10" },
  { id:"osint",  label:"OSINT",        icon: <Eye size={15}/>, color:"text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id:"stego",  label:"Steganography",icon: <Layers size={15}/>, color:"text-pink-400 border-pink-500/30 bg-pink-500/10" },
  { id:"misc",   label:"Misc",         icon: <Wifi size={15}/>, color:"text-gray-400 border-gray-500/30 bg-gray-500/10" },
];

// Non-crypto modules: info + tool descriptions (cloud/AI proxied tools)
const MODULE_TOOLS: Record<string, {name:string; desc:string; prompt:string}[]> = {
  web: [
    { name:"SQLi Payload Gen", desc:"Generate SQL injection payloads for various databases.", prompt:"Generate a comprehensive list of SQL injection payloads for MySQL, PostgreSQL and MSSQL. Format by category." },
    { name:"XSS Polyglot Kit", desc:"Multi-context Cross-Site Scripting bypass strings.", prompt:"Generate 20 advanced XSS polyglot payloads covering HTML, JS, SVG, CSS and attribute contexts. Include filter bypasses." },
    { name:"LFI/Path Traversal", desc:"Local File Inclusion and traversal wordlists.", prompt:"List advanced LFI path traversal payloads including encoding bypasses and PHP stream wrappers (php://filter, zip://, etc.)" },
    { name:"SSTI Payload Set", desc:"Server-side template injection payloads.", prompt:"Generate SSTI payloads for Jinja2, Twig, Freemarker, Smarty, and Velocity. Include RCE chains." },
    { name:"SSRF Bypass Kit", desc:"Server-Side Request Forgery bypass techniques.", prompt:"List SSRF bypass techniques including DNS rebinding, URL schemes, IP obfuscation, and cloud metadata endpoints (AWS/GCP/Azure)." },
    { name:"JWT Forgery Notes", desc:"JWT vulnerability analysis and exploitation.", prompt:"Explain JWT vulnerabilities: alg:none attack, RS256→HS256 confusion, weak secret brute force, and kid injection. Provide PoC." },
  ],
  for: [
    { name:"File Signature DB", desc:"Magic bytes reference for common file types.", prompt:"List file magic bytes/signatures for: JPEG, PNG, GIF, PDF, ZIP, ELF, PE, DOCX, SQLite, 7z, RDB (Redis), PcapNG. Format as a table." },
    { name:"Metadata Extractor", desc:"Analyze EXIF/metadata from file content.", prompt:"Explain all metadata fields that can be extracted from JPEG EXIF data and DOCX/PDF file metadata for forensic analysis." },
    { name:"Wireshark Filters", desc:"Common Wireshark display filter cheat sheet.", prompt:"List 30 essential Wireshark display filters for CTF forensics: HTTP credentials, DNS queries, TCP streams, malicious traffic signatures." },
    { name:"Steghide Patterns", desc:"Common steganography detection checklist.", prompt:"List tools and techniques to detect steganography in PNG, JPEG, WAV, and BMP files. Include LSB analysis, binwalk, stegsolve commands." },
    { name:"Memory Forensics", desc:"Volatility framework command reference.", prompt:"List essential Volatility 3 commands for Windows memory forensics CTF challenges: process listing, network connections, hash dumping, command history." },
    { name:"Log Analysis Cheat", desc:"Common log pattern analysis for forensics.", prompt:"List common patterns to look for in web server, Windows Event, and Syslog files when performing CTF forensics challenges." },
  ],
  rev: [
    { name:"GDB Quick Ref", desc:"GDB debugger essential commands.", prompt:"Create a GDB cheat sheet with 25 essential commands for reverse engineering CTF binaries. Include pwndbg-specific commands." },
    { name:"x86 Assembly Ref", desc:"x86/x64 instruction set quick reference.", prompt:"Create a compact x86 and x64 assembly instruction reference covering: data movement, arithmetic, control flow, and stack operations for CTF reverse engineering." },
    { name:"Anti-Debug Tricks", desc:"Common anti-debugging techniques in CTF.", prompt:"List common anti-debugging techniques found in CTF reverse engineering: IsDebuggerPresent, timing checks, exception-based, self-modifying code. Include bypass methods." },
    { name:"Packing Detection", desc:"Identify packed/obfuscated binaries.", prompt:"How to detect and unpack common binary packers: UPX, ASPack, Enigma Protector. Include entropy analysis, PE header analysis, and OEP-finding methods." },
    { name:"Python Decompiler", desc:"Decompile Python .pyc bytecode.", prompt:"Explain how to decompile Python .pyc bytecode files using uncompyle6, decompile3, and pycdc. Include handling of obfuscated Python bytecode." },
    { name:"Frida Hooks Guide", desc:"Dynamic instrumentation with Frida.", prompt:"Write Frida JavaScript hook templates for: intercepting function calls, modifying return values, dumping SSL keys, bypassing root detection. For CTF reverse engineering." },
  ],
  pwn: [
    { name:"Buffer Overflow 101", desc:"Stack overflow exploitation guide.", prompt:"Explain classic stack buffer overflow exploitation: finding offset, controlling EIP/RIP, ret2system, ret2libc. Include 64-bit considerations and GDB commands." },
    { name:"ROP Chain Builder", desc:"Return-Oriented Programming guide.", prompt:"Explain ROP chain construction for 64-bit Linux binaries: finding gadgets with ROPgadget/ropper, chaining syscalls, ret2plt, GOT overwrite. Include examples." },
    { name:"Format String Bugs", desc:"Format string vulnerability exploitation.", prompt:"How to exploit printf format string vulnerabilities: reading memory with %p/%x, arbitrary write with %n, getting libc addresses. Include 64-bit examples." },
    { name:"Heap Exploitation", desc:"Heap-based vulnerability techniques.", prompt:"Explain heap exploitation techniques for CTF: fastbin dup, unsafe unlink, tcache poisoning, house of force. Include gef/pwndbg commands for heap inspection." },
    { name:"pwntools Template", desc:"Boilerplate pwntools exploit script.", prompt:"Write a comprehensive pwntools Python boilerplate template for CTF pwn challenges covering: process/remote setup, ROP chain, format string, ret2libc patterns." },
    { name:"Shellcode Stubs", desc:"Linux x86/x64 shellcode reference.", prompt:"Provide x86 and x64 Linux shellcode stubs for: execve /bin/sh, reverse shell, staged shellcode loader. Include null-free variants for CTF challenges." },
  ],
  osint: [
    { name:"Google Dork Kit", desc:"Advanced Google search operator collection.", prompt:"Generate 30 powerful Google dork queries for OSINT: exposed config files, login panels, API keys in code, camera feeds, vulnerable Citrix/VPN, sensitive documents." },
    { name:"Username Recon", desc:"Cross-platform username enumeration.", prompt:"List tools and sites for username OSINT enumeration across platforms: Sherlock, Whatsmyname, social media searches. Include manual search tips for CTF OSINT challenges." },
    { name:"Wayback Machine", desc:"Historical web content analysis guide.", prompt:"Explain how to use archive.org Wayback Machine, CachedView, and timetravel.mementoweb.org for OSINT investigations and CTF challenges." },
    { name:"Social Media OSINT", desc:"Social platform investigation checklist.", prompt:"Create a social media OSINT checklist for Twitter/X, Instagram, LinkedIn, Reddit, and Facebook covering: metadata, reverse image search, geolocation, account history." },
    { name:"Email Intelligence", desc:"Email header and domain analysis guide.", prompt:"Explain email header analysis for OSINT: SMTP relay chains, IP extraction, SPF/DKIM validation, phishing indicators. Include tools: mxtoolbox, hunter.io." },
    { name:"Image Geolocation", desc:"Geolocate images using EXIF and visual cues.", prompt:"Explain image geolocation techniques for OSINT/CTF: EXIF GPS data, skyline recognition, street view matching, shadow angle analysis, language clues." },
  ],
  stego: [
    { name:"Image LSB Analysis", desc:"Least Significant Bit steganography detection.", prompt:"Explain LSB steganography in images: how it works, detection tools (zsteg, stegsolve, steghide), extraction in PNG/BMP/JPEG. Include Python example." },
    { name:"Audio Steganography", desc:"Hidden data in WAV/MP3 audio files.", prompt:"Explain audio steganography CTF techniques: spectrogram analysis (Sonic Visualiser), LSB in WAV, DTMF tones, hidden text in audio metadata. Include tools." },
    { name:"Text Steganography", desc:"Unicode/whitespace hidden message detection.", prompt:"Explain text-based steganography: Zero-Width Character detection, Unicode homoglyph substitution, whitespace steganography (Snow), binary in formatting." },
    { name:"Binwalk Cheatsheet", desc:"Binwalk commands for embedded file extraction.", prompt:"Create a comprehensive binwalk cheat sheet for CTF steganography: signature scan, extraction, entropy analysis, recursive extraction, carving hidden archives." },
    { name:"PDF Steganography", desc:"Hidden data in PDF files.", prompt:"Explain steganography techniques in CTF PDF challenges: hidden layers, invisible text, JavaScript payloads, embedded files, metadata. Include extraction commands." },
    { name:"PNG Chunk Analysis", desc:"PNG file structure and chunk inspection.", prompt:"Explain PNG file format, chunk structure (IHDR, IDAT, iTXt, tEXt, zTXt) and how to extract hidden data from PNG chunks using pngcheck and custom Python scripts." },
  ],
  misc: [
    { name:"Jail Escape Kit", desc:"Python/Bash jail escape techniques.", prompt:"List Python jail escape techniques (pyjail CTF): breaking out of restricted exec(), builtins manipulation, __class__ chain, audit hooks bypass. Include bash restricted shell escapes." },
    { name:"QR Code Tools", desc:"QR code decode and creation guide.", prompt:"Explain how to decode, repair, and analyze QR codes in CTF: zbar, zxing, manual Reed-Solomon fixing, micro QR, and QR variants (Aztec, DataMatrix)." },
    { name:"Git Forensics", desc:"Extracting data from Git repositories.", prompt:"Explain CTF Git forensics: recovering deleted commits (git log --all), stash inspection, dangling objects (git fsck), reflog analysis, packed objects extraction." },
    { name:"ZIP Cracking", desc:"Password-protected ZIP attack techniques.", prompt:"Explain ZIP attack methods for CTF: plaintext attack with bkcrack, dictionary attack with john/hashcat, ZipCrypto weakness, deflate compression analysis." },
    { name:"Base Convert Kit", desc:"Multi-base number conversion guide.", prompt:"Create a comprehensive base conversion cheat sheet for CTF: base2, base8, base10, base16, base32, base58, base64, base85/Ascii85, base91. Include online tools." },
    { name:"Regex CTF Tricks", desc:"Regular expressions for CTF pattern matching.", prompt:"Write 20 useful regex patterns for CTF challenges: flag extraction, hash identification, IP/URL parsing, credential extraction, file path matching. Include Python examples." },
  ],
};

export default function CtfArena() {
  // Module-level state (which CTF category)
  const [module, setModule] = useState("crypto");

  // Crypto sub-state
  const [selectedOp, setSelectedOp] = useState<Op>(CRYPTO_OPS[0]);
  const [cryptoCat, setCryptoCat] = useState("Encoding");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [key, setKey] = useState("");
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const [copied, setCopied] = useState(false);

  // AI state
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<{name:string;prompt:string}|null>(null);

  // ── CRYPTO HANDLERS ──────────────────────────────────────────────────────
  const runOp = (op:Op, m:"encode"|"decode", inp:string, k:string) => {
    if (!inp) { setOutput(""); return; }
    try { setOutput(m==="encode" ? op.encode(inp,k) : op.decode(inp,k)); }
    catch { setOutput("[Error] Invalid input or key."); }
  };
  const handleModeRun = (m:"encode"|"decode") => { setMode(m); runOp(selectedOp,m,input,key); };
  const handleOpSelect = (op:Op) => { setSelectedOp(op); setOutput(""); setKey(""); runOp(op,mode,input,key); };
  const handleInput = (v:string) => { setInput(v); runOp(selectedOp,mode,v,key); };
  const handleKey = (v:string) => { setKey(v); runOp(selectedOp,mode,input,v); };

  // ── AI HANDLER ───────────────────────────────────────────────────────────
  const handleAI = async (promptOverride?: string) => {
    const payload = promptOverride
      ? `${promptOverride}`
      : `Analyze and decode this ciphertext. Extract any CTF flags. Input:\n\n${aiInput}`;
    if (!payload.trim() && !aiInput.trim()) return;
    setAiLoading(true);
    setAiOutput("DeepSeek AI analyzing...");
    try {
      const res = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ 
          message: payload, 
          systemPrompt:"You are an elite CTF AI. Be explicit, deterministic, and concise. Provide direct answers." 
        })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setAiOutput(data.result || data.error || "[AI Error]");
      } else {
        const text = await res.text();
        setAiOutput(`[HTTP ${res.status}] ${res.statusText || "Server Error"}: ${text.slice(0, 80)}...`);
      }
    } catch (err: any) { 
      setAiOutput(`[Connection Error]: ${err.message || "Failed to reach AI engine"}`); 
    }
    finally { setAiLoading(false); }
  };

  const handleToolClick = (tool:{name:string;desc:string;prompt:string}) => {
    setActiveTool({name:tool.name, prompt:tool.prompt});
    setAiOutput("");
    setAiInput(`[${tool.name}] ${tool.desc}`);
  };

  const filteredCryptoOps = CRYPTO_OPS.filter(o=>o.category===cryptoCat);
  const currentModule = CTF_MODULES.find(m=>m.id===module)!;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-10">
      <div className="max-w-[1440px] mx-auto px-4">

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">CTF <span className="text-[var(--cyber-blue)]">Challenge Lab</span></h1>
            <p className="text-gray-500 text-xs mt-1 font-mono">8 challenge domains • crypto-js native ops • DeepSeek AI on demand</p>
          </div>
        </div>

        {/* ── MODULE TABS ──────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {CTF_MODULES.map(m => (
            <button key={m.id} onClick={()=>setModule(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                module===m.id ? m.color+" shadow-lg scale-[1.02]" : "text-gray-500 border-[rgba(255,255,255,0.06)] bg-[#0c0c0c] hover:text-gray-300 hover:border-[rgba(255,255,255,0.12)]"
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* ══ CRYPTO MODULE ══════════════════════════════════ */}
        {module==="crypto" && (
          <div>
            <div className="grid grid-cols-[200px_1fr_1fr] gap-4">
              {/* Operation sidebar */}
              <div className="flex flex-col gap-2">
                <div className="bg-[#0c0c0c] border border-[rgba(255,255,255,0.06)] rounded-xl p-2">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 mb-2">Category</p>
                  {CRYPTO_CATEGORIES.map(cat=>(
                    <button key={cat} onClick={()=>setCryptoCat(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 mb-0.5 transition-all ${cryptoCat===cat ? "bg-[var(--cyber-blue)]/10 text-[var(--cyber-blue)] border border-[var(--cyber-blue)]/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                      {CAT_ICONS[cat]||<Shield size={12}/>} {cat}
                    </button>
                  ))}
                </div>
                <div className="bg-[#0c0c0c] border border-[rgba(255,255,255,0.06)] rounded-xl p-2 flex-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 mb-2">Operations</p>
                  {filteredCryptoOps.map(op=>(
                    <button key={op.id} onClick={()=>handleOpSelect(op)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between mb-0.5 group transition-all ${selectedOp.id===op.id ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                      {op.label}
                      <ChevronRight size={10} className={`transition-opacity ${selectedOp.id===op.id?"opacity-100":"opacity-0 group-hover:opacity-40"}`}/>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="bg-[#0c0c0c] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Input</span>
                  <span className="text-[10px] text-gray-700">{input.length} chars</span>
                </div>
                <textarea value={input} onChange={e=>handleInput(e.target.value)}
                  placeholder="Paste ciphertext, plaintext, or hash..."
                  className="flex-1 bg-black/60 border border-[rgba(255,255,255,0.06)] rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-[var(--cyber-blue)]/50 min-h-[220px] leading-relaxed font-mono"/>
                {selectedOp.hasKey && (
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Key</label>
                    <input type="text" value={key} onChange={e=>handleKey(e.target.value)}
                      placeholder={selectedOp.keyPlaceholder||"Enter key..."}
                      className="w-full bg-black/40 border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[var(--cyber-blue)]/50 font-mono"/>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>handleModeRun("encode")}
                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode==="encode"?"bg-[var(--cyber-blue)] text-black shadow-[0_0_12px_rgba(59,130,246,0.4)]":"bg-[#1a1a1a] text-gray-400 border border-white/10 hover:border-[var(--cyber-blue)]/40"}`}>
                    Encode →
                  </button>
                  <button onClick={()=>handleModeRun("decode")}
                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode==="decode"?"bg-[var(--neon-green)] text-black shadow-[0_0_12px_rgba(59,130,246,0.4)]":"bg-[#1a1a1a] text-gray-400 border border-white/10 hover:border-[var(--neon-green)]/40"}`}>
                    ← Decode
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-600 font-mono">{selectedOp.label} / {mode.toUpperCase()}</span>
                </div>
              </div>

              {/* Output */}
              <div className="bg-[#0c0c0c] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Output</span>
                  <div className="flex gap-2">
                    <button onClick={()=>{setInput(output);runOp(selectedOp,mode,output,key);}} title="Use as input" className="p-1.5 rounded text-gray-600 hover:text-[var(--cyber-blue)] transition-all"><RefreshCw size={12}/></button>
                    <button onClick={()=>{navigator.clipboard.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),1500);}} title="Copy" className="p-1.5 rounded text-gray-600 hover:text-[var(--neon-green)] transition-all"><Copy size={12}/></button>
                  </div>
                </div>
                <div className={`flex-1 relative bg-black/60 border rounded-lg p-3 overflow-auto min-h-[220px] ${output?"border-[var(--neon-green)]/20":"border-[rgba(255,255,255,0.06)]"}`}>
                  {output ? <pre className="text-sm text-[var(--neon-green)] whitespace-pre-wrap break-all font-mono leading-relaxed">{output}</pre>
                    : <p className="text-gray-700 text-xs text-center absolute inset-0 flex items-center justify-center">Output appears here</p>}
                  {copied && <div className="absolute top-2 right-2 bg-[var(--neon-green)] text-black text-[10px] font-bold px-2 py-0.5 rounded">COPIED</div>}
                </div>
                <button onClick={()=>setAiInput(output||input)} className="py-1.5 border border-dashed border-[rgba(255,255,255,0.08)] rounded-lg text-[10px] text-gray-600 hover:text-[var(--cyber-blue)] hover:border-[var(--cyber-blue)]/30 transition-all">
                  → Send to AI Solver
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ OTHER CTF MODULES ══════════════════════════════ */}
        {module!=="crypto" && MODULE_TOOLS[module] && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {MODULE_TOOLS[module].map(tool=>(
                <button key={tool.name} onClick={()=>handleToolClick(tool)}
                  className={`text-left bg-[#0c0c0c] border rounded-xl p-4 transition-all hover:scale-[1.01] group ${activeTool?.name===tool.name ? `${currentModule.color} shadow-lg` : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"}`}>
                  <h3 className={`text-sm font-bold font-mono mb-1 transition-colors ${activeTool?.name===tool.name?"":"text-white group-hover:text-[var(--cyber-blue)]"}`}>{tool.name}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{tool.desc}</p>
                  <div className="mt-3 text-[10px] font-mono text-gray-700 group-hover:text-gray-500 transition-colors">Click to ask AI →</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ AI CRYPTANALYSIS PANEL (ALWAYS VISIBLE, AI ON BUTTON PRESS ONLY) ══ */}
        <div className="mt-4 bg-[#0c0c0c] border border-[var(--cyber-blue)]/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2">
              <BrainCircuit size={15} className={`text-[var(--cyber-blue)] ${aiLoading?"animate-pulse":""}`}/>
              <span className="text-xs font-bold text-white uppercase tracking-widest">DeepSeek AI Engine</span>
              <span className="text-[9px] bg-[var(--cyber-blue)]/10 text-[var(--cyber-blue)] border border-[var(--cyber-blue)]/20 px-2 py-0.5 rounded">Manual Trigger Only</span>
              {activeTool && <span className="text-[9px] text-gray-500 font-mono">— {activeTool.name}</span>}
            </div>
            <button onClick={()=>handleAI(activeTool?.prompt)} disabled={aiLoading||(!aiInput.trim()&&!activeTool)}
              className="bg-[var(--cyber-blue)] text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all disabled:opacity-40 flex items-center gap-2">
              {aiLoading ? <><Activity size={11} className="animate-spin"/> Running...</> : "Deploy AI →"}
            </button>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[rgba(255,255,255,0.04)]">
            <div>
              <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.03)]">
                <span className="text-[9px] text-gray-700 uppercase tracking-widest">Prompt / Ciphertext</span>
              </div>
              <textarea value={aiInput} onChange={e=>{setAiInput(e.target.value);setActiveTool(null);}}
                placeholder={"Paste ciphertext or hash here, OR click a tool card above.\n\nAI only fires when you press [Deploy AI] — never automatically."}
                className="w-full bg-transparent p-4 text-sm text-gray-300 resize-none focus:outline-none h-[500px] leading-relaxed font-mono"/>
            </div>
            <div>
              <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.03)]">
                <span className="text-[9px] text-gray-700 uppercase tracking-widest">AI Response</span>
              </div>
              <div className="p-4 h-[500px] overflow-auto custom-scrollbar">
                {aiLoading
                  ? <div className="flex items-center gap-2 text-gray-500 text-xs font-mono"><Activity size={12} className="animate-spin text-[var(--cyber-blue)]"/> Querying AI Engine...</div>
                  : aiOutput
                  ? <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: (p) => <h1 className="text-base font-bold text-white mt-3 mb-2" {...p}/>,
                          h2: (p) => <h2 className="text-sm font-bold text-[var(--cyber-blue)] mt-3 mb-1 border-b border-[rgba(255,255,255,0.08)] pb-1" {...p}/>,
                          h3: (p) => <h3 className="text-xs font-bold text-[var(--neon-green)] mt-2 mb-1" {...p}/>,
                          p: (p) => <p className="text-gray-300 mb-2 leading-relaxed" {...p}/>,
                          ul: (p) => <ul className="list-disc pl-4 mb-2 text-gray-300 space-y-0.5 marker:text-[var(--neon-green)]" {...p}/>,
                          ol: (p) => <ol className="list-decimal pl-4 mb-2 text-gray-300 space-y-0.5" {...p}/>,
                          li: (p) => <li className="text-gray-300" {...p}/>,
                          code: ({className, children, ...p}) => {
                            const isInline = !className;
                            return isInline
                              ? <code className="bg-black/60 text-[var(--neon-green)] px-1 rounded font-mono text-[10px] border border-white/10" {...p}>{children}</code>
                              : <code className="block bg-black/70 text-gray-300 p-2 rounded font-mono text-[10px] overflow-x-auto my-1 border border-white/5" {...p}>{children}</code>;
                          },
                          strong: (p) => <strong className="text-white font-bold" {...p}/>,
                          blockquote: (p) => <blockquote className="border-l-2 border-[var(--cyber-blue)] pl-3 text-gray-400 italic my-1" {...p}/>,
                        }}
                      >{aiOutput}</ReactMarkdown>
                    </div>
                  : <p className="text-gray-700 text-xs font-mono">AI response appears here after you press Deploy AI.</p>
                }
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
