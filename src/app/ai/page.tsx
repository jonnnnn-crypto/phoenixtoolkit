"use client";

import { useState } from "react";
import { BrainCircuit, Send, Activity, User, Bot, FileText, Globe, Link as LinkIcon, HardDrive, Download, ChevronDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- DEEPSEEK RESPONSE PARSER ---
const parseDeepSeekResponse = (text: string) => {
  if (!text) return { thought: null, content: "" };
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    return {
      thought: thinkMatch[1].trim(),
      content: text.replace(/<think>[\s\S]*?<\/think>/, "").trim()
    };
  }
  return { thought: null, content: text.trim() };
};

export default function AiEngine() {
  const [mode, setMode] = useState<"chat" | "report">("chat");
  const [lang, setLang] = useState<"ID" | "EN">("ID");
  const [reportTemplate, setReportTemplate] = useState<"Standard CTF" | "HackerOne" | "Bugcrowd">("Standard CTF");
  
  const [input, setInput] = useState("");
  const [pocUrl, setPocUrl] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: "user" | "ai", content: string}[]>([
    { role: "ai", content: "Hello. I am the internal AI Engine running Nemotron-3. I am ready to process your commands or generate pentest reports in real-time streaming mode." }
  ]);
  const [reportResult, setReportResult] = useState("");

  // --- MARKDOWN COMPONENTS (Typed) ---
  const MarkdownComponents: any = {
      h1: ({...props}: any) => <h1 className="text-2xl font-bold mt-4 mb-2 text-white" {...props} />,
      h2: ({...props}: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-white border-b border-[rgba(255,255,255,0.1)] pb-2" {...props} />,
      h3: ({...props}: any) => <h3 className="text-lg font-bold mt-4 mb-2 text-[var(--cyber-blue)]" {...props} />,
      p: ({...props}: any) => <p className="mb-4 text-gray-300 leading-relaxed font-sans" {...props} />,
      ul: ({...props}: any) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1 marker:text-[var(--neon-green)]" {...props} />,
      ol: ({...props}: any) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1 marker:text-[var(--cyber-blue)]" {...props} />,
      li: ({...props}: any) => <li className="pl-1" {...props} />,
      code: ({className, children, ...props}: any) => {
        const isInline = !className || !className.includes('language-');
        return isInline 
          ? <code className="bg-black/50 text-[var(--neon-green)] px-1.5 py-0.5 rounded font-mono text-xs border border-[rgba(255,255,255,0.1)]" {...props}>{children}</code> 
          : <code className="block bg-[#0a0a0a] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto font-mono my-3 border border-[rgba(255,255,255,0.05)] custom-scrollbar shadow-inner" {...props}>{children}</code>;
      },
      strong: ({...props}: any) => <strong className="font-bold text-white tracking-wide" {...props} />,
      blockquote: ({...props}: any) => <blockquote className="border-l-4 border-[var(--cyber-blue)] pl-4 italic text-gray-400 bg-[rgba(56,189,248,0.05)] py-2 pr-4 rounded-r-lg my-4" {...props} />,
      a: ({...props}: any) => <a className="text-[var(--cyber-blue)] hover:text-white hover:underline transition-colors break-all" target="_blank" rel="noopener noreferrer" {...props} />
  };

  const downloadReport = (format: "md" | "txt" | "html") => {
     if (!reportResult) return;
     const parsed = parseDeepSeekResponse(reportResult);
     let content = parsed.content;
     let mime = "text/markdown";
     
     if (format === "txt") {
         mime = "text/plain";
         content = content.replace(/[#*`_~[]()]/g, ""); 
     } else if (format === "html") {
         mime = "text/html";
         const lines = content.split('\n');
         let htmlParts = lines.map(l => {
            if(l.startsWith('# ')) return `<h1>${l.replace('# ', '')}</h1>`;
            if(l.startsWith('## ')) return `<h2>${l.replace('## ', '')}</h2>`;
            if(l.startsWith('### ')) return `<h3>${l.replace('### ', '')}</h3>`;
            if(l.startsWith('- ')) return `<li>${l.replace('- ', '')}</li>`;
            if(l.startsWith('> ')) return `<blockquote>${l.replace('> ', '')}</blockquote>`;
            return `<p>${l}</p>`;
         });
         content = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Phoenix Pentest Report</title><style>body { font-family: 'Inter', system-ui, sans-serif; background: #0a0a0a; color: #d1d5db; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; } h1, h2, h3 { color: #fff; margin-top: 30px; border-bottom: 1px solid #333; padding-bottom: 10px; } h1 { color: #38bdf8; } p { margin-bottom: 15px; } li { margin-bottom: 5px; } blockquote { border-left: 4px solid #22c55e; padding-left: 15px; font-style: italic; color: #9ca3af; background: #111; padding: 10px; } code { background: #111; padding: 2px 5px; border-radius: 4px; color: #22c55e; font-family: monospace; }</style></head><body>${htmlParts.join('\n')}</body></html>`;
     }

     const blob = new Blob([content], { type: mime });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `Phoenix_Pentest_Report_${new Date().getTime()}.${format}`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, stream: true })
      });
      
      if (!res.ok) {
        const text = await res.text();
        setMessages(prev => [...prev, { role: "ai", content: `[Error ${res.status}]: ${text.slice(0, 100)}` }]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      setMessages(prev => [...prev, { role: "ai", content: "" }]);
      
      let accumulated = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1].content = accumulated;
          return last;
        });
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: `[System Error]: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setReportResult("");

    const formatLang = lang === "ID" ? "Bahasa Indonesia" : "English";
    
    let templateRules = "";
    if (reportTemplate === "HackerOne") {
        templateRules = `
