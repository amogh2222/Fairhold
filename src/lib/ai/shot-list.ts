import { z } from "zod";
import { generateStructuredAI } from "./provider";

export const ShotItemSchema = z.object({
  key: z.string().describe("Unique snake_case identifier for this shot, e.g. shot_front_lens"),
  label: z.string().describe("Human-readable title for the inspection screen, e.g. Front Glass & Filter Thread"),
  instructions: z.string().describe("Clear, concise capture angle and lighting direction for the inspector"),
});

export const ShotListOutputSchema = z.object({
  shots: z.array(ShotItemSchema).min(4).max(10),
});

export type ShotItem = z.infer<typeof ShotItemSchema>;

export async function generateShotList(params: {
  category: string;
  name: string;
}): Promise<ShotItem[]> {
  const { category, name } = params;

  const systemPrompt = `You are the Fairhold Inspection Architect.
Your task is to generate an essential 4 to 8 shot checklist for inspecting high-value rental equipment.
Each shot must target a specific high-wear, high-damage vulnerability (e.g. glass optics, LCD screens, gimbal motors, structural frames, electronic connectors, battery compartments).`;

  const prompt = `Generate an inspection shot list for:
Item: ${name}
Category: ${category}`;

  const result = await generateStructuredAI({
    systemPrompt,
    prompt,
    schema: ShotListOutputSchema,
    isVision: false,
    fallbackGenerator: () => ({
      shots: [
        { key: "shot_front", label: "Front Surface & Optics", instructions: "Hold camera 2 feet away. Inspect front glass, screen, or controls directly." },
        { key: "shot_rear", label: "Rear Interface & LCD", instructions: "Capture rear panel, buttons, and ports with direct lighting." },
        { key: "shot_top", label: "Top Dials & Controls", instructions: "Bird's-eye view of upper chassis, dials, or handles." },
        { key: "shot_base", label: "Bottom Base & Mount", instructions: "Inspect bottom surface, tripod mount, or battery door." },
      ],
    }),
  });

  return result.shots;
}
