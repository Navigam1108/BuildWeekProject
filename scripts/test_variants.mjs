import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const variantsModule = pathToFileURL(path.join(root, "lib", "variants.ts")).href
const probe = String.raw`
  import fs from "node:fs"
  import os from "node:os"
  import path from "node:path"
  import { createVariant, writeSessionVariant, readRepoVariant } from "${variantsModule}"
  const slug = process.argv[1]
  const first = createVariant(slug, 101)
  const repeated = createVariant(slug, 101)
  const second = createVariant(slug, 202)
  if (JSON.stringify(first) !== JSON.stringify(repeated)) throw new Error("the same seed was not deterministic")
  if (JSON.stringify(first) === JSON.stringify(second)) throw new Error("seeds produced the same variant")
  for (const [field, value] of Object.entries(first.fixture)) {
    if (!Number.isFinite(value) || value < 0) throw new Error("invalid fixture value for " + field)
  }
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "scout-variant-"))
  fs.mkdirSync(path.join(repo, "benchmarks"), { recursive: true })
  fs.writeFileSync(path.join(repo, "TASK.md"), "# Task\n")
  const written = writeSessionVariant(repo, slug, 101)
  writeSessionVariant(repo, slug, 101)
  const read = readRepoVariant(repo)
  if (JSON.stringify(written) !== JSON.stringify(read)) throw new Error("written variant could not be read back")
  const task = fs.readFileSync(path.join(repo, "TASK.md"), "utf8")
  if (!task.includes("SESSION_VARIANT")) throw new Error("variant ticket marker missing")
  if ((task.match(/SESSION_VARIANT/g) || []).length !== 1) throw new Error("variant ticket marker was not replaced")
  fs.rmSync(repo, { recursive: true, force: true })
  console.log(JSON.stringify({ first, second, written }))
`

const slugs = fs.readdirSync(path.join(root, "challenges"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, "challenges", entry.name, "variants", "manifest.json")))
  .map((entry) => entry.name)
for (const slug of slugs) {
  const benchmarkDir = path.join(root, "challenges", slug, "repo", "benchmarks")
  const benchmark = ["bench.py", "bench.mjs", "bench.cpp"]
    .map((file) => path.join(benchmarkDir, file))
    .find((file) => fs.existsSync(file))
  assert.ok(benchmark, `${slug} must provide a benchmark workload`)
  const source = fs.readFileSync(benchmark, "utf8")
  const cppVariables = {
    count_multiplier: "multiplier",
    index_offset: "offset",
    hotspot_mod: "hotspot",
    burst_repeats: "burst_repeats"
  }
  for (const field of ["count_multiplier", "index_offset", "hotspot_mod", "burst_repeats"]) {
    const uses = source.match(new RegExp(`\\b${field}\\b`, "g")) || []
    assert.ok(uses.length >= (benchmark.endsWith(".cpp") ? 1 : 2), `${slug} benchmark must consume variant fixture field ${field}`)
    if (benchmark.endsWith(".cpp")) {
      const variableUses = source.match(new RegExp(`\\b${cppVariables[field]}\\b`, "g")) || []
      assert.ok(variableUses.length >= 2, `${slug} benchmark must use parsed variant field ${field}`)
    }
  }
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", probe, slug], { encoding: "utf8" })
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(result.status || 1)
  }
  const output = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.notEqual(output.first.seed, output.second.seed)
  assert.equal(output.written.seed, 101)
}
console.log(`PASS variant seeds produce distinct deterministic replay profiles for ${slugs.length} packs`)
