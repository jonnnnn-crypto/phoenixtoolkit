import { NextResponse } from "next/server";

const HF_MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
  "HuggingFaceH4/zephyr-7b-beta",
];

export async function POST(req: Request) {
  try {
    const { message, systemPrompt } = await req.json();

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: message });

    let lastError = "";

    // ── APPROACH 1: OpenRouter (Primary Model: Step-3.5-Flash-Free) ──────────
    const orKey = process.env.OPENROUTER_API_KEY || "";
    
    if (orKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey.trim()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
            "X-Title": "Phoenix CyberSec Toolkit",
          },
          body: JSON.stringify({
            model: "stepfun/step-3.5-flash:free",
            messages: messages,
            max_tokens: 4000,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            return NextResponse.json({ result: clean, provider: "OpenRouter (Step-3.5-Flash)" });
          }
        } else {
          const errText = await response.text();
          lastError = `OpenRouter: HTTP ${response.status} - ${errText.slice(0, 200)}`;
        }
      } catch (e: unknown) {
        lastError = `OpenRouter Exception: ${e instanceof Error ? e.message : String(e)}`;
      }
    } else {
      lastError = "OpenRouter: API Key is missing in environment variables.";
    }

    // ── APPROACH 2: Legacy HF Inference (Fallback) ──────────────────────────
    const hfKey = process.env.HF_TOKEN || "";
    if (hfKey) {
      for (const model of HF_MODELS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${hfKey.trim()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: `${systemPrompt ? systemPrompt + "\n\n" : ""}User: ${message}\nAssistant:`,
                parameters: { max_new_tokens: 1500, return_full_text: false },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

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
      { error: `AI Connection Failed. Details: ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
