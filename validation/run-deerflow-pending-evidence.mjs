import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
const scenarioArg = args.get("scenario") || "";
const execute = args.get("execute") === "true";
const outDir = args.get("out-dir") || os.tmpdir();
const seed = args.get("seed") || new Date().toISOString().replace(/[:.]/g, "-");
const deerflowUrl = args.get("deerflow-url") || "http://localhost:2026";
const cdpBase = args.get("cdp-base") || "http://127.0.0.1:9227";
const waitMs = args.get("wait-ms") || "240000";
const maxExistingDeerflowTargets = args.get("max-existing-deerflow-targets") || "0";

const scenarioById = {
  "deerflow.n2-concept-interaction-current": "n2",
  "deerflow.n5-explicit-web-current": "n5",
  "deerflow.n6-failure-absorption": "n6",
  "deerflow.agui-natural-activity": "activity",
  "deerflow.stream-natural-incremental": "stream",
};

const idByScenario = Object.fromEntries(Object.entries(scenarioById).map(([id, scenario]) => [scenario, id]));
const expectationByScenario = {
  n2: "n2",
  n5: "n5",
  n6: "n6",
  activity: "activity",
  stream: "stream",
};

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  process.exit(1);
}

function runNode(scriptArgs, options = {}) {
  const result = spawnSync(process.execPath, scriptArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, DEERFLOW_URL: deerflowUrl, CDP_BASE: cdpBase },
    ...options,
  });
  return result;
}

async function loadRegistry() {
  return JSON.parse(await fs.readFile(registryPath, "utf8"));
}

function pickPending(registry) {
  if (scenarioArg) {
    const id = idByScenario[scenarioArg];
    if (!id) fail(`Unknown scenario: ${scenarioArg}`, { valid: Object.keys(idByScenario) });
    return { id, scenario: scenarioArg, entry: registry.current?.[id] };
  }

  for (const [id, scenario] of Object.entries(scenarioById)) {
    const entry = registry.current?.[id];
    if (!entry || entry.status === "pending" || !entry.target) return { id, scenario, entry };
  }
  return null;
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    fail(`${label} did not return parseable JSON`, { output });
  }
}

const registry = await loadRegistry();
const picked = pickPending(registry);
if (!picked) {
  console.log(JSON.stringify({ ok: true, done: true, message: "No pending DeerFlow evidence remains." }, null, 2));
  process.exit(0);
}

const generated = runNode([
  "validation/deerflow-natural-task-generator.mjs",
  "--scenario",
  picked.scenario,
  "--out-dir",
  outDir,
  "--seed",
  seed,
  "--deerflow-url",
  deerflowUrl,
  "--cdp-base",
  cdpBase,
]);
if (generated.status !== 0) {
  fail("Task generation failed", { stdout: generated.stdout, stderr: generated.stderr, status: generated.status });
}

const task = parseJsonOutput(generated.stdout, "Task generator");
task.runnerArgs = task.runnerArgs.map((value, index, all) => {
  if (all[index - 1] === "--wait-ms") return waitMs;
  return value;
});
if (!task.runnerArgs.includes("--max-existing-deerflow-targets")) {
  task.runnerArgs.push("--max-existing-deerflow-targets", maxExistingDeerflowTargets);
}

if (!execute) {
  console.log(JSON.stringify({
    ok: true,
    mode: "dry-run",
    message: "No browser was opened. Re-run with --execute to run exactly this one pending scenario.",
    registryId: picked.id,
    scenario: picked.scenario,
    expectation: expectationByScenario[picked.scenario],
    promptFile: task.promptFile,
    prompt: task.prompt,
    runnerArgs: task.runnerArgs,
    env: { DEERFLOW_URL: deerflowUrl, CDP_BASE: cdpBase },
    maxExistingDeerflowTargets,
    auditAfterRun: `node validation/deerflow-evidence-audit.mjs --case ${expectationByScenario[picked.scenario]}:<result-json-or-dir>`,
  }, null, 2));
  process.exit(0);
}

const runner = runNode(task.runnerArgs, { timeout: Number(waitMs) + 60000 });
if (runner.status !== 0) {
  fail("DeerFlow browser runner failed; evidence was not registered", {
    registryId: picked.id,
    scenario: picked.scenario,
    stdout: runner.stdout,
    stderr: runner.stderr,
    status: runner.status,
  });
}

const runnerOutput = parseJsonOutput(runner.stdout, "DeerFlow browser runner");
const resultTarget = runnerOutput.resultJson || (runnerOutput.outDir ? path.join(runnerOutput.outDir, "result.json") : path.join(path.dirname(runnerOutput.evidence?.finalBottom || ""), "result.json"));
if (!resultTarget) fail("Runner did not report an outDir or result path", { runnerOutput });

const expectation = expectationByScenario[picked.scenario];
const audit = runNode(["validation/deerflow-evidence-audit.mjs", "--json", "--case", `${expectation}:${resultTarget}`]);
if (audit.status !== 0) {
  console.log(JSON.stringify({
    ok: false,
    registered: false,
    registryId: picked.id,
    scenario: picked.scenario,
    expectation,
    resultTarget,
    audit: parseJsonOutput(audit.stdout || "[]", "Evidence audit"),
    message: "Evidence audit failed; registry was not updated.",
  }, null, 2));
  process.exit(1);
}

const registration = runNode([
  "validation/register-deerflow-evidence.mjs",
  "--registry",
  registryPath,
  "--id",
  picked.id,
  "--expectation",
  expectation,
  "--target",
  resultTarget,
  "--note",
  `Registered by run-deerflow-pending-evidence ${new Date().toISOString()}`,
]);
if (registration.status !== 0) {
  fail("Evidence passed audit but registration failed", {
    stdout: registration.stdout,
    stderr: registration.stderr,
    status: registration.status,
  });
}

console.log(JSON.stringify({
  ok: true,
  registered: true,
  registryId: picked.id,
  scenario: picked.scenario,
  expectation,
  resultTarget,
  audit: parseJsonOutput(audit.stdout, "Evidence audit"),
  registration: parseJsonOutput(registration.stdout, "Registration"),
}, null, 2));
