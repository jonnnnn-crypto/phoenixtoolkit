import { Code, Activity, ShieldCheck, Link2 } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-6 py-20 min-h-[90vh]">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-14 text-center">
           <h1 className="text-4xl font-mono font-bold text-white mb-4 flex justify-center items-center gap-4">
              <Code className="text-[var(--cyber-blue)]" size={36}/> Developer Endpoints
           </h1>
           <p className="text-gray-400 font-sans text-sm max-w-2xl mx-auto">Swagger-style API reference for Phoenix OS. Integrate our Intelligence AI or Offensive Engine directly into your custom scripts.</p>
        </div>

        <div className="space-y-8">
           
           {/* EXECUTE ENPOINT */}
           <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-[#111] p-4 flex items-center gap-4 border-b border-[rgba(255,255,255,0.05)]">
                 <span className="bg-[var(--neon-green)]/20 text-[var(--neon-green)] font-mono font-bold px-3 py-1 rounded border border-[var(--neon-green)]/30 text-sm">POST</span>
                 <span className="font-mono text-white text-lg">/api/execute</span>
              </div>
              <div className="p-6">
                 <p className="text-gray-400 text-sm mb-6">Executes a remote command/payload securely via proxy cloud nodes.</p>
                 
                 <h4 className="text-white font-bold font-mono text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><Link2 size={14} className="text-[var(--cyber-blue)]"/> Request Body</h4>
                 <div className="bg-black/50 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] font-mono text-sm text-purple-300 mb-6 shadow-inner">
<pre>{`{
  "tool": "Cloud Nmap (Port Scan)",
  "target": "example.com"
}`}</pre>
                 </div>

                 <h4 className="text-white font-bold font-mono text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={14} className="text-[var(--neon-green)]"/> Response Payload (200 OK)</h4>
                 <div className="bg-black/50 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] font-mono text-sm text-gray-300 shadow-inner">
<pre>{`{
  "output": "Starting Nmap... Host is up.\\nPORT STATE SERVICE..."
}`}</pre>
                 </div>
              </div>
           </div>

           {/* AI ENDPOINT */}
           <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-[#111] p-4 flex items-center gap-4 border-b border-[rgba(255,255,255,0.05)]">
                 <span className="bg-[var(--neon-green)]/20 text-[var(--neon-green)] font-mono font-bold px-3 py-1 rounded border border-[var(--neon-green)]/30 text-sm">POST</span>
                 <span className="font-mono text-white text-lg">/api/ai</span>
              </div>
              <div className="p-6">
                 <p className="text-gray-400 text-sm mb-6">Bridges requests securely to the Hugging Face DeepSeek-R1 Language Model.</p>
                 
                 <h4 className="text-white font-bold font-mono text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><Link2 size={14} className="text-[var(--cyber-blue)]"/> Request Body</h4>
                 <div className="bg-black/50 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] font-mono text-sm text-purple-300 mb-6 shadow-inner">
<pre>{`{
  "message": "Write a highly detailed exploit report for Reflected XSS...",
  "systemPrompt": "You are HackerOne..." (Optional)
}`}</pre>
                 </div>

                 <h4 className="text-white font-bold font-mono text-xs uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} className="text-[var(--neon-green)]"/> Response Payload (200 OK)</h4>
                 <div className="bg-black/50 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] font-mono text-sm text-gray-300 shadow-inner">
<pre>{`{
  "result": "<think>Structuring report...</think>\\n# Vulnerability Report..."
}`}</pre>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
