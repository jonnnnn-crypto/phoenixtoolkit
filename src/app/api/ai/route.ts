import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, systemPrompt } = await req.json();

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: message });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-R1",
        messages,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF Router Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content || "";

    // Strip <think>...</think> reasoning blocks
    const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    return NextResponse.json({ result: clean });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
