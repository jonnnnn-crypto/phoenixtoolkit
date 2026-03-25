import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, systemPrompt } = await req.json();

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: message });

    // ── Provider Chain: Try each until one works ──────────────────────────────
    const providers = [
      {
        name: "HuggingFace Router (DeepSeek-R1)",
        url: "https://router.huggingface.co/v1/chat/completions",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-R1",
          messages,
          max_tokens: 4000,
        }),
      },
      {
        name: "HuggingFace Inference API (Llama-3.3-70B)",
        url: "https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages,
          max_tokens: 3000,
          stream: false,
        }),
      },
      {
        name: "OpenRouter (Llama-3.1-8B Free)",
        url: "https://openrouter.ai/api/v1/chat/completions",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
          "X-Title": "Phoenix CyberSec Toolkit",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages,
          max_tokens: 3000,
        }),
      },
    ];

    let lastError = "";

    for (const provider of providers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(provider.url, {
          method: "POST",
          headers: provider.headers as Record<string, string>,
          body: provider.body,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${provider.name}: ${response.status} ${errText.slice(0, 200)}`;
          console.warn(`[AI Route] Provider failed: ${lastError}`);
          continue; // Try next provider
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
          lastError = `${provider.name}: Empty response`;
          continue;
        }

        // Strip <think>...</think> reasoning blocks (DeepSeek-R1 artifact)
        const clean = content
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .trim();

        return NextResponse.json({
          result: clean,
          provider: provider.name,
        });

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        lastError = `${provider.name}: ${msg}`;
        console.warn(`[AI Route] Provider exception: ${lastError}`);
        continue;
      }
    }

    // All providers failed
    return NextResponse.json(
      { error: `All AI providers failed. Last error: ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
