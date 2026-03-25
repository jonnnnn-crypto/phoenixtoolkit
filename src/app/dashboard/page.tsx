"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Terminal as TerminalIcon, Activity, Crosshair, Wrench, Download, Cloud } from "lucide-react";
import TerminalSimulator from "@/components/TerminalSimulator";

const AVAILABLE_TOOLS = [
  { group: "Vercel Cloud Engines (Works Everywhere)", tools: ["Cloud Nmap (Port Scan)", "Cloud Subfinder (Multi-OSINT)", "Cloud DNS Lookup", "Cloud Header Scanner", "Cloud Dirsearch (Basic Fuzzer)"] },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const engineParam = searchParams.get("engine") || "Reconnaissance";
  
  const [target, setTarget] = useState("");
  const [selectedTool, setSelectedTool] = useState("Cloud Nmap (Port Scan)");
  const [customArgs, setCustomArgs] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (engineParam.includes("Recon")) setSelectedTool("Cloud Nmap (Port Scan)");
    else if (engineParam.includes("Vuln")) setSelectedTool("Cloud Header Scanner");
    else if (engineParam.includes("Exploit")) setSelectedTool("Cloud Nmap (Port Scan)");
  }, [engineParam]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    
    setIsRunning(true);
    setLogs([`> SYSTEM: Initializing Execution Engine for ${selectedTool}...`]);
    
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool, target, customArgs })
      });
      
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        setLogs(prev => [...prev, ...lines]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLogs(prev => [...prev, `[ERROR] Connection to Engine lost: ${msg}`]);
    } finally {
      setIsRunning(false);
      setLogs(prev => [...prev, `> EXECUTION FINISHED: Engine detached.`]);
    }
  };

  const handleDownload = () => {
    if (logs.length === 0) return;
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phoenix_execution_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isCloud = selectedTool.includes("Cloud ");

  return (
    <div className="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[80vh] max-w-7xl">
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="glass p-6 rounded-xl border-l-4 border-[var(--neon-green)] shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <Crosshair className="text-[var(--neon-green)]" />
            <h2 className="text-xl font-bold text-white">Target Config</h2>
          </div>
          
          <form onSubmit={handleExecute} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Target Host/IP/URL</label>
              <input 
                type="text" 
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="e.g. example.com or http://10.0.0.1"
                className="w-full bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--neon-green)] font-mono text-sm transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono text-[var(--neon-green)] mb-2 uppercase flex items-center gap-2">
                {isCloud ? <Cloud size={14}/> : <Wrench size={14}/>} Select Engine Module
              </label>
              <select 
                value={selectedTool}
                onChange={e => setSelectedTool(e.target.value)}
                className="w-full bg-[#0a0a0a] border-2 border-[var(--cyber-blue)] shadow-[0_0_10px_rgba(56,189,248,0.2)] rounded px-4 py-3 text-white focus:outline-none font-mono text-sm"
              >
                {AVAILABLE_TOOLS.map((group, idx) => (
                  <optgroup label={group.group} key={idx} className="bg-[#111] text-[var(--cyber-blue)]">
                    {group.tools.map(t => (
                      <option value={t} key={t} className="text-white bg-black">{t}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom" className="text-[var(--neon-green)] bg-black font-bold">Custom Shell Command</option>
              </select>
            </div>

            {selectedTool === "custom" && (
               <div>
                 <label className="block text-xs font-mono text-yellow-500 mb-2 uppercase">Raw Command (Use %TARGET% for insertion)</label>
                 <input 
                   type="text" 
                   value={customArgs}
                   onChange={e => setCustomArgs(e.target.value)}
                   placeholder="e.g. nmap -p 80,443 -sC -sV %TARGET%"
                   className="w-full bg-[rgba(255,255,0,0.05)] border border-[rgba(255,255,0,0.2)] rounded px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-mono text-sm"
                 />
                 <p className="text-[10px] text-gray-500 mt-1 font-mono">DANGER: Custom commands execute physically on your host.</p>
               </div>
            )}

            {(!isCloud && selectedTool !== "custom" && selectedTool !== "Ping" && selectedTool !== "Nslookup" && selectedTool !== "Tracert") && (
               <div>
                 <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">Command Arguments (Optional)</label>
                 <input 
                   type="text" 
                   value={customArgs}
                   onChange={e => setCustomArgs(e.target.value)}
                   placeholder="Default args will be used if empty. Use %TARGET%"
                   className="w-full bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--cyber-blue)] font-mono text-sm"
                 />
               </div>
            )}
            
            <button 
              type="submit" 
              disabled={isRunning || !target}
              className={`w-full py-4 mt-2 rounded font-bold transition-all flex justify-center items-center gap-2 ${isRunning ? 'bg-[rgba(34,197,94,0.1)] text-[var(--neon-green)]' : 'bg-[var(--neon-green)] text-black hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'}`}
            >
              {isRunning ? <Activity className="animate-spin" /> : "EXECUTE MODULE"}
            </button>

            <button 
              type="button" 
              onClick={handleDownload}
              disabled={logs.length === 0}
              className={`w-full py-3 mt-4 rounded-md font-bold transition-all flex justify-center items-center gap-2 text-sm ${logs.length === 0 ? 'bg-[rgba(255,255,255,0.05)] text-gray-500 cursor-not-allowed border border-transparent' : 'bg-transparent border border-[var(--cyber-blue)] text-[var(--cyber-blue)] hover:bg-[rgba(56,189,248,0.1)] shadow-[0_0_10px_rgba(56,189,248,0.2)]'}`}
            >
              <Download size={16} /> DOWNLOAD LOGS (.TXT)
            </button>
          </form>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4">Instance Status</h3>
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-gray-400">Execution Mode</span>
            <span className={isCloud ? "text-[var(--cyber-blue)] font-bold" : "text-[var(--neon-green)] font-bold"}>
              {isCloud ? "Vercel Cloud Safe" : "Raw Native Server"}
            </span>
          </div>
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-gray-400">Process Node</span>
            <span className="text-[var(--neon-green)]">Active/Allowed</span>
          </div>
        </div>
      </div>
      
      {/* Terminal View */}
      <div className="lg:col-span-8 flex flex-col h-full bg-[#0a0a0a] rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">
        <div className="bg-[#111] px-4 py-3 border-b border-[rgba(255,255,255,0.05)] text-xs text-gray-500 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon size={14} />
            <span>sys_terminal@phoenix_{isCloud ? 'cloud' : 'native'}</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
        </div>
        
        <div className="flex-1 p-0 overflow-hidden min-h-[600px] relative">
           <TerminalSimulator logs={logs} isRunning={isRunning} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh] text-[var(--neon-green)] font-mono animate-pulse">
        Initializing Engine Framework...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
