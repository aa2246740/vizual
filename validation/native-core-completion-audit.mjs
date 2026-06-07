import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const coverageSummaryPath =
  getArg("--coverage-summary") || "/tmp/vizual-native-core-coverage-detail/coverage-summary.json";
const deerflowRoot =
  getArg("--deerflow-root") || "/Users/wu/Documents/CC/deer-flow-vizual-clean/validation-artifacts/cdp";
const evidenceRegistryPath = getArg("--evidence-registry") || "validation/deerflow-evidence-registry.json";
const json = process.argv.includes("--json");
const allowPending = process.argv.includes("--allow-pending");

const checks = [];
const nativeCoreSourceFiles = [
  "src/native-core/core.ts",
  "src/native-core/normalize.ts",
  "src/native-core/preview.ts",
  "src/native-core/stream.ts",
  "src/native-core/validate.ts",
  "src/native-core/types.ts",
  "src/native-core/protocol-fixtures.ts",
  "src/native-core/index.ts",
];
const nativeCoreRuntimeFiles = nativeCoreSourceFiles.filter((filePath) => !filePath.endsWith("/types.ts"));
const nativeCoreTestFiles = [
  "src/native-core/core.test.ts",
  "src/native-core/live-story.test.ts",
  "src/native-core/protocol-matrix.test.ts",
  "src/native-core/stream.test.ts",
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function add(id, status, evidence, details = {}) {
  checks.push({ id, status, evidence, details });
}

function pass(id, evidence, details) {
  add(id, "pass", evidence, details);
}

function fail(id, evidence, details) {
  add(id, "fail", evidence, details);
}

function pending(id, evidence, details) {
  add(id, "pending", evidence, details);
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileExists(id, filePath) {
  if (exists(path.join(root, filePath))) pass(id, `${filePath} exists`);
  else fail(id, `${filePath} missing`);
}

function checkFileContains(id, filePath, phrases) {
  const absolute = path.join(root, filePath);
  if (!exists(absolute)) {
    fail(id, `${filePath} missing`);
    return;
  }
  const source = fs.readFileSync(absolute, "utf8");
  const missing = phrases.filter((phrase) => !source.includes(phrase));
  if (missing.length === 0) pass(id, `${filePath} contains required coverage phrases`);
  else fail(id, `${filePath} missing required coverage phrases`, { missing });
}

function parseConstArray(filePath, name) {
  const source = read(filePath);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`export\\s+const\\s+${escaped}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`));
  if (!match) return [];
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

function latestArtifactSummary(prefix, predicate = () => true) {
  const artifactsDir = path.join(root, "validation/artifacts");
  if (!exists(artifactsDir)) return null;
  const candidates = fs
    .readdirSync(artifactsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => path.join(artifactsDir, entry.name, "summary.json"))
    .filter(exists)
    .sort()
    .reverse();

  for (const candidate of candidates) {
    const summary = readJson(candidate);
    if (predicate(summary)) return { path: candidate, summary };
  }
  return null;
}

function checkProtocolFixtures() {
  const aguiEvents = parseConstArray("src/native-core/protocol-fixtures.ts", "VIZUAL_AG_UI_EVENT_TYPES");
  const agenuiComponents = parseConstArray("src/native-core/protocol-fixtures.ts", "VIZUAL_AGENUI_CATALOG_COMPONENTS");

  if (aguiEvents.length === 33) pass("protocol-fixtures.agui-events", "AG-UI EventType fixture has 33 events");
  else fail("protocol-fixtures.agui-events", "AG-UI EventType fixture count mismatch", { count: aguiEvents.length });

  if (agenuiComponents.length === 25) pass("protocol-fixtures.agenui-components", "AGenUI catalog fixture has 25 components");
  else fail("protocol-fixtures.agenui-components", "AGenUI catalog fixture count mismatch", { count: agenuiComponents.length });
}

function checkCoverageSummary() {
  if (!exists(coverageSummaryPath)) {
    pending("coverage.native-core", `coverage summary not found: ${coverageSummaryPath}`);
    return;
  }
  const summary = readJson(coverageSummaryPath);
  const coverageMtime = fs.statSync(coverageSummaryPath).mtimeMs;
  const trackedFiles = [...nativeCoreRuntimeFiles, ...nativeCoreTestFiles]
    .map((filePath) => path.join(root, filePath))
    .filter(exists);
  const newestTracked = trackedFiles.reduce((latest, filePath) => Math.max(latest, fs.statSync(filePath).mtimeMs), 0);
  if (coverageMtime + 1000 < newestTracked) {
    fail("coverage.native-core.fresh", "coverage summary is older than current Native Core source/tests", {
      coverageSummaryPath,
      coverageMtime: new Date(coverageMtime).toISOString(),
      newestTrackedMtime: new Date(newestTracked).toISOString(),
    });
  } else {
    pass("coverage.native-core.fresh", "coverage summary is current for Native Core source/tests", {
      coverageSummaryPath,
      coverageMtime: new Date(coverageMtime).toISOString(),
    });
  }

  const fileFailures = [];
  const coveredFiles = [];

  for (const expectedPath of nativeCoreRuntimeFiles) {
    const expectedFile = path.basename(expectedPath);
    const entry = Object.entries(summary).find(([filePath]) => filePath.replace(/\\/g, "/").endsWith(`/${expectedPath}`))?.[1];
    if (!entry || entry.lines?.pct !== 100 || entry.functions?.pct !== 100) {
      fileFailures.push({ file: expectedFile, lines: entry?.lines?.pct, functions: entry?.functions?.pct });
    } else {
      coveredFiles.push({
        file: expectedFile,
        lines: entry.lines?.pct,
        functions: entry.functions?.pct,
        statements: entry.statements?.pct,
        branches: entry.branches?.pct,
      });
    }
  }

  if (fileFailures.length === 0) {
    pass("coverage.native-core", "Native Core runtime files have 100% line and function coverage", { files: coveredFiles });
  } else {
    fail("coverage.native-core", "Native Core runtime files do not meet 100% line/function threshold", { fileFailures });
  }
}

function extractNativeOperationTypes() {
  const source = read("src/native-core/types.ts");
  const match = source.match(/export type VizualNativeOperation =([\s\S]*?)\n\nexport type VizualNativeAgUiEvent/);
  if (!match) return [];
  return [...match[1].matchAll(/\|\s*\{\s*type:\s*'([^']+)'/g)].map((item) => item[1]);
}

function extractReduceOperationCases() {
  const source = read("src/native-core/core.ts");
  const match = source.match(/private reduceOperation\(operation: VizualNativeOperation\):[\s\S]*?switch \(operation\.type\) \{([\s\S]*?)\n      \}\n    \} catch/);
  if (!match) return [];
  return [...match[1].matchAll(/case '([^']+)'/g)].map((item) => item[1]);
}

function checkNativeOperationReducerCoverage() {
  const operationTypes = extractNativeOperationTypes();
  const reducerCases = extractReduceOperationCases();
  const missing = operationTypes.filter((type) => !reducerCases.includes(type));
  const extra = reducerCases.filter((type) => !operationTypes.includes(type));
  if (operationTypes.length > 0 && missing.length === 0 && extra.length === 0) {
    pass("native-operations.reducer", `reducer handles all ${operationTypes.length} Native Core operation types`);
  } else {
    fail("native-operations.reducer", "Native Core operation union and reducer switch are out of sync", {
      operationTypes: operationTypes.length,
      reducerCases: reducerCases.length,
      missing,
      extra,
    });
  }
}

function checkBrowserArtifacts() {
  const gallery = latestArtifactSummary("native-core-gallery-", (summary) => summary.passCount === 52 && summary.failCount === 0 && summary.resultCount === 52);
  if (gallery) pass("browser.gallery", "latest native gallery artifact proves 52/52 renderable components", { path: gallery.path });
  else fail("browser.gallery", "no native gallery artifact proves 52/52 renderable components");

  const positive = latestArtifactSummary(
    "native-protocol-matrix-",
    (summary) => summary.ok === true && summary.caseCount === 7 && summary.statusCounts?.PASS === 7,
  );
  if (positive) pass("browser.protocol-positive", "native protocol matrix positive artifact proves 7/7 PASS", { path: positive.path });
  else fail("browser.protocol-positive", "no native protocol positive artifact proves 7/7 PASS");

  const negative = latestArtifactSummary(
    "native-protocol-matrix-",
    (summary) => summary.ok === false && summary.caseCount === 7 && summary.statusCounts?.FAIL === 1 && String(summary.url || "").includes("break-agui-events=1"),
  );
  if (negative) pass("browser.protocol-negative", "native protocol negative self-check proves the judge catches missing AG-UI events", { path: negative.path });
  else fail("browser.protocol-negative", "no native protocol negative self-check artifact proves judge sensitivity");
}

function runEvidenceAudit(id, expectation, target, expectedPass) {
  const absolute = path.isAbsolute(target) ? target : path.join(deerflowRoot, target);
  if (!exists(absolute)) {
    pending(id, `DeerFlow artifact not found: ${absolute}`);
    return;
  }
  const run = spawnSync(process.execPath, ["validation/deerflow-evidence-audit.mjs", "--json", "--case", `${expectation}:${absolute}`], {
    cwd: root,
    encoding: "utf8",
  });
  let report;
  try {
    report = JSON.parse(run.stdout)[0];
  } catch {
    fail(id, "deerflow evidence audit output was not parseable", { stdout: run.stdout, stderr: run.stderr });
    return;
  }

  const actualPass = report?.verdict?.pass === true;
  const failures = report?.verdict?.checks?.filter((check) => !check.pass).map((check) => check.label) || [];
  if (actualPass === expectedPass) {
    pass(id, `deerflow-evidence-audit ${expectation} returned expected ${expectedPass ? "PASS" : "FAIL"}`, {
      artifact: absolute,
      failures,
    });
  } else if (expectedPass) {
    fail(id, `deerflow-evidence-audit ${expectation} did not pass`, { artifact: absolute, failures });
  } else {
    fail(id, `historical failed artifact unexpectedly passed ${expectation}; re-check the audit rule`, {
      artifact: absolute,
      failures,
    });
  }
}

function readEvidenceRegistry() {
  const absolute = path.isAbsolute(evidenceRegistryPath) ? evidenceRegistryPath : path.join(root, evidenceRegistryPath);
  if (!exists(absolute)) return { current: {} };
  return readJson(absolute);
}

function checkCurrentEvidenceFromRegistry(registry) {
  const requirements = [
    {
      id: "deerflow.n2-concept-interaction-current",
      expectation: "n2",
      pendingEvidence: "needs a fresh single-target DeerFlow browser run after the content-object/rootless fixes",
    },
    {
      id: "deerflow.n5-explicit-web-current",
      expectation: "n5",
      pendingEvidence: "needs a fresh single-target DeerFlow browser run that settles without timeout",
    },
    {
      id: "deerflow.n6-failure-absorption",
      expectation: "n6",
      pendingEvidence: "needs a fresh natural-language browser run proving readable answer plus no blank surface on risky output",
    },
    {
      id: "deerflow.agui-natural-activity",
      expectation: "activity",
      pendingEvidence: "needs a natural long-task/activity scenario in DeerFlow, not just protocol contract tests",
    },
    {
      id: "deerflow.stream-natural-incremental",
      expectation: "stream",
      pendingEvidence: "needs a natural incremental/stream scenario in DeerFlow, not just JSONL/SSE contract tests",
    },
  ];

  for (const requirement of requirements) {
    const entry = registry.current?.[requirement.id];
    if (!entry?.target || entry.status === "pending") {
      pending(requirement.id, entry?.note || requirement.pendingEvidence);
      continue;
    }
    runEvidenceAudit(requirement.id, entry.expectation || requirement.expectation, entry.target, true);
  }
}

function checkNaturalEvidence() {
  runEvidenceAudit(
    "deerflow.n1-data-analysis",
    "n1",
    "deerflow-natural-n1-pet-hospital-growth-profit-data-viz-2026-06-04T05-40-52-106Z/result.json",
    true,
  );
  runEvidenceAudit(
    "deerflow.n3-action-roundtrip",
    "n3",
    "deerflow-natural-n3-smart-curtain-triage-centered-click-2026-06-04T05-22-46-252Z/result.json",
    true,
  );
  runEvidenceAudit(
    "deerflow.n4-text-only-negative",
    "n4",
    "real-case12-boundary-text-only-fresh-result.json",
    true,
  );
  runEvidenceAudit(
    "deerflow.n2-concept-interaction-old-failure",
    "n2",
    "deerflow-natural-n2-binary-search-concept-interactive-after-a2ui-ui-fix-2026-06-04T05-56-35-734Z/result.json",
    false,
  );
  runEvidenceAudit(
    "deerflow.n5-explicit-html-old-failure",
    "n5",
    "real-case13-boundary-explicit-html-fresh-result.json",
    false,
  );

  checkCurrentEvidenceFromRegistry(readEvidenceRegistry());
}

function checkStaticCoverageAssets() {
  nativeCoreSourceFiles.forEach((filePath) => checkFileExists(`source.${path.basename(filePath)}`, filePath));

  checkFileContains("tests.public-sdk", "src/native-core/core.test.ts", [
    "keeps public SDK entrypoints",
    "processA2UIMessage",
    "processAGUIEvents",
    "processVizualSpec",
    "unsubscribe wired to the native reducer",
  ]);
  checkFileContains("tests.a2ui-lifecycle", "src/native-core/core.test.ts", [
    "normalizes legacy typed A2UI data model",
    "accepts loose appendDataModel",
    "beginRendering",
    "rootless loose",
    "appendDataModel",
    "deleteSurface",
  ]);
  checkFileContains("tests.agui-contract", "src/native-core/protocol-matrix.test.ts", [
    "accepts every AG-UI event category",
    "covers AG-UI text",
    "MESSAGES_SNAPSHOT",
    "ACTIVITY_SNAPSHOT",
    "TOOL_CALL_ARGS",
  ]);
  checkFileContains("tests.agenui-catalog", "src/native-core/protocol-matrix.test.ts", [
    "maps the complete AGenUI catalog component list",
    "normalizes AGenUI catalog extensions",
  ]);
  checkFileContains("tests.stream", "src/native-core/stream.test.ts", [
    "consumes JSONL",
    "consumes SSE AG-UI",
    "waits for complete JSON lines",
    "unfinished JSON",
    "OpenAI chat and Responses",
    "Anthropic-style",
  ]);
  checkFileContains("tests.failure-absorption", "src/native-core/core.test.ts", [
    "absorbs unknown events and visual update failures",
    "absorbs incomplete AG-UI events",
    "unexpected dispatch exceptions",
    "host callback exceptions",
    "unsupported raw inputs",
  ]);
  checkFileContains("tests.semantic-direct-agent-output", "src/native-core/core.test.ts", [
    "normalizes data-rich semantic shorthand records",
    "direct text-card specs",
    "inline child id",
    "component path hints",
    "real cold-start agent dialect",
  ]);
  checkFileContains("tests.lifecycle-theme-action-artifact", "src/native-core/core.test.ts", [
    "merges duplicate createSurface theme",
    "covers native lifecycle operations without hiding errors or breaking action output",
    "ingests native Vizual specs as first-class artifacts",
    "surfaces quality findings as validation warning evidence",
  ]);
  checkFileContains("tests.artifact-target-map", "src/core/__tests__/artifact.test.ts", [
    "targetMap",
    "rejects section-only replacement patches",
  ]);
  checkFileContains("tests.parity", "src/core/__tests__/native-core-coverage-parity.test.ts", [
    "catalog, manifest, registry, validator, and gallery fixtures in lockstep",
    "toHaveLength(52)",
    "keeps every manifest function backed by a runtime action handler",
  ]);
  checkFileContains("tests.runtime-boundary", "src/agent-helper/runtime-boundary.test.ts", [
    "keeps acceptance execution free of Host-side Vizual intent verdicts",
    "keeps the Pi direct tool focused on payload contract, not user-message intent",
    "does not hide child components under a non-container create_root component",
  ]);
  checkFileContains("tests.catalog-gap", "src/agent-helper/runtime-boundary.test.ts", [
    "catalogGaps",
    "vizual.semantic_analysis_chart_missing_data",
    "does not silently accept unknown Vizual payloads",
  ]);
}

function checkRuntimeBoundary() {
  const daemon = read("validation/daemon-acceptance-server.mjs");
  const directTool = read("validation/pi-vizual-direct-tool.mjs");
  const forbiddenDaemon = [
    "shouldUseVizualUi",
    "requiresVizualUi",
    "本轮是否需要 Vizual UI",
    "本轮不需要 Vizual UI",
    "shortcut-no-cli",
    "intent coverage failed",
    "chart values repaired from user prompt",
  ].filter((phrase) => daemon.includes(phrase));
  const forbiddenDirectTool = [
    "VIZUAL_USER_MESSAGE",
    "requestWants",
    "isExplicitCreativeArtifactRequest",
    "explicit-creative-artifact",
  ].filter((phrase) => directTool.includes(phrase));

  if (!forbiddenDaemon.length && !forbiddenDirectTool.length && daemon.includes("boundary: 'agent-autonomous'")) {
    pass("runtime-boundary.agent-autonomous", "acceptance runtime exposes capability without Host-side Vizual intent verdicts");
  } else {
    fail("runtime-boundary.agent-autonomous", "acceptance runtime still contains Host-side intent verdict signals", {
      forbiddenDaemon,
      forbiddenDirectTool,
      hasAgentAutonomousBoundary: daemon.includes("boundary: 'agent-autonomous'"),
    });
  }
}

checkStaticCoverageAssets();
checkProtocolFixtures();
checkNativeOperationReducerCoverage();
checkCoverageSummary();
checkBrowserArtifacts();
checkNaturalEvidence();
checkRuntimeBoundary();

const summary = {
  pass: checks.filter((check) => check.status === "pass").length,
  fail: checks.filter((check) => check.status === "fail").length,
  pending: checks.filter((check) => check.status === "pending").length,
  complete: checks.every((check) => check.status === "pass"),
};

if (json) {
  console.log(JSON.stringify({ summary, checks }, null, 2));
} else {
  console.log("Native Core completion audit");
  for (const check of checks) {
    console.log(`${check.status.toUpperCase()} ${check.id}`);
    console.log(`  ${check.evidence}`);
    if (check.details && Object.keys(check.details).length > 0) {
      console.log(`  ${JSON.stringify(check.details)}`);
    }
  }
  console.log(`summary pass=${summary.pass} fail=${summary.fail} pending=${summary.pending} complete=${summary.complete}`);
}

if (summary.fail > 0 || (!allowPending && summary.pending > 0)) {
  process.exitCode = 1;
}
