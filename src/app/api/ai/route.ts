import { NextResponse } from "next/server";

// Free HF Serverless Inference API (separate quota from HF Router)
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

    for (const model of HF_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.HF_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 3000,
              stream: false,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model}: HTTP ${response.status} — ${errText.slice(0, 150)}`;
          continue;
        }

        const data = await response.json();
        const content: string = data?.choices?.[0]?.message?.content || "";

        if (!content) { lastError = `${model}: empty response`; continue; }

        // Strip <think>...</think> reasoning blocks
        const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

        return NextResponse.json({ result: clean, model });

      } catch (e: unknown) {
        lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
        continue;
      }
    }

    return NextResponse.json(
      { error: `All models failed. Last: ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
