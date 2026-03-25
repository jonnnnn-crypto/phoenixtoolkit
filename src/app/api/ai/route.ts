import { NextResponse } from "next/server";

// NEW Primary model verified for high accuracy (Strawberry Test 100% Pass)
const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

// Fallbacks strictly for 429 (Rate Limit) or 503 (Overloaded) scenarios
const FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-2-9b-it:free",
];

const HF_MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
];

export const maxDuration = 60; 

export async function POST(req: Request) {
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

    // ── APPROACH 1: OpenRouter (Nemotron Priority + Fallback) ─────────────────
    if (orKey) {
      const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
      
      for (const model of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout for Vercel Free stability
          
          const requestBody: any = {
            model: model,
            messages: finalMessages,
            max_tokens: 16384,
            reasoning: { enabled: true }
          };

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${orKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
              "X-Title": "Phoenix CyberSec Toolkit",
            },
            body: JSON.stringify(requestBody),
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
                provider: `OpenRouter (${model === PRIMARY_MODEL ? "Nemotron-3" : "Failover: " + model})`,
                reasoning_details: choice?.message?.reasoning_details || null
              });
            }
          } else {
            const status = response.status;
            const errText = await response.text();
            lastError = `OR [${model}]: ${status} - ${errText.slice(0, 100)}`;
            if (status === 401 || status === 403) break;
            continue; // Try next model on 429/503/404
          }
        } catch (e: unknown) {
          lastError = `OR Exception [${model}]: ${e instanceof Error ? e.message : String(e)}`;
          continue;
        }
      }
    }

    // ── APPROACH 2: Legacy HF Inference (Disaster Fallback) ──────────────────
    const hfKey = (process.env.HF_TOKEN || "").trim();
    if (hfKey) {
      for (const model of HF_MODELS) {
        try {
          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${hfKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: `${systemPrompt ? systemPrompt + "\n\n" : ""}User: ${message}\nAssistant:`,
                parameters: { max_new_tokens: 2048, return_full_text: false },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
            if (content) {
              const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
              return NextResponse.json({ result: clean, provider: `HF Legacy (${model})` });
            }
          }
        } catch {}
      }
    }

    return NextResponse.json(
      { error: `AI Unreachable. ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