You MUST format the report using the professional HackerOne (H1) disclosure standard:
**Vulnerability Title:** [Concise, impactful title]
**Summary:** [Provide a high-level summary of the vulnerability and its impact]
**Description:** [Detailed explanation of the technical root cause]
**CWE Classification:** [Determine most relevant CWE ID]

## Steps To Reproduce:
1. [Prerequisites: account types, browser, etc.]
2. [Step-by-step reproduction guide]
3. [Observed vs Expected result]

## Proof of Concept (PoC):
[Provide PoC links, scripts, or payloads]

## Impact:
[Detailed business and technical impact analysis. What can an attacker achieve?]

## Suggested Mitigation / Remediation:
[Provide actionable fix recommendations]

## Supporting Material/References:
* [Ensure PoC URL and Drive Link are perfectly hyperlinked here]`;
    } else if (reportTemplate === "Bugcrowd") {
        templateRules = `
You MUST format the report using the Bugcrowd VRT (Vulnerability Rating Taxonomy) standard:
# [Vulnerability Name]
**VRT Category:** [e.g., Server-Side Injection -> SQL Injection]
**Technical Severity:** [P1 - P5 based on technical impact]

## Description
[Technical deep dive into the vulnerability found in the logs]

## Proof of Concept (PoC)
1. [Precise steps to trigger the bug]
2. [Payload used]
3. [PoC URL/Evidence]

## Root Cause Analysis
[Explain why the vulnerability exists in the code/server]

## Remediation
[Provide specific code-level or configuration-level fix instructions]

## References
* [Ensure PoC URL and Drive Link are perfectly hyperlinked here]`;
    } else {
        templateRules = `
You MUST generate a Tier-1 Professional Security Assessment Report:
1. **Executive Summary**: High-level overview for stakeholders.
2. **Vulnerability Analysis**: 
   - **Type**: [Vulnerability Name]
   - **CWE**: [e.g., CWE-79 for XSS]
   - **CVSS v3.1 Score**: [e.g., 8.1 High - Base Vector provided]
