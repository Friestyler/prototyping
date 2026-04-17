import { anthropic } from "@ai-sdk/anthropic"

export const MODEL_ID = process.env.CLAUDE_MODEL_ID ?? "claude-sonnet-4-5"

export function getModel() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in env. Add it in Vercel project settings.")
  }
  return anthropic(MODEL_ID)
}
