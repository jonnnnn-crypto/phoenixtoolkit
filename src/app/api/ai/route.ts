import { NextResponse } from "next/server";

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "meta-llama/llama-3.1-8b-instruct:free",
];

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { message, systemPrompt, messages: history, stream: shouldStream } = await req.json();

    let finalMessages = [];
    if (history && Array.isArray(history) && history.length > 0) {
      finalMessages = history;
    } else {
      if (systemPrompt) finalMessages.push({ role: "system", content: systemPrompt });
      finalMessages.push({ role: "user", content: message });
    }

    const orKey = (process.env.OPENROUTER_API_KEY || "").trim();
    if (!orKey) return NextResponse.json({ error: "Missing OpenRouter API Key" }, { status: 501 });

    // ── STREAMING IMPLEMENTATION ───────────────────────────────────────────
    if (shouldStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
          let success = false;

          for (const model of modelsToTry) {
            try {
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
                  stream: true,
                  reasoning: { enabled: true }
                }),
              });

              if (!response.ok) continue; // Try next model if this one fails to start

              const reader = response.body?.getReader();
              if (!reader) continue;

              success = true;
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "").trim();
                    if (dataStr === "[DONE]") break;
                    try {
                      const json = JSON.parse(dataStr);
                      const content = json.choices?.[0]?.delta?.content || "";
                      if (content) {
                        controller.enqueue(encoder.encode(content));
                      }
                    } catch {}
                  }
                }
              }
              break; // Stop after first successful model stream finishes
            } catch (err) {
              continue;
            }
          }
          if (!success) {
            controller.enqueue(encoder.encode("[ERROR]: No AI models available or network failure."));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── NON-STREAMING FALLBACK (Standard JSON) ─────────────────────────────
    // Keep legacy support for parts of the app that don't need streaming yet
    for (const model of [PRIMARY_MODEL, ...FALLBACK_MODELS]) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://phoenixtoolkit.vercel.app",
          },
          body: JSON.stringify({
            model: model,
            messages: finalMessages,
            max_tokens: 8192,
            reasoning: { enabled: true }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ 
            result: data.choices?.[0]?.message?.content || "", 
            provider: model 
          });
        }
      } catch {}
    }

    return NextResponse.json({ error: "AI Failed" }, { status: 503 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
