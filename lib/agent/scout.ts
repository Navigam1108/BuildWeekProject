import fs from "node:fs";
import path from "node:path";
import { streamText } from "ai";
import { getDb, getMessages, getSessionByToken } from "../db";
import { challengeRoot } from "../challenges";
import { buildScoutPrompt } from "./prompt";
import { scoutModel } from "./provider";
import { scoutTools } from "./tools";

export function streamScout(token: string, message: string) {
  const session = getSessionByToken(token);
  if (!session || session.status !== "active") throw new Error("SESSION_NOT_ACTIVE");
  if (!session.agent_enabled) throw new Error("AGENT_DISABLED");
  if (!session.repo_path) throw new Error("REPOSITORY_NOT_READY");
  const symbolsPath = path.join(challengeRoot(session.challenge_slug), "agent", "symbols.json");
  const symbols = fs.existsSync(symbolsPath) ? JSON.parse(fs.readFileSync(symbolsPath, "utf8")) as Array<Record<string, unknown>> : [];
  const history = getMessages(session.id, 20).filter((item) => item.role === "candidate" || item.role === "scout").map((item) => ({ role: item.role === "candidate" ? "user" as const : "assistant" as const, content: item.content }));
  getDb().prepare("INSERT INTO agent_messages (session_id, role, content, created_at) VALUES (?, 'candidate', ?, ?)").run(session.id, message, new Date().toISOString());
  return streamText({
    model: scoutModel(),
    system: buildScoutPrompt(session.challenge_slug),
    messages: [...history, { role: "user", content: message }],
    tools: scoutTools(session.repo_path, symbols),
    maxSteps: 8,
    onFinish: ({ text }) => {
      getDb().prepare("INSERT INTO agent_messages (session_id, role, content, created_at) VALUES (?, 'scout', ?, ?)").run(session.id, text, new Date().toISOString());
    }
  });
}