3. **Target Scope**: [Asset URL/IP analyzed]
4. **Technical Details**: Deep dive into the logs and attack vector.
5. **Attack Scenario**: How a real attacker would weaponize this.
6. **Step-by-Step PoC**: Repeatable instructions.
7. **Remediation Strategies**: Immediate fix and long-term prevention.
8. **References & Evidence**: [Integrate PoC URL and Drive Link here]`;
    }

    const systemPrompt = `You are an elite Cybersecurity professional. The user will provide raw output logs from penetration testing tools. Analyze them deeply and output a highly comprehensive, professional Penetration Testing Report in ${formatLang}. ${templateRules}`;
    const generatedPrompt = `Here are the logs to analyze:\n${input}\n\n[Target PoC URL]: ${pocUrl || "N/A"}\n[Evidence / Drive Link]: ${driveLink || "N/A"}`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: generatedPrompt, systemPrompt, stream: true })
      });
      
      if (!res.ok) {
        const text = await res.text();
        setReportResult(`[HTTP ${res.status}] Error: ${text.slice(0, 100)}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("ReadableStream not available");

      let accumulated = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReportResult(accumulated);
      }
    } catch (err: any) {
      setReportResult(`[System Error]: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 flex flex-col h-[calc(100vh-80px)] max-w-6xl">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--neon-green)] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Analysis Engine</h1>
            <p className="text-sm text-[var(--neon-green)] font-mono flex items-center gap-2">
              <Activity size={12} /> Nemotron-3 • Build v35.2 • Enabled
            </p>
          </div>
        </div>

        <div className="flex bg-[#111] p-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
          <button onClick={() => setMode("chat")} className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === "chat" ? "bg-[var(--cyber-blue)] text-black" : "text-gray-500 hover:text-white"}`}>
            <Bot size={16} /> Chat Assistant
          </button>
          <button onClick={() => setMode("report")} className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === "report" ? "bg-[var(--neon-green)] text-black" : "text-gray-500 hover:text-white"}`}>
            <FileText size={16} /> Report Generator
          </button>
        </div>
      </div>

      {mode === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 shadow-inner custom-scrollbar">
            {messages.map((msg, i) => {
              const parsed = parseDeepSeekResponse(msg.content);
              return (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-[var(--cyber-blue)] text-black" : "bg-black border-2 border-[var(--neon-green)] text-[var(--neon-green)]"}`}>
                    {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`max-w-[85%] p-5 rounded-2xl ${msg.role === "user" ? "bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.2)] text-white" : "glass text-gray-300 w-full shadow-lg"}`}>
                    {msg.role === "user" ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
                    ) : (
                      <div className="flex flex-col w-full">
                        {parsed?.thought && (
                          <details className="bg-black/40 border border-[rgba(255,255,255,0.05)] rounded-lg p-3 text-xs font-mono text-gray-500 mb-4 cursor-pointer group">
                             <summary className="text-gray-400 font-bold outline-none group-hover:text-white transition-colors">🧠 Reasoning Process</summary>
                             <div className="whitespace-pre-wrap mt-3 pl-3 border-l-2 border-[var(--cyber-blue)] max-h-[300px] overflow-y-auto custom-scrollbar">{parsed.thought}</div>
                          </details>
                        )}
                        <div className="text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                             {parsed?.content || ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-black border border-[var(--neon-green)] text-[var(--neon-green)] flex items-center justify-center"><Activity size={20} className="animate-spin" /></div></div>}
          </div>
          <form onSubmit={handleChatSubmit} className="relative mt-auto shrink-0">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nemotron-3 to write exploits, fix code, or explain concepts..." className="w-full bg-[#0a0a0a] border-2 border-[rgba(255,255,255,0.05)] rounded-xl px-6 py-5 text-white pr-16 focus:outline-none focus:border-[var(--neon-green)] transition-colors shadow-lg" />
            <button type="submit" disabled={loading} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--neon-green)] hover:scale-110 transition-transform disabled:opacity-50"><Send size={24} /></button>
          </form>
        </>
      ) : (
        <div className="flex gap-8 h-full overflow-hidden">
          <div className="w-[400px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl flex flex-col p-6 shadow-xl overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText className="text-[var(--neon-green)]" /> Report Parameters</h2>
            <div className="space-y-4">
              <div>
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Target Language</label>
                 <div className="flex bg-black rounded-lg p-1 border border-white/5">
                    <button onClick={() => setLang("ID")} className={`flex-1 py-1.5 text-xs font-bold rounded ${lang === "ID" ? "bg-white/10 text-white" : "text-gray-500"}`}>B. Indonesia</button>
                    <button onClick={() => setLang("EN")} className={`flex-1 py-1.5 text-xs font-bold rounded ${lang === "EN" ? "bg-white/10 text-white" : "text-gray-500"}`}>English</button>
                 </div>
              </div>
              <div>
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Report Template</label>
                 <div className="relative group">
                    <select value={reportTemplate} onChange={(e) => setReportTemplate(e.target.value as any)} 
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-300 appearance-none focus:outline-none focus:border-[var(--neon-green)] transition-colors cursor-pointer capitalize">
                      <option value="Standard CTF">Standard Pentest</option>
                      <option value="HackerOne">HackerOne (Disc.)</option>
                      <option value="Bugcrowd">Bugcrowd (VRT)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors" />
                 </div>
              </div>
              <div>
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Raw Output Logs</label>
                 <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste Nmap/Nuclei/Sqlmap output here..." className="w-full h-40 bg-black border border-white/10 rounded-lg p-3 text-xs text-gray-400 font-mono focus:outline-none focus:border-[var(--neon-green)] leading-relaxed custom-scrollbar" />
              </div>
              <div>
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Target PoC URL</label>
                 <div className="relative"><Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="text" value={pocUrl} onChange={(e) => setPocUrl(e.target.value)} placeholder="https://target.com/vuln" className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-300 focus:outline-none focus:border-[var(--cyber-blue)]" /></div>
              </div>
              <div>
                 <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Evidence / Drive Link</label>
                 <div className="relative"><HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="text" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="Google Drive / Imgur PoC" className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-300 focus:outline-none focus:border-[var(--cyber-blue)]" /></div>
              </div>
              <button onClick={handleReportSubmit} disabled={loading} className="w-full bg-[var(--neon-green)] text-black py-4 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 grayscale disabled:grayscale-0 disabled:opacity-50">
                {loading ? <><Activity size={18} className="animate-spin" /> Generating...</> : <><Send size={18} /> Process Logs</>}
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-2xl flex flex-col overflow-hidden shadow-xl">
             <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2"><Bot size={16} className="text-[var(--neon-green)]" /> Generated Analysis</span>
                {reportResult && (
                  <div className="flex gap-2">
                    <button onClick={() => downloadReport("md")} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-[var(--neon-green)] transition-colors"><Download size={12} /> MD</button>
                    <button onClick={() => downloadReport("html")} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-[var(--cyber-blue)] transition-colors"><Download size={12} /> HTML</button>
                  </div>
                )}
             </div>
             <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/20">
                {reportResult ? (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                       {reportResult}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 text-sm italic font-mono opacity-40">
                    <p>Analysis output will appear here in real-time streaming...</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
