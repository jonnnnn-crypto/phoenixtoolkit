import { NextResponse } from "next/server";

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 18000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const { tool, target, customArgs } = await req.json();
    const sanitizedTarget = target.replace(/[^a-zA-Z0-9.\-:/]/g, "");

    if (tool.includes("Cloud ")) {
      const stream = new ReadableStream({
        async start(controller) {
          const enc = (s: string) => new TextEncoder().encode(s);
          controller.enqueue(enc(`> Phoenix OS Cloud Execution Engine v2.1\n`));
          controller.enqueue(enc(`> Module: ${tool}\n`));
          controller.enqueue(enc(`> Target: ${sanitizedTarget}\n`));
          controller.enqueue(enc(`${"=".repeat(72)}\n\n`));

          try {
            // ── CLOUD NMAP ──────────────────────────────────────────────────────
            if (tool === "Cloud Nmap (Port Scan)") {
              controller.enqueue(enc(`[INFO] Querying HackerTarget Nmap API...\n`));
              try {
                const res = await fetchWithTimeout(`https://api.hackertarget.com/nmap/?q=${sanitizedTarget}`);
                if (!res.ok) {
                  controller.enqueue(enc(`[-] HackerTarget returned HTTP ${res.status}. Trying fallback...\n`));
                  // Fallback: Port probe via headers
                  const ports = [80, 443, 8080, 8443, 22, 21, 25, 3306, 5432];
                  controller.enqueue(enc(`[*] Manual port probe for common ports: ${ports.join(", ")}...\n\n`));
                  for (const port of ports) {
                    try {
                      const scheme = port === 443 || port === 8443 ? "https" : "http";
                      const probe = await fetchWithTimeout(`${scheme}://${sanitizedTarget}:${port}`, { method: "HEAD" }, 4000);
                      controller.enqueue(enc(`[+] Port ${port}/tcp OPEN (HTTP ${probe.status})\n`));
                    } catch {
                      controller.enqueue(enc(`[-] Port ${port}/tcp CLOSED or FILTERED\n`));
                    }
                  }
                } else {
                  const data = await res.text();
                  controller.enqueue(enc(data + "\n"));
                }
              } catch {
                controller.enqueue(enc(`[-] HackerTarget unreachable. Running manual probe...\n`));
                const ports = [80, 443, 8080, 8443, 22, 21, 3000, 3306];
                for (const port of ports) {
                  try {
                    const scheme = port === 443 || port === 8443 ? "https" : "http";
                    const probe = await fetchWithTimeout(`${scheme}://${sanitizedTarget}:${port}`, { method: "HEAD" }, 4000);
                    controller.enqueue(enc(`[+] Port ${port}/tcp OPEN (HTTP ${probe.status})\n`));
                  } catch {
                    controller.enqueue(enc(`[-] Port ${port}/tcp CLOSED\n`));
                  }
                }
              }
            }

            // ── CLOUD SUBFINDER ─────────────────────────────────────────────────
            else if (tool === "Cloud Subfinder (Multi-OSINT)") {
              controller.enqueue(enc(`[INFO] Activating Multi-OSINT Subdomain Discovery Engine...\n`));
              controller.enqueue(enc(`[*] Sources: crt.sh | HackerTarget | AlienVault OTX | RapidDNS\n\n`));

              const allDomains = new Set<string>();

              // Source 1: crt.sh
              try {
                controller.enqueue(enc(`[1/4] Querying crt.sh Certificate Transparency logs...\n`));
                const res = await fetchWithTimeout(`https://crt.sh/?q=%25.${sanitizedTarget}&output=json`, {}, 20000);
                if (res.ok) {
                  const data = await res.json();
                  if (Array.isArray(data)) {
                    data.forEach((e: { name_value: string }) => {
                      e.name_value.split("\n").forEach(d => allDomains.add(d.toLowerCase().trim()));
                    });
                    controller.enqueue(enc(`[+] crt.sh: ${data.length} raw entries fetched.\n`));
                  }
                } else {
                  controller.enqueue(enc(`[-] crt.sh returned HTTP ${res.status}.\n`));
                }
              } catch { controller.enqueue(enc(`[-] crt.sh: Timeout or connection refused.\n`)); }

              // Source 2: HackerTarget
              try {
                controller.enqueue(enc(`[2/4] Querying HackerTarget hostsearch...\n`));
                const res = await fetchWithTimeout(`https://api.hackertarget.com/hostsearch/?q=${sanitizedTarget}`, {}, 15000);
                if (res.ok) {
                  const txt = await res.text();
                  if (!txt.includes("error") && !txt.includes("API count exceeded")) {
                    txt.split("\n").forEach(line => {
                      const domain = line.split(",")[0];
                      if (domain && domain.includes(sanitizedTarget)) allDomains.add(domain.toLowerCase());
                    });
                    controller.enqueue(enc(`[+] HackerTarget: Data received.\n`));
                  } else {
                    controller.enqueue(enc(`[-] HackerTarget: ${txt.split("\n")[0]}\n`));
                  }
                }
              } catch { controller.enqueue(enc(`[-] HackerTarget: Timeout or rate limited.\n`)); }

              // Source 3: AlienVault OTX
              try {
                controller.enqueue(enc(`[3/4] Querying AlienVault OTX passive DNS...\n`));
                const res = await fetchWithTimeout(`https://otx.alienvault.com/api/v1/indicators/domain/${sanitizedTarget}/passive_dns`, {}, 15000);
                if (res.ok) {
                  const data = await res.json();
                  if (data.passive_dns) {
                    data.passive_dns.forEach((e: { hostname?: string }) => {
                      if (e.hostname) allDomains.add(e.hostname.toLowerCase());
                    });
                    controller.enqueue(enc(`[+] AlienVault OTX: ${data.passive_dns.length} passive DNS entries.\n`));
                  }
                }
              } catch { controller.enqueue(enc(`[-] AlienVault OTX: Timeout or rate limited.\n`)); }

              // Source 4: RapidDNS
              try {
                controller.enqueue(enc(`[4/4] Querying RapidDNS...\n`));
                const res = await fetchWithTimeout(`https://rapiddns.io/subdomain/${sanitizedTarget}?full=1#result`, {
                  headers: { "User-Agent": "Mozilla/5.0 (compatible; PhoenixCySec/2.0)" }
                }, 15000);
                if (res.ok) {
                  const html = await res.text();
                  const matches = html.match(/([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}/g) || [];
                  matches.forEach(d => {
                    if (d.endsWith(sanitizedTarget)) allDomains.add(d.toLowerCase());
                  });
                  controller.enqueue(enc(`[+] RapidDNS: HTML scraped successfully.\n`));
                }
              } catch { controller.enqueue(enc(`[-] RapidDNS: Timeout or unavailable.\n`)); }

              // Compile results
              const final = Array.from(allDomains)
                .filter(d => d.endsWith(sanitizedTarget) && !d.includes("*") && d.length > 0)
                .sort();

              controller.enqueue(enc(`\n${"─".repeat(72)}\n`));
              controller.enqueue(enc(`[RESULT] ${final.length} unique subdomains discovered:\n\n`));
              final.slice(0, 300).forEach(d => controller.enqueue(enc(`  -> ${d}\n`)));
              if (final.length > 300) controller.enqueue(enc(`\n  ... and ${final.length - 300} more (truncated)\n`));
              if (final.length === 0) controller.enqueue(enc(`[!] No subdomains found. Try a larger/more popular domain.\n`));
            }

            // ── CLOUD DNS LOOKUP ────────────────────────────────────────────────
            else if (tool === "Cloud DNS Lookup") {
              controller.enqueue(enc(`[INFO] Resolving DNS records via multiple APIs...\n\n`));
              
              // Cloudflare DoH
              try {
                const types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"];
                for (const type of types) {
                  const res = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${sanitizedTarget}&type=${type}`, {
                    headers: { "Accept": "application/dns-json" }
                  }, 6000);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.Answer && data.Answer.length > 0) {
                      controller.enqueue(enc(`[${type}]\n`));
                      data.Answer.forEach((a: { data: string; TTL: number }) =>
                        controller.enqueue(enc(`  ${a.data} (TTL: ${a.TTL})\n`))
                      );
                    }
                  }
                }
              } catch {
                // Fallback to HackerTarget
                const res = await fetchWithTimeout(`https://api.hackertarget.com/dnslookup/?q=${sanitizedTarget}`);
                controller.enqueue(enc(await res.text() + "\n"));
              }
            }

            // ── CLOUD HEADER SCANNER ────────────────────────────────────────────
            else if (tool === "Cloud Header Scanner") {
              controller.enqueue(enc(`[INFO] Probing web server headers and security posture...\n\n`));
              const urlToFetch = sanitizedTarget.startsWith("http") ? sanitizedTarget : `https://${sanitizedTarget}`;
              
              try {
                const res = await fetchWithTimeout(urlToFetch, { method: "HEAD" }, 8000);
                controller.enqueue(enc(`[HTTP] Status: ${res.status} ${res.statusText}\n\n`));
                controller.enqueue(enc(`── Response Headers ──────────────────────────────\n`));
                res.headers.forEach((value, key) => controller.enqueue(enc(`  ${key}: ${value}\n`)));

                // Security header analysis
                controller.enqueue(enc(`\n── Security Header Analysis ──────────────────────\n`));
                const secHeaders = ["strict-transport-security","content-security-policy","x-frame-options","x-content-type-options","permissions-policy","referrer-policy"];
                for (const h of secHeaders) {
                  const val = res.headers.get(h);
                  controller.enqueue(enc(val ? `[✓] ${h}: PRESENT\n` : `[✗] ${h}: MISSING\n`));
                }
                
                // Interesting headers
                const server = res.headers.get("server");
                const powered = res.headers.get("x-powered-by");
                if (server) controller.enqueue(enc(`\n[!] Server fingerprint: ${server}\n`));
                if (powered) controller.enqueue(enc(`[!] Technology stack: ${powered}\n`));
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                controller.enqueue(enc(`[-] Connection failed: ${msg}\n`));
                // Try HTTP fallback
                try {
                  controller.enqueue(enc(`[*] Trying HTTP fallback...\n`));
                  const httpUrl = `http://${sanitizedTarget}`;
                  const res2 = await fetchWithTimeout(httpUrl, { method: "HEAD" }, 8000);
                  controller.enqueue(enc(`[HTTP] Status: ${res2.status}\n`));
                  res2.headers.forEach((v, k) => controller.enqueue(enc(`  ${k}: ${v}\n`)));
                } catch { controller.enqueue(enc(`[-] HTTP fallback also failed.\n`)); }
              }
            }

            // ── CLOUD DIRSEARCH ──────────────────────────────────────────────────
            else if (tool === "Cloud Dirsearch (Basic Fuzzer)") {
              controller.enqueue(enc(`[INFO] Starting cloud directory fuzzer...\n`));
              const paths = [
                "admin","login","api","robots.txt",".git","wp-admin","backup","config",
                "test","dev","sitemap.xml",".env","swagger","dashboard","console",
                "api/v1","api/v2","graphql","health","metrics","actuator","phpmyadmin",
                ".htaccess","server-status","wp-config.php","secret","upload","uploads",
              ];
              controller.enqueue(enc(`[*] Fuzzing ${paths.length} paths on ${sanitizedTarget}...\n\n`));
              const base = sanitizedTarget.startsWith("http") ? sanitizedTarget : `https://${sanitizedTarget}`;

              const interesting: string[] = [];
              const results = await Promise.allSettled(
                paths.map(async path => {
                  try {
                    const res = await fetchWithTimeout(`${base}/${path}`, { method: "HEAD" }, 6000);
                    return { path, status: res.status };
                  } catch {
                    return { path, status: -1 };
                  }
                })
              );

              for (const r of results) {
                if (r.status === "fulfilled") {
                  const { path, status } = r.value;
                  if (status === 200 || status === 301 || status === 302 || status === 403) {
                    controller.enqueue(enc(`[+] /${path} → ${status}\n`));
                    interesting.push(path);
                  } else if (status === -1) {
                    controller.enqueue(enc(`[-] /${path} → TIMEOUT\n`));
                  } else {
                    controller.enqueue(enc(`    /${path} → ${status}\n`));
                  }
                }
              }

              controller.enqueue(enc(`\n[SUMMARY] ${interesting.length} interesting paths found.\n`));
            }

            else {
              controller.enqueue(enc(`[CRITICAL] Unknown module: ${tool}\n`));
            }

          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            controller.enqueue(enc(`\n[FATAL] Execution error: ${msg}\n`));
          }

          controller.enqueue(enc(`\n${"=".repeat(72)}\n`));
          controller.enqueue(enc(`> Cloud execution complete.\n`));
          controller.close();
        }
      });

      return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
    }

    // Non-cloud fallback response
    const stream = new ReadableStream({
      start(controller) {
        const enc = (s: string) => new TextEncoder().encode(s);
        controller.enqueue(enc(`> Phoenix OS Engine\n${"=".repeat(72)}\n\n`));
        controller.enqueue(enc(`[CRITICAL] Native OS execution is disabled in Vercel environment.\n`));
        controller.enqueue(enc(`[SOLUTION] Select a tool from the Cloud Engines group.\n\n`));
        controller.enqueue(enc(`${"=".repeat(72)}\n> Process terminated.\n`));
        controller.close();
      }
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
