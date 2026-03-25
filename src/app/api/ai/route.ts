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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
          "X-Title": "Phoenix CyberSec Toolkit",
        },
        body: JSON.stringify({
          model: "stepfun/step-3.5-flash:free", // Specified by user
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
        const errJson = await response.json().catch(() => ({}));
        lastError = `OpenRouter: HTTP ${response.status} - ${JSON.stringify(errJson)}`;
      }
    } catch (e: unknown) {
      lastError = `OpenRouter Exception: ${e instanceof Error ? e.message : String(e)}`;
    }

    // ── APPROACH 2: Legacy HF Inference (Fallback) ──────────────────────────
    for (const model of HF_MODELS) {
      if (lastError.includes("401") || lastError.includes("403")) break; // Don't try HF if OR fails on keys
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

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
          const content = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
          if (content) {
            const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            return NextResponse.json({ result: clean, provider: `HF Legacy (${model})` });
          }
        }
      } catch {}
    }

    return NextResponse.json(
      { error: `AI Connection Failed. ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
