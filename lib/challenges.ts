import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { paths } from "./config.ts";

export type ChallengeConfig = {
  slug: string;
  title: string;
  language: "python" | "typescript" | "cpp";
  level: "junior" | "mid";
  image: string;
  domain?: string;
  summary?: string;
  dsa_topics?: string[];
  interview_design?: {
    repo_shape?: string;
    candidate_mode?: string;
    intentional_todos?: number;
  };
  task: string;
  grading?: {
    bench_target_ms?: number;
    bench_baseline_ms?: number;
    golden_target_pct?: number;
    missions?: Array<{
      id: string;
      name: string;
      concepts: string[];
      weight: number;
      benchmark: string;
    }>;
  };
  agent?: { refusal_topics?: string[] };
};

export function listChallengeConfigs(): ChallengeConfig[] {
  if (!fs.existsSync(paths.challenges)) return [];
  return fs.readdirSync(paths.challenges, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(paths.challenges, entry.name, "challenge.yaml");
      if (!fs.existsSync(file)) return null;
      return yaml.load(fs.readFileSync(file, "utf8")) as ChallengeConfig;
    })
    .filter((challenge): challenge is ChallengeConfig => Boolean(challenge?.slug));
}

export function getChallenge(slug: string) {
  return listChallengeConfigs().find((challenge) => challenge.slug === slug);
}

export function challengeRoot(slug: string) {
  return path.join(paths.challenges, slug);
}
