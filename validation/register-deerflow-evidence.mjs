import fs from "node:fs/promises";
import path from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, "true");
  }
}

const registryPath = args.get("registry") || "validation/deerflow-evidence-registry.json";
const id = args.get("id");
const target = args.get("target");
const expectation = args.get("expectation");
const note = args.get("note") || "";

if (!id || !target) {
  console.error("Usage: node validation/register-deerflow-evidence.mjs --id <registry-id> --target <result-json-or-dir> [--expectation n2]");
  process.exit(2);
}

const absoluteRegistryPath = path.resolve(registryPath);
const registry = JSON.parse(await fs.readFile(absoluteRegistryPath, "utf8"));
registry.current ||= {};
const current = registry.current[id] || {};
registry.current[id] = {
  ...current,
  expectation: expectation || current.expectation,
  status: "candidate",
  target,
  note: note || current.note || "Candidate evidence registered; native-core-completion-audit will verify it.",
  registeredAt: new Date().toISOString(),
};

await fs.writeFile(absoluteRegistryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ registry: absoluteRegistryPath, id, entry: registry.current[id] }, null, 2));
