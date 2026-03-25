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

    // ── APPROACH 1: OpenRouter (Reliable Free Tier) ──────────────────────────
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: messages,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          return NextResponse.json({ result: clean, provider: "OpenRouter (Free)" });
        }
      } else {
        lastError = `OpenRouter: HTTP ${response.status}`;
      }
    } catch (e: unknown) {
      lastError = `OpenRouter Exception: ${e instanceof Error ? e.message : String(e)}`;
    }

    // ── APPROACH 2: Legacy HF Inference (Often Free) ─────────────────────────
    for (const model of HF_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        // Standard Inference API (Not V1) - use 'inputs' format
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.HF_TOKEN}`,
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
          // Legacy format returns array like [{ generated_text: "..." }]
          const content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
          if (content) {
            const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            return NextResponse.json({ result: clean, provider: `HF Legacy (${model})` });
          }
        } else {
          const errText = await response.text();
          lastError = `HF Legacy [${model}]: HTTP ${response.status} - ${errText.slice(0, 100)}`;
        }
      } catch (e: unknown) {
        lastError = `HF Legacy [${model}] Exception: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // ── APPROACH 3: HF Router (Final Attempt) ────────────────────────────────
    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-R1",
          messages: messages,
          max_tokens: 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          return NextResponse.json({ result: clean, provider: "HF Router (Fallback)" });
        }
      }
    } catch {}

    return NextResponse.json(
      { error: `AI Unreachable. All fallbacks failed. ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
