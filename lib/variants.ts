import fs from "node:fs";
import path from "node:path";
import { challengeRoot } from "./challenges.ts";

export type VariantFamily = {
  id: string;
  label: string;
  ticket_hint: string;
  count_multiplier: number;
  index_offset: number;
  hotspot_mod: number;
  burst_repeats: number;
};

export type VariantManifest = {
  version: number;
  families: VariantFamily[];
  calibration?: { representative_seeds: number[]; notes?: string };
};

export type ReplayVariant = {
  version: 1;
  challenge_slug: string;
  seed: number;
  family: string;
  label: string;
  ticket_hint: string;
  fixture: {
    count_multiplier: number;
    index_offset: number;
    hotspot_mod: number;
    burst_repeats: number;
  };
};

const DEFAULT_MANIFEST: VariantManifest = {
  version: 1,
  families: [
    { id: "steady", label: "Steady replay", ticket_hint: "steady traffic with evenly distributed records", count_multiplier: 1, index_offset: 0, hotspot_mod: 0, burst_repeats: 1 },
    { id: "burst", label: "Burst replay", ticket_hint: "a burst-heavy replay with a concentrated hot range", count_multiplier: 1.12, index_offset: 37, hotspot_mod: 7, burst_repeats: 2 },
    { id: "skewed", label: "Skewed replay", ticket_hint: "a tenant-skewed replay with repeated hot keys", count_multiplier: 0.92, index_offset: 113, hotspot_mod: 11, burst_repeats: 3 }
  ],
  calibration: { representative_seeds: [101, 202, 303], notes: "Run candidate and golden benchmarks with each representative seed on the target host." }
};

function manifestPath(slug: string) {
  return path.join(challengeRoot(slug), "variants", "manifest.json");
}

function textOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function positiveNumberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeIntegerOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : fallback;
}

function normalizeFamily(value: unknown, fallback: VariantFamily): VariantFamily | null {
  if (!value || typeof value !== "object") return null;
  const family = value as Partial<VariantFamily>;
  if (typeof family.id !== "string" || !family.id.trim()) return null;
  return {
    id: family.id.trim(),
    label: textOr(family.label, fallback.label),
    ticket_hint: textOr(family.ticket_hint, fallback.ticket_hint),
    count_multiplier: positiveNumberOr(family.count_multiplier, fallback.count_multiplier),
    index_offset: nonNegativeIntegerOr(family.index_offset, fallback.index_offset),
    hotspot_mod: nonNegativeIntegerOr(family.hotspot_mod, fallback.hotspot_mod),
    burst_repeats: Math.max(1, nonNegativeIntegerOr(family.burst_repeats, fallback.burst_repeats))
  };
}

export function getVariantManifest(slug: string): VariantManifest {
  const file = manifestPath(slug);
  if (!fs.existsSync(file)) return DEFAULT_MANIFEST;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<VariantManifest>;
    const families = Array.isArray(parsed.families)
      ? parsed.families
        .map((family, index) => normalizeFamily(family, DEFAULT_MANIFEST.families[index % DEFAULT_MANIFEST.families.length]))
        .filter((family): family is VariantFamily => family !== null)
      : [];
    return {
      ...DEFAULT_MANIFEST,
      ...parsed,
      version: nonNegativeIntegerOr(parsed.version, DEFAULT_MANIFEST.version),
      families: families.length ? families : DEFAULT_MANIFEST.families
    };
  } catch {
    return DEFAULT_MANIFEST;
  }
}

function normalizedSeed(seed: number) {
  const value = Math.trunc(seed);
  return ((value % 2_147_483_647) + 2_147_483_647) % 2_147_483_647 || 1;
}

export function createVariant(slug: string, seed: number): ReplayVariant {
  const normalized = normalizedSeed(seed);
  const manifest = getVariantManifest(slug);
  const family = manifest.families[normalized % manifest.families.length];
  const jitter = ((normalized * 48_271) % 10_000) / 10_000;
  const multiplier = Number((family.count_multiplier * (0.96 + jitter * 0.08)).toFixed(4));
  return {
    version: 1,
    challenge_slug: slug,
    seed: normalized,
    family: family.id,
    label: family.label,
    ticket_hint: family.ticket_hint,
    fixture: {
      count_multiplier: multiplier,
      index_offset: family.index_offset + (normalized % 97),
      hotspot_mod: family.hotspot_mod,
      burst_repeats: family.burst_repeats
    }
  };
}

export function writeSessionVariant(repoPath: string, slug: string, seed: number) {
  const variant = createVariant(slug, seed);
  const benchmarkDir = path.join(repoPath, "benchmarks");
  fs.mkdirSync(benchmarkDir, { recursive: true });
  fs.writeFileSync(path.join(benchmarkDir, "variant.json"), `${JSON.stringify(variant, null, 2)}\n`);
  fs.writeFileSync(path.join(benchmarkDir, "variant.cfg"), `count_multiplier=${variant.fixture.count_multiplier}\nindex_offset=${variant.fixture.index_offset}\nhotspot_mod=${variant.fixture.hotspot_mod}\nburst_repeats=${variant.fixture.burst_repeats}\n`);
  const taskPath = path.join(repoPath, "TASK.md");
  if (fs.existsSync(taskPath)) {
    const task = fs.readFileSync(taskPath, "utf8");
    const marker = "<!-- SESSION_VARIANT -->";
    const block = `${marker}\nReplay profile: ${variant.ticket_hint}.`;
    const withoutPrevious = task.replace(new RegExp(`${marker}[\\s\\S]*$`), "").trimEnd();
    fs.writeFileSync(taskPath, `${withoutPrevious}\n\n${block}\n`);
  }
  return variant;
}

export function readRepoVariant(repoPath: string): ReplayVariant | null {
  const file = path.join(repoPath, "benchmarks", "variant.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as ReplayVariant;
}
