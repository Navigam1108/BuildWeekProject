import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const slug = process.argv[2]
if (!slug) throw new Error("Usage: node scripts/calibrate-variants.mjs <slug>")
const challengeRoot = path.join(root, "challenges", slug)
const manifest = JSON.parse(fs.readFileSync(path.join(challengeRoot, "variants", "manifest.json"), "utf8"))
const variantsModule = pathToFileURL(path.join(root, "lib", "variants.ts")).href

function makeVariant(seed) {
  const code = `import { createVariant } from ${JSON.stringify(variantsModule)}; console.log(JSON.stringify(createVariant(${JSON.stringify(slug)}, ${seed})))`
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", code], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

function commandFor(language, directory, benchmarkPath) {
  const benchmark = benchmarkPath ? path.relative(directory, benchmarkPath) : null
  if (language === "python") return [process.platform === "win32" ? "python" : "python3", [benchmark || "benchmarks/bench.py"]]
  if (language === "typescript") return [process.execPath, [benchmark || "benchmarks/bench.mjs"]]
  if (benchmark) return ["g++", ["-std=c++20", "-O2", "-Iinclude", "src/router.cpp", benchmark]]
  return ["make", ["bench"]]
}

function runBenchmark(directory, language, benchmarkPath) {
  const env = language === "python" ? { ...process.env, PYTHONPATH: directory } : process.env
  const timeout = Number(process.env.VARIANT_CALIBRATION_TIMEOUT_MS || 120_000)
  let result
  let executable
  if (language === "cpp" && benchmarkPath) {
    executable = path.join(os.tmpdir(), `scout-${Date.now()}-${Math.random().toString(16).slice(2)}${process.platform === "win32" ? ".exe" : ""}`)
    const compile = spawnSync("g++", ["-std=c++20", "-O2", "-Iinclude", "src/router.cpp", path.relative(directory, benchmarkPath), "-o", executable], { cwd: directory, env, encoding: "utf8", timeout })
    result = compile.status === 0 ? spawnSync(executable, [], { cwd: directory, env, encoding: "utf8", timeout }) : compile
  } else {
    const [command, args] = commandFor(language, directory, benchmarkPath)
    result = spawnSync(command, args, { cwd: directory, env, encoding: "utf8", timeout })
  }
  const output = `${result.stdout || ""}\n${result.stderr || ""}`
  const metrics = Object.fromEntries([...output.matchAll(/([a-z0-9_-]+)_ms=([0-9.]+)/gi)].map((match) => [match[1], Number(match[2])]))
  if (executable) fs.rmSync(executable, { force: true })
  return { ok: result.status === 0, metrics, output: output.trim().slice(-2_000) }
}

function withVariant(directory, variant, language, fallbackSource) {
  const benchmarkDir = path.join(directory, "benchmarks")
  fs.mkdirSync(benchmarkDir, { recursive: true })
  const file = path.join(benchmarkDir, "variant.json")
  const previous = fs.existsSync(file) ? fs.readFileSync(file) : null
  const configFile = path.join(benchmarkDir, "variant.cfg")
  const previousConfig = fs.existsSync(configFile) ? fs.readFileSync(configFile) : null
  const benchmarkName = language === "python" ? "variant-calibration.py" : language === "typescript" ? "variant-calibration.mjs" : "variant-calibration.cpp"
  const fallbackBenchmark = path.join(benchmarkDir, benchmarkName)
  const hasBenchmark = fs.existsSync(path.join(benchmarkDir, language === "python" ? "bench.py" : language === "typescript" ? "bench.mjs" : "bench.cpp"))
  if (!hasBenchmark && fallbackSource) fs.copyFileSync(fallbackSource, fallbackBenchmark)
  fs.writeFileSync(file, `${JSON.stringify(variant, null, 2)}\n`)
  fs.writeFileSync(configFile, `count_multiplier=${variant.fixture.count_multiplier}\nindex_offset=${variant.fixture.index_offset}\nhotspot_mod=${variant.fixture.hotspot_mod}\nburst_repeats=${variant.fixture.burst_repeats}\n`)
  const benchmarkPath = hasBenchmark ? path.join(benchmarkDir, language === "python" ? "bench.py" : language === "typescript" ? "bench.mjs" : "bench.cpp") : fallbackBenchmark
  try { return runBenchmark(directory, language, benchmarkPath) } finally {
    if (previous) fs.writeFileSync(file, previous)
    else fs.rmSync(file, { force: true })
    if (previousConfig) fs.writeFileSync(configFile, previousConfig)
    else fs.rmSync(configFile, { force: true })
    if (!hasBenchmark) fs.rmSync(fallbackBenchmark, { force: true })
  }
}

const yamlLanguage = fs.readFileSync(path.join(challengeRoot, "challenge.yaml"), "utf8").match(/^language:\s*(\w+)/m)?.[1] || "python"
const requestedSeeds = process.env.VARIANT_SEEDS?.split(",").map(Number).filter(Number.isFinite)
const seeds = requestedSeeds?.length ? requestedSeeds : manifest.calibration?.representative_seeds || [101, 202, 303]
const records = []
for (const seed of seeds) {
  const variant = makeVariant(seed)
  const candidate = withVariant(path.join(challengeRoot, "repo"), variant, yamlLanguage)
  const goldenDir = path.join(challengeRoot, "golden")
  const candidateBenchmark = path.join(challengeRoot, "repo", "benchmarks", yamlLanguage === "python" ? "bench.py" : yamlLanguage === "typescript" ? "bench.mjs" : "bench.cpp")
  const golden = fs.existsSync(goldenDir)
    ? withVariant(goldenDir, variant, yamlLanguage, candidateBenchmark)
    : { ok: false, metrics: {}, output: "golden benchmark unavailable" }
  records.push({ seed, family: variant.family, candidate, golden })
}
fs.writeFileSync(path.join(challengeRoot, "variants", "calibration.json"), `${JSON.stringify({ slug, generated_at: new Date().toISOString(), records }, null, 2)}\n`)
console.log(`Wrote ${records.length} calibration records to challenges/${slug}/variants/calibration.json`)
