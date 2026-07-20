export const POLICY_REFUSAL = "I can help you navigate, not solve — try asking where something lives or what it does.";

export type ScoutPolicyDecision = {
  allowed: boolean;
  category: "allowed" | "prompt_injection" | "solution_request" | "oversized_request";
};

/**
 * A small, intentionally conservative pre-flight check. The model prompt remains
 * a second layer, but this prevents obvious requests from ever reaching it.
 */
export function evaluateScoutMessage(message: string): ScoutPolicyDecision {
  const normalized = message.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized.length > 2_000) return { allowed: false, category: "oversized_request" };

  if (/(ignore|override|bypass).{0,40}(instruction|rule|guardrail|system|prompt)|jailbreak|reveal.{0,30}(system|prompt|instruction)/i.test(normalized)) {
    return { allowed: false, category: "prompt_injection" };
  }

  const asksForAChange = /\b(solve|fix|debug|diagnose|optimi[sz]e|implement|complete|write|patch|refactor|improve)\b/.test(normalized);
  const asksForDiagnosis = /\b(bottleneck|root cause|performance issue|slow(?:est)?|bug|failing test|what should i change|how should i)\b/.test(normalized);
  const asksForStrategy = /\b(algorithm|data structure|approach|solution)\b/.test(normalized);
  if (asksForAChange || asksForDiagnosis || (asksForStrategy && /\b(repository|repo|this code|task|challenge)\b/.test(normalized))) {
    return { allowed: false, category: "solution_request" };
  }

  return { allowed: true, category: "allowed" };
}
