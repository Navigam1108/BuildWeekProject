import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Docker from "dockerode";
import { nanoid } from "nanoid";
import { config, paths } from "./config";
import { challengeRoot, getChallenge } from "./challenges";
import { getDb, getSession, type SessionRow } from "./db";

const docker = new Docker(process.platform === "win32" ? {} : { socketPath: "/var/run/docker.sock" });

function now() { return new Date().toISOString(); }

async function nextPort() {
  const used = new Set<number>(
    (getDb().prepare("SELECT ide_port FROM sessions WHERE ide_port IS NOT NULL AND status IN ('created','active')").all() as Array<{ ide_port: number }>).map((row) => row.ide_port)
  );
  for (let port = config.sessionPortStart; port <= config.sessionPortEnd; port++) {
    if (!used.has(port)) return port;
  }
  throw new Error("No free interview ports available");
}

export async function createSession(input: { challengeSlug: string; candidateName: string; durationMin?: number; candidateOrigin?: string }) {
  const challenge = getChallenge(input.challengeSlug);
  if (!challenge) throw new Error("Challenge not found");
  const id = nanoid(12);
  const token = nanoid(21);
  const idePassword = token;
  const repoPath = path.join(paths.sessions, id, "repo");
  const durationMin = Math.max(5, Math.min(240, input.durationMin || 60));
  const db = getDb();
  db.prepare(`INSERT INTO sessions (id, token, challenge_slug, candidate_name, status, agent_enabled, ide_password, repo_path, created_at, duration_min)
    VALUES (?, ?, ?, ?, 'created', 1, ?, ?, ?, ?)`).run(id, token, challenge.slug, input.candidateName.trim() || "Candidate", idePassword, repoPath, now(), durationMin);

  try {
    fs.mkdirSync(path.dirname(repoPath), { recursive: true });
    fs.cpSync(path.join(challengeRoot(challenge.slug), "repo"), repoPath, { recursive: true });
    execFileSync("git", ["init"], { cwd: repoPath, stdio: "ignore" });
    execFileSync("git", ["add", "-A"], { cwd: repoPath, stdio: "ignore" });
    execFileSync("git", ["-c", "user.email=scout@local", "-c", "user.name=Scout", "commit", "-m", "start"], { cwd: repoPath, stdio: "ignore" });

    const idePort = await nextPort();
    const image = challenge.language === "typescript" ? config.dockerImageTs : challenge.language === "cpp" ? config.dockerImageCpp : config.dockerImagePy;
    const container = await docker.createContainer({
      Image: image,
      Env: [`PASSWORD=${idePassword}`],
      WorkingDir: "/workspace",
      ExposedPorts: { "8080/tcp": {} },
      HostConfig: {
        Binds: [`${repoPath}:/workspace:rw`],
        PortBindings: { "8080/tcp": [{ HostPort: String(idePort) }] },
        CpuQuota: 200000,
        Memory: 2 * 1024 * 1024 * 1024,
        PidsLimit: 256,
        Dns: ["0.0.0.0"]
      }
    });
    await container.start();
    db.prepare("UPDATE sessions SET container_id = ?, ide_port = ?, status = 'active' WHERE id = ?").run(container.id, idePort, id);
    // Generate links from the request origin when a session is created.  This
    // preserves a local dev-server port (for example localhost:3000) instead
    // of sending candidates to port 80.
    const candidateOrigin = (input.candidateOrigin || `http://${config.publicHost}`).replace(/\/$/, "");
    return { id, token, candidateUrl: `${candidateOrigin}/s/${token}`, ideUrl: `http://${config.publicHost}:${idePort}`, idePassword };
  } catch (error) {
    db.prepare("UPDATE sessions SET status = 'error', ended_at = ? WHERE id = ?").run(now(), id);
    throw error;
  }
}

export async function endSession(session: SessionRow) {
  if (session.container_id) {
    try {
      const container = docker.getContainer(session.container_id);
      await container.stop({ t: 5 });
      await container.remove({ force: true });
    } catch {
      // The container may already have exited or been removed.
    }
  }
  getDb().prepare("UPDATE sessions SET status = 'ended', ended_at = ? WHERE id = ?").run(now(), session.id);
}

export async function getSessionState(token: string) {
  const session = getDb().prepare("SELECT s.*, c.title, c.task_md FROM sessions s JOIN challenges c ON c.slug=s.challenge_slug WHERE s.token = ?").get(token) as (SessionRow & { title: string; task_md: string }) | undefined;
  if (!session) return null;
  const expiresAt = new Date(new Date(session.created_at).getTime() + session.duration_min * 60_000);
  const timeRemaining = Math.max(0, expiresAt.getTime() - Date.now());
  if (timeRemaining === 0 && ["created", "active"].includes(session.status)) await endSession(session);
  return { ...session, time_remaining_ms: timeRemaining };
}

export async function sweepExpiredSessions() {
  const rows = getDb().prepare("SELECT * FROM sessions WHERE status IN ('created','active')").all() as SessionRow[];
  for (const session of rows) {
    const expiresAt = new Date(new Date(session.created_at).getTime() + session.duration_min * 60_000 + 10 * 60_000);
    if (expiresAt.getTime() < Date.now()) await endSession(session);
  }
}
