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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MarkdownComponents: any = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h1: ({...props}: any) => <h1 className="text-2xl font-bold mt-4 mb-2 text-white" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h2: ({...props}: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-white border-b border-[rgba(255,255,255,0.1)] pb-2" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h3: ({...props}: any) => <h3 className="text-lg font-bold mt-4 mb-2 text-[var(--cyber-blue)]" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p: ({...props}: any) => <p className="mb-4 text-gray-300 leading-relaxed font-sans" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ul: ({...props}: any) => <ul className="list-disc pl-5 mb-4 text-gray-300 space-y-1 marker:text-[var(--neon-green)]" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ol: ({...props}: any) => <ol className="list-decimal pl-5 mb-4 text-gray-300 space-y-1 marker:text-[var(--cyber-blue)]" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    li: ({...props}: any) => <li className="pl-1" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({className, children, ...props}: any) => {
      const isInline = !className || !className.includes('language-');
      return isInline 
        ? <code className="bg-black/50 text-[var(--neon-green)] px-1.5 py-0.5 rounded font-mono text-xs border border-[rgba(255,255,255,0.1)]" {...props}>{children}</code> 
        : <code className="block bg-[#0a0a0a] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto font-mono my-3 border border-[rgba(255,255,255,0.05)] custom-scrollbar shadow-inner" {...props}>{children}</code>;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    strong: ({...props}: any) => <strong className="font-bold text-white tracking-wide" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockquote: ({...props}: any) => <blockquote className="border-l-4 border-[var(--cyber-blue)] pl-4 italic text-gray-400 bg-[rgba(56,189,248,0.05)] py-2 pr-4 rounded-r-lg my-4" {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({...props}: any) => <a className="text-[var(--cyber-blue)] hover:text-white hover:underline transition-colors break-all" target="_blank" rel="noopener noreferrer" {...props} />
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
    { role: "ai", content: "Hello. I am the internal AI Engine running DeepSeek-R1 via HF Router. I am ready to process your commands or generate pentest reports. Markdown and code snippets are fully supported." }
  ]);
  const [reportResult, setReportResult] = useState("");

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
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      if (res.ok) setMessages(prev => [...prev, { role: "ai", content: data.result }]);
      else setMessages(prev => [...prev, { role: "ai", content: `[ERROR]: ${data.error}` }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "[ERROR]: Core API down." }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: "md" | "txt" | "html") => {
     if (!reportResult) return;
     const parsed = parseDeepSeekResponse(reportResult);
     let content = parsed.content;
     let mime = "text/markdown";
     
     if (format === "txt") {
         mime = "text/plain";
         content = content.replace(/[#*`_~[]()]/g, ""); // basic strip
     } else if (format === "html") {
         mime = "text/html";
         // Quick and dirty markdown-to-html conversion for export
         const lines = content.split('\\n');
         let htmlParts = lines.map(l => {
            if(l.startsWith('# ')) return `<h1>${l.replace('# ', '')}</h1>`;
            if(l.startsWith('## ')) return `<h2>${l.replace('## ', '')}</h2>`;
            if(l.startsWith('### ')) return `<h3>${l.replace('### ', '')}</h3>`;
            if(l.startsWith('- ')) return `<li>${l.replace('- ', '')}</li>`;
            if(l.startsWith('> ')) return `<blockquote>${l.replace('> ', '')}</blockquote>`;
            return `<p>${l}</p>`;
         });
         content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phoenix Pentest Report</title>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #0a0a0a; color: #d1d5db; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    h1, h2, h3 { color: #fff; margin-top: 30px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    h1 { color: #38bdf8; }
    p { margin-bottom: 15px; }
    li { margin-bottom: 5px; }
    blockquote { border-left: 4px solid #22c55e; padding-left: 15px; font-style: italic; color: #9ca3af; background: #111; padding: 10px; }
    code { background: #111; padding: 2px 5px; border-radius: 4px; color: #22c55e; font-family: monospace; }
  </style>
</head>
<body>
  ${htmlParts.join('\\n')}
</body>
</html>`;
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setReportResult("");

    const formatLang = lang === "ID" ? "Bahasa Indonesia" : "English";
    
    let templateRules = "";
    if (reportTemplate === "HackerOne") {
        templateRules = `
You MUST format the report using the EXACT HackerOne template below:
**Summary:** [add summary of the vulnerability]
**Description:** [add more details about this vulnerability]
## Steps To Reproduce:
1. [add step]
2. [add step]
3. [add step]
## Impact: [add why this issue matters]
## Supporting Material/References:
* [Ensure PoC URL and Drive Link are perfectly hyperlinked here]`;
    } else if (reportTemplate === "Bugcrowd") {
        templateRules = `
You MUST format the report using the EXACT Bugcrowd VRT standard:
# Vulnerability Name
**VRT Classification:** [determine VRT]
## Description
[detailed description]
## Proof of Concept (PoC)
[Steps and PoC URL]
## Remediation
[How to fix]
## References
[Ensure PoC URL and Drive Link are perfectly hyperlinked here]`;
    } else {
        templateRules = "Include sections: Executive Summary, Target Scope, Vulnerabilities Found (with CVSS estimates), Technical Details, Actionable Remediation Steps, and References.";
    }

    const systemPrompt = `You are an elite Cybersecurity professional. The user will provide raw output logs from penetration testing tools (like Nmap, Nuclei, Sqlmap, FFUF). 
    You must analyze these logs deeply and output a highly comprehensive, professional Penetration Testing Report. 
    The report MUST be written strictly in ${formatLang}. 
    
    ${templateRules}
    
    IMPORTANT: You must clearly integrate the [Target PoC URL] and [Evidence / Drive Link] provided by the user into the References or Details section of the report. The report must be highly detailed, lengthy, exhaustive, and professionally formatted in Markdown. If the logs are short, extrapolate the impact heavily to provide a long, comprehensive analysis document.`;

    const generatedPrompt = `Here are the logs to analyze:
${input}

[Target PoC URL]: ${pocUrl || "N/A"}
[Evidence / Drive Link]: ${driveLink || "N/A"}`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: generatedPrompt, systemPrompt })
      });
      const data = await res.json();
      
      if (res.ok) setReportResult(data.result);
      else setReportResult(`[SYSTEM ERROR]: ${data.error}`);
    } catch {
      setReportResult("[SYSTEM ERROR]: Core API processing failed.");
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
            <p className="text-sm text-[var(--neon-green)] font-mono">HF Router: DeepSeek-R1 • Enabled</p>
          </div>
        </div>

        <div className="flex bg-[#111] p-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
          <button 
            onClick={() => setMode("chat")}
            className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === "chat" ? "bg-[var(--cyber-blue)] text-black" : "text-gray-500 hover:text-white"}`}
          >
            <Bot size={16} /> Chat Assistant
          </button>
          <button 
            onClick={() => setMode("report")}
            className={`px-4 py-2 rounded text-sm font-bold transition-all flex items-center gap-2 ${mode === "report" ? "bg-[var(--neon-green)] text-black" : "text-gray-500 hover:text-white"}`}
          >
            <FileText size={16} /> Report Generator
          </button>
        </div>
      </div>

      {mode === "chat" ? (
         // ... CHAT RENDER (Kept exact same)
        <>
          <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 shadow-inner custom-scrollbar">
            {messages.map((msg, i) => {
              const parsed = msg.role === "ai" ? parseDeepSeekResponse(msg.content) : null;
              
              return (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    msg.role === "user" ? "bg-[var(--cyber-blue)] text-black shadow-[0_0_10px_rgba(56,189,248,0.5)]" : "bg-black border-2 border-[var(--neon-green)] text-[var(--neon-green)] shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  }`}>
                    {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  
                  <div className={`max-w-[85%] p-5 rounded-2xl ${
                    msg.role === "user" ? "bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.2)] text-white" : "glass text-gray-300 w-full shadow-lg"
                  }`}>
                    {msg.role === "user" ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
                    ) : (
                      <div className="flex flex-col w-full">
                        {parsed?.thought && (
                          <details className="bg-black/40 border border-[rgba(255,255,255,0.05)] rounded-lg p-3 text-xs font-mono text-gray-500 mb-4 cursor-pointer group">
                            <summary className="text-gray-400 font-bold outline-none group-hover:text-white transition-colors">🧠 DeepSeek Reasoning Process</summary>
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
            
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black border border-[var(--neon-green)] text-[var(--neon-green)] flex items-center justify-center">
                  <Activity size={20} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="relative mt-auto shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask DeepSeek to write an exploit, fix code, or explain concepts..."
              className="w-full bg-[#0a0a0a] border-2 border-[rgba(255,255,255,0.05)] rounded-xl px-6 py-5 text-white pr-16 focus:outline-none focus:border-[var(--neon-green)] transition-colors shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            />
            <button type="submit" disabled={loading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neon-green)] p-3 hover:bg-[rgba(34,197,94,0.1)] rounded-lg transition-colors disabled:opacity-50">
              <Send size={24} />
            </button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex flex-wrap justify-between items-center mb-4 shrink-0 gap-4">
            <h2 className="text-xl font-bold text-white">Comprehensive Pentest Report Automation</h2>
            
            <div className="flex items-center gap-2">
               {/* Template Selector */}
               <div className="relative group">
                 <select 
                   value={reportTemplate} 
                   onChange={(e) => setReportTemplate(e.target.value as any)} 
                   className="appearance-none bg-[#111] border border-[rgba(255,255,255,0.1)] hover:border-[var(--cyber-blue)] text-gray-300 font-bold text-xs py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer transition-colors"
                 >
                   <option value="Standard CTF">Standard Format</option>
                   <option value="HackerOne">HackerOne Scope</option>
                   <option value="Bugcrowd">Bugcrowd VRT</option>
                 </select>
                 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
               </div>

               {/* Lang Selector */}
               <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] p-1 rounded-lg border border-[rgba(255,255,255,0.1)]">
                 <Globe size={14} className="text-gray-400 ml-2" />
                 <button onClick={() => setLang("ID")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === "ID" ? "bg-[var(--neon-green)] text-black" : "text-gray-500"}`}>IND</button>
                 <button onClick={() => setLang("EN")} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === "EN" ? "bg-[var(--neon-green)] text-black" : "text-gray-500"}`}>ENG</button>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full min-h-0 flex-1">
            {/* Input Log Area */}
            <div className="flex flex-col h-full relative space-y-4">
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <LinkIcon size={14} className="text-gray-500" />
                   </div>
                   <input 
                     type="text" 
                     value={pocUrl}
                     onChange={(e) => setPocUrl(e.target.value)}
                     placeholder="Target PoC URL (Optional)" 
                     className="w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-green)] transition-colors font-mono"
                   />
                </div>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <HardDrive size={14} className="text-gray-500" />
                   </div>
                   <input 
                     type="text" 
                     value={driveLink}
                     onChange={(e) => setDriveLink(e.target.value)}
                     placeholder="Evidence / Drive Link (Optional)" 
                     className="w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-green)] transition-colors font-mono"
                   />
                </div>
              </div>

              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste raw execution logs here (e.g., from Nmap scanning, Nuclei output, FFUF tables)..."
                className="w-full flex-1 bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:border-[var(--neon-green)] transition-colors custom-scrollbar"
              />
              <button 
                onClick={handleReportSubmit}
                disabled={loading || !input.trim()}
                className="w-full py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 bg-[var(--neon-green)] text-black hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:shadow-none shrink-0"
              >
                {loading ? <><Activity className="animate-spin" /> DeepSeek is Synthesizing {reportTemplate} Report...</> : `GENERATE ${reportTemplate.toUpperCase()} REPORT`}
              </button>
            </div>

            {/* AI Report Output Area */}
            <div className="flex flex-col h-full bg-[#0a0a0a] rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden shadow-2xl relative">
              <div className="bg-[#111] px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
                   <span className="text-xs text-gray-400 font-mono tracking-widest font-bold">DOCUMENT OUTPUT PREVIEW</span>
                 </div>
                 
                 {/* Export Tools */}
                 <div className="flex items-center gap-2">
                    <button onClick={() => downloadReport("md")} disabled={!reportResult} className="flex items-center gap-1.5 px-2 py-1 bg-black hover:bg-[var(--cyber-blue)] hover:text-black border border-[rgba(255,255,255,0.1)] rounded text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-gray-400">
                      <Download size={12} /> .MD
                    </button>
                    <button onClick={() => downloadReport("html")} disabled={!reportResult} className="flex items-center gap-1.5 px-2 py-1 bg-black hover:bg-[var(--cyber-blue)] hover:text-black border border-[rgba(255,255,255,0.1)] rounded text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-gray-400">
                      <Download size={12} /> .HTML
                    </button>
                    <button onClick={() => downloadReport("txt")} disabled={!reportResult} className="flex items-center gap-1.5 px-2 py-1 bg-black hover:bg-[var(--cyber-blue)] hover:text-black border border-[rgba(255,255,255,0.1)] rounded text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-gray-400">
                      <Download size={12} /> .TXT
                    </button>
                 </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-w-none pb-20">
                {reportResult ? (
                   <div className="flex flex-col w-full">
                      {parseDeepSeekResponse(reportResult).thought && (
                        <details className="bg-[#111] border border-[rgba(255,255,255,0.05)] rounded-lg p-3 text-xs font-mono text-gray-500 mb-6 cursor-pointer group shadow-lg">
                          <summary className="text-gray-400 font-bold outline-none group-hover:text-[var(--neon-green)] transition-colors">🧠 View AI Architectural Thought Process</summary>
                          <div className="whitespace-pre-wrap mt-3 pl-3 border-l-2 border-[var(--neon-green)] max-h-[400px] overflow-y-auto custom-scrollbar">{parseDeepSeekResponse(reportResult).thought}</div>
                        </details>
                      )}
                      <div className="text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                           {parseDeepSeekResponse(reportResult).content}
                        </ReactMarkdown>
                      </div>
                   </div>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
                     <FileText size={48} className="opacity-20" />
                     <p className="italic font-mono text-sm max-w-sm text-center">Generated AI Report will appear here in native Markdown format, structured precisely for the chosen template.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
