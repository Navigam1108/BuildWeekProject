import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { tool } from "ai";
import { z } from "zod";

function safePath(repoPath: string, requested = "") {
  const root = path.resolve(repoPath);
  const resolved = path.resolve(root, requested || ".");
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("Path is outside the repository");
  return resolved;
}

async function grep(repoPath: string, pattern: string, glob?: string) {
  return await new Promise<string>((resolve, reject) => {
    const args = ["-n", "--no-heading", "-m", "50", pattern, "."];
    if (glob) args.splice(4, 0, "-g", glob);
    const child = spawn("rg", args, { cwd: repoPath, shell: process.platform === "win32" });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", () => undefined);
    const timer = setTimeout(() => { child.kill(); reject(new Error("grep timed out")); }, 10_000);
    child.on("error", reject);
    child.on("close", (code) => { clearTimeout(timer); resolve(code === 1 ? "No matches." : output.slice(0, 12_000)); });
  });
}

export function scoutTools(repoPath: string, symbols: Array<Record<string, unknown>>) {
  return {
    search_symbols: tool({
      description: "Find definitions in the precomputed symbol index by name.",
      parameters: z.object({ query: z.string().min(1).max(100) }),
      execute: async ({ query }) => symbols.filter((symbol) => String(symbol.name).toLowerCase().includes(query.toLowerCase())).slice(0, 25)
    }),
    grep_repo: tool({
      description: "Search repository text for a pattern. Read-only.",
      parameters: z.object({ pattern: z.string().min(1).max(200), glob: z.string().max(100).optional() }),
      execute: async ({ pattern, glob }) => grep(repoPath, pattern, glob)
    }),
    read_file: tool({
      description: "Read up to 200 lines from a repository file.",
      parameters: z.object({ path: z.string().min(1), start_line: z.number().int().min(1).optional(), end_line: z.number().int().min(1).optional() }),
      execute: async ({ path: requestedPath, start_line, end_line }) => {
        const file = safePath(repoPath, requestedPath);
        const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
        const start = (start_line || 1) - 1;
        const end = Math.min(lines.length, end_line || start + 200, start + 200);
        return lines.slice(start, end).map((line, index) => `${start + index + 1}: ${line}`).join("\n");
      }
    }),
    list_dir: tool({
      description: "List files and directories in the repository.",
      parameters: z.object({ path: z.string().optional() }),
      execute: async ({ path: requestedPath }) => {
        const root = safePath(repoPath, requestedPath);
        const entries: string[] = [];
        const walk = (dir: string, prefix: string) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if ([".git", "node_modules", "__pycache__"].includes(entry.name)) continue;
            entries.push(`${prefix}${entry.name}${entry.isDirectory() ? "/" : ""}`);
            if (entries.length >= 200) return;
            if (entry.isDirectory()) walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
          }
        };
        walk(root, "");
        return entries.slice(0, 200);
      }
    })
  };
}
