import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

export async function POST(req: Request) {
  try {
    const { tool, target, customArgs } = await req.json();
    const sanitizedTarget = target.replace(/[^a-zA-Z0-9\.\-\:\/]/g, "");
    
    // Cloud Engineering Mode (Vercel Compatible)
    if (tool.includes("Cloud ")) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`> Phoenix OS Cloud Execution Engine Initialized.\n`));
          controller.enqueue(encoder.encode(`> Cloud Module: ${tool}\n`));
          controller.enqueue(encoder.encode(`> Target: ${sanitizedTarget}\n`));
          controller.enqueue(encoder.encode(`========================================================================\n\n`));

          try {
            if (tool === "Cloud Nmap (Port Scan)") {
              controller.enqueue(encoder.encode(`[INFO] Sending request to HackerTarget Cloud Nmap API...\n`));
              const res = await fetchWithTimeout(`https://api.hackertarget.com/nmap/?q=${sanitizedTarget}`);
              const data = await res.text();
              controller.enqueue(encoder.encode(data + "\n"));
            } 
            else if (tool === "Cloud Subfinder (Multi-OSINT)") {
              controller.enqueue(encoder.encode(`[INFO] Initializing Serverless Multi-OSINT Proxy Engine...\n`));
              controller.enqueue(encoder.encode(`[*] Launching asynchronous queries to crt.sh, HackerTarget, and AlienVault OTX...\n\n`));
              
              const allDomains = new Set<string>();
              
              const fetchCrtSh = async () => {
                 try {
                   const res = await fetchWithTimeout(`https://crt.sh/?q=%25.${sanitizedTarget}&output=json`, {}, 15000);
                   if (res.ok) {
                     const data = await res.json();
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     if (Array.isArray(data)) data.forEach((e: any) => allDomains.add(e.name_value.toLowerCase()));
                     controller.enqueue(encoder.encode(`[+] Source CRT.SH answered successfully.\n`));
                   }
                 } catch { controller.enqueue(encoder.encode(`[-] Source CRT.SH rate limited or timed out.\n`)); }
              };

              const fetchHackerTarget = async () => {
                 try {
                   const res = await fetchWithTimeout(`https://api.hackertarget.com/hostsearch/?q=${sanitizedTarget}`, {}, 15000);
                   if (res.ok) {
                     const txt = await res.text();
                     const lines = txt.split("\n");
                     lines.forEach(line => {
                       const domain = line.split(",")[0];
                       if (domain && domain.includes(sanitizedTarget)) allDomains.add(domain.toLowerCase());
                     });
                     controller.enqueue(encoder.encode(`[+] Source HackerTarget answered successfully.\n`));
                   }
                 } catch { controller.enqueue(encoder.encode(`[-] Source HackerTarget rate limited or timed out.\n`)); }
              };

              const fetchAlienVault = async () => {
                 try {
                   const res = await fetchWithTimeout(`https://otx.alienvault.com/api/v1/indicators/domain/${sanitizedTarget}/passive_dns`, {}, 15000);
                   if (res.ok) {
                     const data = await res.json();
                     if (data.passive_dns) {
                       // eslint-disable-next-line @typescript-eslint/no-explicit-any
                       data.passive_dns.forEach((e: any) => { if(e.hostname) allDomains.add(e.hostname.toLowerCase()); });
                     }
                     controller.enqueue(encoder.encode(`[+] Source AlienVault OTX answered successfully.\n`));
                   }
                 } catch { controller.enqueue(encoder.encode(`[-] Source AlienVault rate limited or timed out.\n`)); }
              };

              await Promise.allSettled([fetchCrtSh(), fetchHackerTarget(), fetchAlienVault()]);
              
              const domainsArray = Array.from(allDomains).filter(d => d.endsWith(sanitizedTarget) && !d.includes("*"));
              controller.enqueue(encoder.encode(`\n[SUCCESS] Unified Multi-OSINT Discovery complete.\n`));
              controller.enqueue(encoder.encode(`[FOUND] ${domainsArray.length} unique, deduplicated subdomains identified:\n\n`));
              
              // Sort alphabetically and display
              domainsArray.sort().slice(0, 200).forEach(d => controller.enqueue(encoder.encode(`-> ${d}\n`)));
              if (domainsArray.length > 200) controller.enqueue(encoder.encode(`\n... and ${domainsArray.length - 200} more truncated to save browser memory.\n`));
            }
            else if (tool === "Cloud DNS Lookup") {
              controller.enqueue(encoder.encode(`[INFO] Querying global DNS records...\n`));
              const res = await fetchWithTimeout(`https://api.hackertarget.com/dnslookup/?q=${sanitizedTarget}`);
              const data = await res.text();
              controller.enqueue(encoder.encode(data + "\n"));
            }
            else if (tool === "Cloud Header Scanner") {
               controller.enqueue(encoder.encode(`[INFO] Probing web server headers...\n`));
               const urlToFetch = sanitizedTarget.startsWith('http') ? sanitizedTarget : `https://${sanitizedTarget}`;
               const res = await fetchWithTimeout(urlToFetch, { method: "HEAD" }, 5000);
               controller.enqueue(encoder.encode(`[HTTP] Status: ${res.status} ${res.statusText}\n\n`));
               res.headers.forEach((value, key) => {
                 controller.enqueue(encoder.encode(`[*] ${key}: ${value}\n`));
               });
            }
            else if (tool === "Cloud Dirsearch (Basic Fuzzer)") {
               controller.enqueue(encoder.encode(`[INFO] Initializing Cloud Dirsearch (Basic Directory Fuzzer)...\n`));
               const paths = ["admin", "login", "api", "robots.txt", ".git", "wp-admin", "backup", "config", "test", "dev", "sitemap.xml", ".env", "swagger"];
               controller.enqueue(encoder.encode(`[*] Fuzzing ${paths.length} high-value paths simultaneously...\n\n`));
               
               const base = sanitizedTarget.startsWith('http') ? sanitizedTarget : `http://${sanitizedTarget}`;
               
               for (const path of paths) {
                  try {
                     const targetUrl = `${base}/${path}`;
                     const res = await fetchWithTimeout(targetUrl, { method: "HEAD" }, 6000);
                     if (res.status === 200 || res.status === 301 || res.status === 302 || res.status === 403) {
                       controller.enqueue(encoder.encode(`[+] FOUND: /${path} (Status: ${res.status})\n`));
                     } else {
                       controller.enqueue(encoder.encode(`[-] /${path} (Status: ${res.status})\n`));
                     }
                  } catch { controller.enqueue(encoder.encode(`[-] /${path} (Timeout or Connection Refused)\n`)); }
               }
            }
            else {
              controller.enqueue(encoder.encode(`[CRITICAL] Cloud module not recognized.\n`));
            }
          } catch (err: unknown) {
             const msg = err instanceof Error ? err.message : String(err);
             controller.enqueue(encoder.encode(`\n[CRITICAL ERROR] Cloud execution failed: ${msg}\n`));
          }

          controller.enqueue(encoder.encode(`\n========================================================================\n`));
          controller.enqueue(encoder.encode(`> Cloud execution finished.\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    }

    // Native Execution Mode explicitly disabled for Pure Vercel Compatibility
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`> Phoenix OS Engine\n`));
        controller.enqueue(encoder.encode(`========================================================================\n\n`));
        controller.enqueue(encoder.encode(`[CRITICAL] Error! Native OS Execution has been physically disabled in the backend.\n`));
        controller.enqueue(encoder.encode(`[INFO] This environment is configured as a Pure Vercel Serverless Application.\n`));
        controller.enqueue(encoder.encode(`[SOLUTION] Please only select tools from the 'Vercel Cloud Engines' group in the Dashboard.\n\n`));
        controller.enqueue(encoder.encode(`========================================================================\n`));
        controller.enqueue(encoder.encode(`> Process terminated with exit code 1\n`));
        controller.close();
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
