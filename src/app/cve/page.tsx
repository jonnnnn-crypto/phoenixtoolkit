"use client";

import { useState } from "react";
import { Search, ShieldAlert, Activity, GitBranch, Star, GitFork, Code, Clock, Database } from "lucide-react";

export default function CveSearch() {
  const [query, setQuery] = useState("");
  
  // NVD State
  const [loadingNvd, setLoadingNvd] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cves, setCves] = useState<any[]>([]);
  const [nvdError, setNvdError] = useState("");

  // GitHub State 
  const [loadingGit, setLoadingGit] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubError, setGithubError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    // Reset States
    setLoadingNvd(true);
    setLoadingGit(true);
    setNvdError("");
    setGithubError("");
    setCves([]);
    setGithubRepos([]);

    // 1. Fetch NVD Database
    const fetchNVD = async () => {
      try {
        const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=10`);
        if (!res.ok) throw new Error("NVD API Rate limit or server error.");
        const data = await res.json();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = data.vulnerabilities?.map((v: any) => ({
          id: v.cve.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          description: v.cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description provided by NVD.",
          baseScore: v.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || v.cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || "N/A",
          severity: v.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || "UNKNOWN"
        })) || [];

        setCves(parsed);
        if (parsed.length === 0) setNvdError("No vulnerabilities found for that keyword in NVD.");
      } catch {
        setNvdError("Failed to fetch CVE data. NVD API might be rate-limiting requests without an API key.");
      } finally {
        setLoadingNvd(false);
      }
    };

    // 2. Fetch GitHub PoC Exploit Radar
    const fetchGitHub = async () => {
      try {
        const gitQuery = `${query} poc`;
        const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(gitQuery)}&sort=stars&order=desc&per_page=8`, {
            headers: { "Accept": "application/vnd.github.v3+json" }
        });
        
        if (!res.ok) {
           if (res.status === 403 || res.status === 429) throw new Error("GitHub API Rate Limit Exceeded (Unauthenticated Limit).");
           throw new Error("GitHub Search Engine failed to respond.");
        }
        
        const data = await res.json();
        setGithubRepos(data.items || []);
        if (!data.items || data.items.length === 0) setGithubError("No public Exploits or PoC repositories found on GitHub.");
      } catch (e: unknown) {
        if (e instanceof Error) {
            setGithubError(e.message);
        } else {
            setGithubError("An unknown error occurred connecting to GitHub Radar.");
        }
      } finally {
        setLoadingGit(false);
      }
    };

    // Dispatch concurrently
    await Promise.allSettled([fetchNVD(), fetchGitHub()]);
  };

  return (
    <div className="container mx-auto px-6 py-12 min-h-[85vh]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[rgba(34,197,94,0.1)] text-[var(--neon-green)] mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-[var(--neon-green)]/20">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-4xl font-bold font-mono tracking-tight text-white mb-4">Threat Intelligence Radar</h1>
          <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">Query the National Vulnerability Database (NVD) alongside live GitHub Exploit crawling to discover active Proof of Concepts (PoC) instantly.</p>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearch} className="mb-12 relative group max-w-4xl mx-auto">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CVE ID or Keyword (e.g. 'Log4j', 'CVE-2021-44228')"
            className="w-full bg-[#0a0a0a]/80 backdrop-blur-md border-2 border-[rgba(255,255,255,0.05)] rounded-xl px-6 py-5 text-white pl-16 focus:outline-none focus:border-[var(--neon-green)] transition-colors text-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] font-mono"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[var(--neon-green)] transition-colors" size={24} />
          <button type="submit" disabled={loadingNvd || loadingGit || !query.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--neon-green)] text-black px-6 py-3 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all flex items-center gap-2 uppercase tracking-wider text-sm disabled:opacity-50 disabled:shadow-none">
            {(loadingNvd || loadingGit) ? <Activity className="animate-spin" size={18} /> : "Initialize Scan"}
          </button>
        </form>

        {/* Intelligence Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           
           {/* LEFT TIER: NVD DATABASE */}
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 py-1 mb-2 border-b border-[rgba(255,255,255,0.05)]">
                 <Database className="text-[var(--cyber-blue)]" size={18}/>
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-sm">NVD Vulnerabilities</h2>
                 {loadingNvd && <Activity size={14} className="text-[var(--cyber-blue)] animate-spin ml-auto" />}
              </div>

              {nvdError && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-mono text-xs flex items-center gap-2">
                    <ShieldAlert size={14}/> {nvdError}
                 </div>
              )}

              <div className="space-y-4">
                {cves.map((cve) => (
                  <div key={cve.id} className="bg-[#0a0a0a] p-6 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--cyber-blue)]/50 transition-colors shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
                        {cve.id}
                        {cve.severity !== "UNKNOWN" && (
                          <span className={`text-xs px-3 py-1 rounded font-bold uppercase tracking-wider ${
                            cve.severity === "CRITICAL" ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                            cve.severity === "HIGH" ? "bg-orange-500/20 text-orange-500 border border-orange-500/30" :
                            cve.severity === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
                            "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                          }`}>
                            {cve.severity} <span className="text-white/50 px-1 border-l border-white/20 ml-1">CVSS {cve.baseScore}</span>
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed font-sans">{cve.description}</p>
                  </div>
                ))}
              </div>
           </div>

           {/* RIGHT TIER: GITHUB EXPLOT RADAR */}
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 py-1 mb-2 border-b border-[rgba(255,255,255,0.05)]">
                 <GitBranch className="text-[var(--neon-green)]" size={18}/>
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-sm">GitHub PoC Radar</h2>
                 {loadingGit && <Activity size={14} className="text-[var(--neon-green)] animate-spin ml-auto" />}
              </div>

              {githubError && (
                 <div className="p-4 bg-[var(--cyber-blue)]/5 border border-[var(--cyber-blue)]/20 rounded-xl text-[var(--cyber-blue)] font-mono text-xs flex items-center gap-2">
                    <ShieldAlert size={14}/> {githubError}
                 </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {githubRepos.map((repo) => (
                    <a 
                      key={repo.id} 
                      href={repo.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#111] p-5 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--neon-green)]/70 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all group flex flex-col h-full cursor-pointer"
                    >
                       <div className="flex justify-between items-start mb-3 gap-2">
                          <span className="font-bold font-mono text-[var(--cyber-blue)] group-hover:text-[var(--neon-green)] transition-colors truncate block flex-1 text-sm">{repo.full_name}</span>
                          <span className="text-gray-400 text-xs flex items-center gap-1 shrink-0 bg-black/50 px-2 py-1 rounded border border-[rgba(255,255,255,0.1)]">
                            <Star size={10} className="text-yellow-500"/> {repo.stargazers_count}
                          </span>
                       </div>
                       
                       <p className="text-gray-400 text-xs line-clamp-3 mb-4 leading-relaxed flex-1">
                          {repo.description || "No description provided. Raw repository payload."}
                       </p>
                       
                       <div className="mt-auto flex items-center flex-wrap gap-3 text-[10px] text-gray-500 font-mono pt-3 border-t border-[rgba(255,255,255,0.05)]">
                          <span className="flex items-center gap-1 text-gray-400"><GitFork size={12}/> {repo.forks_count} Forks</span>
                          {repo.language && (
                             <span className="flex items-center gap-1 text-[var(--cyber-blue)]"><Code size={12}/> {repo.language}</span>
                          )}
                          <span className="flex items-center gap-1 text-gray-400 ml-auto"><Clock size={12}/> {new Date(repo.updated_at).toLocaleDateString()}</span>
                       </div>
                    </a>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
