import path from "node:path";

function intEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hostnameFrom(value: string) {
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname;
  } catch {
    return value;
  }
}

export const config = {
  adminPassword: process.env.ADMIN_PASSWORD || "demo-password",
  agentProvider: process.env.AGENT_PROVIDER || "local",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-0",
  localLlmBaseUrl: process.env.LOCAL_LLM_BASE_URL || "http://127.0.0.1:11434/v1",
  localLlmModel: process.env.LOCAL_LLM_MODEL || "qwen2.5-coder:7b",
  dataDir: path.resolve(process.env.DATA_DIR || ".data"),
  publicHost: process.env.PUBLIC_HOST || "localhost",
  sessionPortStart: intEnv(process.env.SESSION_PORT_RANGE?.split("-")[0], 40000),
  sessionPortEnd: intEnv(process.env.SESSION_PORT_RANGE?.split("-")[1], 40100),
  dockerImagePy: process.env.DOCKER_IMAGE_PY || "challenge-py",
  dockerImageTs: process.env.DOCKER_IMAGE_TS || "challenge-ts",
  dockerImageCpp: process.env.DOCKER_IMAGE_CPP || "challenge-cpp"
};

export const paths = {
  dataDir: config.dataDir,
  db: path.join(config.dataDir, "scout.sqlite"),
  sessions: path.join(config.dataDir, "sessions"),
  challenges: path.join(process.cwd(), "challenges")
};

export function publicHostname() {
  return hostnameFrom(config.publicHost);
}
