import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { config } from "../config";

export function scoutModel() {
  if (config.agentProvider === "anthropic") return anthropic(config.anthropicModel);
  const local = createOpenAICompatible({ name: "local", baseURL: config.localLlmBaseUrl });
  return local.chatModel(config.localLlmModel);
}
