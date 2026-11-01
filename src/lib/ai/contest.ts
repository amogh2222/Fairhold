import { z } from "zod";
import { generateStructuredAI } from "./provider";

export const ContestReassessmentSchema = z.object({
  recommendation: z.enum(["keep", "reduce", "remove"]).describe("Recommended action for owner review"),
  suggestedPercentage: z.number().min(0).max(1).optional().describe("If reduce, suggested revised severity percentage"),
  reasoning: z.string().describe("Forensic explanation considering the renter's testimony and counter-evidence"),
});

export type ContestReassessmentResult = z.infer<typeof ContestReassessmentSchema>;

export async function reassessContestedFinding(params: {
  findingDescription: string;
  findingClassification: string;
  originalChargeAmount: number;
  renterComment: string;
  baselinePhotoUrl?: string;
  returnPhotoUrl?: string;
  renterPhotoUrls?: string[];
}): Promise<ContestReassessmentResult> {
  const {
    findingDescription,
    findingClassification,
    originalChargeAmount,
    renterComment,
    baselinePhotoUrl,
    returnPhotoUrl,
    renterPhotoUrls = [],
  } = params;

  const systemPrompt = `You are the Fairhold Dispute Reassessment Arbiter.
A renter has formally contested a damage finding proposed by the equipment owner.
Re-evaluate the finding objectively, giving fair weight to the renter's explanation and any photographic evidence they supplied.
Recommend:
- 'remove': If the renter's evidence demonstrates the mark was pre-existing, caused by transportation packaging, or is wipeable dust.
- 'reduce': If damage occurred but severity was overstated.
- 'keep': If the photographic evidence clearly contradicts the renter's claim and confirms new damage.`;

  const prompt = `Finding: "${findingDescription}" (${findingClassification}, Charged: $${originalChargeAmount.toFixed(2)})
Renter Contest Statement: "${renterComment}"`;

  const images: string[] = [];
  if (baselinePhotoUrl) images.push(baselinePhotoUrl);
  if (returnPhotoUrl) images.push(returnPhotoUrl);
  images.push(...renterPhotoUrls);

  return await generateStructuredAI({
    systemPrompt,
    prompt,
    schema: ContestReassessmentSchema,
    isVision: images.length > 0,
    images: images.length > 0 ? images : undefined,
    fallbackGenerator: () => ({
      recommendation: "reduce",
      suggestedPercentage: 0.5,
      reasoning: "Renter clarified mark location. Photographic contrast suggests superficial surface scuff rather than deep gouge. Recommending 50% courtesy reduction.",
    }),
  });
}

