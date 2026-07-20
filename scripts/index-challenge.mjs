import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) throw new Error("Usage: npm run index-challenge -- <slug>");
const root = path.join(process.cwd(), "challenges", slug);
const repo = path.join(root, "repo");
const output = path.join(root, "agent", "symbols.json");
const symbols = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    if (!entry.isFile() || !/\.(py|ts)$/.test(entry.name)) continue;
    const relative = path.relative(repo, file).replaceAll(path.sep, "/");
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const match = line.match(/^\s*(?:export\s+)?(?:class|function|def|async\s+function)\s+([A-Za-z_$][\w$]*)/);
      if (match) symbols.push({ name: match[1], kind: line.includes("class") ? "class" : "function", path: relative, line: index + 1 });
      const method = line.match(/^\s+(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/);
      if (method && !["if", "for", "while"].includes(method[1])) symbols.push({ name: method[1], kind: "method", path: relative, line: index + 1 });
    });
  }
}
walk(repo);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(symbols, null, 2)}\n`);
console.log(`Indexed ${symbols.length} symbols for ${slug}`);
