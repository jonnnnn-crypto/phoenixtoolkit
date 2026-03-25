import { NextResponse } from "next/server";

const OPENROUTER_FREE_MODELS = [
  "stepfun/step-3.5-flash:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/pixtral-12b:free",
];

const HF_MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
  "HuggingFaceH4/zephyr-7b-beta",
];

export async function POST(req: Request) {
  try {
    const { message, systemPrompt, messages: history } = await req.json();

    // Construct message history: priority to 'history' if provided for multi-turn
    let finalMessages = [];
    if (history && Array.isArray(history)) {
      finalMessages = history;
    } else {
      if (systemPrompt) finalMessages.push({ role: "system", content: systemPrompt });
      finalMessages.push({ role: "user", content: message });
    }

    let lastError = "";

    // ── APPROACH 1: OpenRouter (Multi-Model Free Rotation with Reasoning) ───
    const orKey = (process.env.OPENROUTER_API_KEY || "").trim();
    
    if (orKey) {
      for (const model of OPENROUTER_FREE_MODELS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);
          
          const requestBody: any = {
            model: model,
            messages: finalMessages,
            max_tokens: 4000,
          };

          // Enable 'reasoning' for the primary Step-3.5 model as requested
          if (model.includes("step-3.5")) {
             requestBody.reasoning = { enabled: true };
          }

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
              // Strip <think> tags (from DeepSeek) or handle reasoning_details if needed
              const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
              
              // Return both content and reasoning_details for multi-turn persistence
              return NextResponse.json({ 
                result: clean, 
                provider: `OpenRouter (${model})`,
                reasoning_details: choice?.message?.reasoning_details || null
              });
            }
          } else {
            const errText = await response.text();
            lastError = `OpenRouter [${model}]: ${response.status} - ${errText.slice(0, 150)}`;
            if (response.status === 429) continue;
            if (response.status === 401 || response.status === 403) break;
          }
        } catch (e: unknown) {
          lastError = `OpenRouter Exception [${model}]: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    }

    // ── APPROACH 2: Legacy HF Inference (Fallback) ──────────────────────────
    const hfKey = (process.env.HF_TOKEN || "").trim();
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
                "Authorization": `Bearer ${hfKey}`,
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
      { error: `AI Execution Failure. ${lastError}` },
      { status: 503 }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
