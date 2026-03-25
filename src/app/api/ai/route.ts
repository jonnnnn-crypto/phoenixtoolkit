import { NextResponse } from "next/server";

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "meta-llama/llama-3.1-8b-instruct:free", // Extremely fast
];

const HF_MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
];

export const maxDuration = 60; // Pro plan only, but kept for compatibility

export async function POST(req: Request) {
  const startTime = Date.now();
  const VERCEL_FREE_LIMIT = 9000; // 9 seconds absolute deadline for safety

  try {
    const { message, systemPrompt, messages: history } = await req.json();

    let finalMessages = [];
    if (history && Array.isArray(history) && history.length > 0) {
      finalMessages = history;
    } else {
      if (systemPrompt) finalMessages.push({ role: "system", content: systemPrompt });
      finalMessages.push({ role: "user", content: message });
    }

    const orKey = (process.env.OPENROUTER_API_KEY || "").trim();
    let lastError = "";

    if (orKey) {
      const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
      
      for (const model of modelsToTry) {
        const elapsed = Date.now() - startTime;
        const timeLeft = VERCEL_FREE_LIMIT - elapsed;
        
        // If we have less than 2 seconds left, don't even try a heavy model, skip to last or fail
        if (timeLeft < 2000) break;

        try {
          const controller = new AbortController();
          // Patience: 5s for primary, or whatever is left for fallbacks
          const patience = model === PRIMARY_MODEL ? Math.min(5000, timeLeft) : timeLeft;
          const timeoutId = setTimeout(() => controller.abort(), patience); 
          
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${orKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
              "X-Title": "Phoenix CyberSec Toolkit",
            },
            body: JSON.stringify({
              model: model,
              messages: finalMessages,
              max_tokens: 16384,
              reasoning: { enabled: true }
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const choice = data?.choices?.[0];
            const content = choice?.message?.content;
            
            if (content) {
              const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
              return NextResponse.json({ 
                result: clean, 
                provider: `OR (${model === PRIMARY_MODEL ? "Nemotron" : "Failover"})`,
                reasoning_details: choice?.message?.reasoning_details || null
              });
            }
          } else {
            lastError = `OR [${model}]: ${response.status}`;
            if (response.status === 401 || response.status === 403) break;
          }
        } catch (e: unknown) {
          lastError = `OR Timeout/Error [${model}]`;
          continue;
        }
      }
    }

    // Final ultra-fast fallback or error return
    return NextResponse.json(
      { error: `AI Execution took too long or failed. ${lastError}. Please try a shorter prompt.` },
      { status: 504 } 
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
