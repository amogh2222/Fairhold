import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z, ZodSchema } from "zod";

export function getVisionModel() {
  const provider = (process.env.LLM_PROVIDER || "google").toLowerCase();
  const apiKey = process.env.LLM_API_KEY || "";
  const modelId = process.env.LLM_MODEL_VISION || (provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gemini-2.0-flash");

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelId);
  } else {
    const google = createGoogleGenerativeAI({ apiKey });
    return google(modelId);
  }
}

export function getTextModel() {
  const provider = (process.env.LLM_PROVIDER || "google").toLowerCase();
  const apiKey = process.env.LLM_API_KEY || "";
  const modelId = process.env.LLM_MODEL_TEXT || (provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gemini-2.0-flash");

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(modelId);
  } else {
    const google = createGoogleGenerativeAI({ apiKey });
    return google(modelId);
  }
}

export async function generateStructuredAI<T>(params: {
  systemPrompt: string;
  prompt: string;
  schema: ZodSchema<T>;
  isVision?: boolean;
  images?: string[]; // URLs or base64 data URLs
  fallbackGenerator?: () => T;
}): Promise<T> {
  const { systemPrompt, prompt, schema, isVision, images, fallbackGenerator } = params;
  const apiKey = process.env.LLM_API_KEY;

  // If no API key configured, use deterministic fallback
  if (!apiKey && fallbackGenerator) {
    return fallbackGenerator();
  }

  const model = isVision ? getVisionModel() : getTextModel();

  let lastError: Error | null = null;
  // Up to 1 retry on validation failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let content: any = prompt;
      if (images && images.length > 0) {
        content = [
          { type: "text", text: attempt === 1 ? prompt : `${prompt}\n\nNote: Your previous attempt failed schema validation: ${lastError?.message}. Please adhere strictly to the JSON schema.` },
          ...images.map((img) => ({
            type: "image",
            image: img.startsWith("data:") ? img : new URL(img, process.env.APP_BASE_URL || "http://localhost:3000"),
          })),
        ];
      }

      const result = await generateObject({
        model,
        schema,
        system: systemPrompt,
        messages: [{ role: "user", content }],
        temperature: 0,
      });

      return result.object;
    } catch (err: any) {
      lastError = err;
      if (attempt === 2) {
        if (fallbackGenerator) {
          console.warn("AI generation failed after retry, utilizing fallback generator:", err.message);
          return fallbackGenerator();
        }
        throw new Error(`AI structured generation failed after retry: ${err.message}`);
      }
    }
  }

  throw lastError || new Error("Unknown AI generation error");
}

export async function generateTextAI(params: {
  systemPrompt: string;
  prompt: string;
  fallbackText?: string;
}): Promise<string> {
  const { systemPrompt, prompt, fallbackText } = params;
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey && fallbackText) {
    return fallbackText;
  }

  try {
    const model = getTextModel();
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0,
    });
    return result.text;
  } catch (err: any) {
    if (fallbackText) return fallbackText;
    throw err;
  }
}

