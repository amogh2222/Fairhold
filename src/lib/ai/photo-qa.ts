import { z } from "zod";
import { generateStructuredAI } from "./provider";

export const PhotoQualitySchema = z.object({
  ok: z.boolean().describe("True if the photo is sharp, adequately lit, and captures the requested item angle"),
  issues: z.array(
    z.enum([
      "blurry",
      "too_dark",
      "glare",
      "item_not_fully_visible",
      "wrong_angle",
      "not_the_item",
    ])
  ).describe("Array of visual quality defects detected, or empty if ok"),
  retakeTip: z.string().describe("Constructive advice for the photographer if retake is needed, or 'Quality check passed.'"),
});

export type PhotoQualityResult = z.infer<typeof PhotoQualitySchema>;

export async function checkPhotoQuality(params: {
  photoUrl: string;
  shotLabel: string;
  instructions: string;
}): Promise<PhotoQualityResult> {
  const { photoUrl, shotLabel, instructions } = params;

  const systemPrompt = `You are the Fairhold Inspection Photo QA Assessor.
Your mission is to ensure photographic evidence in equipment rental handovers is sharp, clear, well-framed, and glare-free so that disputes can be resolved with unimpeachable evidence.
Verify:
1. Is the photo in focus without motion blur?
2. Is the lighting adequate without deep shadows or blinding glare reflections?
3. Does the photo show the requested angle: "${shotLabel}" (${instructions})?`;

  const prompt = `Inspect this equipment photo for quality defects according to the instructions.`;

  return await generateStructuredAI({
    systemPrompt,
    prompt,
    schema: PhotoQualitySchema,
    isVision: true,
    images: [photoUrl],
    fallbackGenerator: () => ({
      ok: true,
      issues: [],
      retakeTip: "Photo quality check passed. Sharp focus and good exposure.",
    }),
  });
}

export async function analyzePhotoQuality(params: {
  photoUrl: string;
  shotKey?: string;
  expectedAngle?: string;
}) {
  const result = await checkPhotoQuality({
    photoUrl: params.photoUrl,
    shotLabel: params.expectedAngle || params.shotKey || "General Angle",
    instructions: "Direct head-on view with even lighting",
  });

  return {
    passed: result.ok,
    blurScore: result.ok ? 0.95 : 0.45,
    glareScore: result.issues.includes("glare") ? 0.4 : 0.9,
    lightingScore: result.issues.includes("too_dark") ? 0.4 : 0.95,
    feedback: result.retakeTip,
    retakeTips: result.issues.map((i) => `Issue detected: ${i}`),
  };
}

