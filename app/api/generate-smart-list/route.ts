import { generateObject } from "ai"
import { z } from "zod"

const smartListRuleSchema = z.object({
  id: z.string(),
  type: z.enum(["filter", "segment", "condition"]),
  label: z.string(),
  description: z.string(),
  value: z.any().optional(),
})

const smartListSchema = z.object({
  name: z.string().describe("A clear, descriptive name for the smart list"),
  description: z.string().describe("A detailed description explaining what customers this list targets and why"),
  rules: z.array(smartListRuleSchema).describe("Array of filtering rules that define the customer criteria"),
  estimatedCount: z.number().describe("Estimated number of customers that would match these criteria"),
  reasoning: z.string().describe("Explanation of why these rules were chosen for the user prompt"),
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: "openai/gpt-5",
      schema: smartListSchema,
      prompt: `
        You are an expert insurance broker assistant helping to create smart customer lists for targeted marketing and outreach.
        
        Based on the user's request, generate a smart list with appropriate filtering rules. Consider these customer attributes:
        - Demographics (age, location, family status)
        - Policy information (type, coverage level, expiration dates, premium amounts)
        - Customer behavior (engagement, claims history, payment patterns)
        - Business metrics (lifetime value, risk profile, cross-sell potential)
        - Relationship data (tenure, satisfaction scores, referral activity)
        
        Available rule types:
        - "filter": Basic demographic or policy filters (location, age, policy type)
        - "segment": Business logic segments (high-value, at-risk, cross-sell opportunities)
        - "condition": Time-based or behavioral conditions (expiring policies, recent claims, engagement patterns)
        
        User request: "${prompt}"
        
        Create a smart list that would be valuable for an insurance broker to use for targeted campaigns.
      `,
      maxOutputTokens: 1000,
      temperature: 0.7,
    })

    return Response.json({ smartList: object })
  } catch (error) {
    console.error("Error generating smart list:", error)
    return Response.json({ error: "Failed to generate smart list" }, { status: 500 })
  }
}
