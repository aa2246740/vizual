import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_ROOT = "/Users/wu/Documents/CC/deer-flow-vizual-clean/validation-artifacts/cdp";

const args = process.argv.slice(2);
const cases = [];
let root = DEFAULT_ROOT;
let json = false;
let max = 60;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--root") {
    root = args[++index];
  } else if (arg === "--case") {
    const value = args[++index];
    const splitAt = value.indexOf(":") >= 0 ? value.indexOf(":") : value.indexOf("=");
    if (splitAt < 0) throw new Error("--case must be <expect>:<result-json-or-dir>");
    cases.push({ expect: value.slice(0, splitAt), target: value.slice(splitAt + 1) });
  } else if (arg === "--json") {
    json = true;
  } else if (arg === "--max") {
    max = Number(args[++index]);
  } else if (arg === "--help") {
    printHelp();
    process.exit(0);
  }
}

function printHelp() {
  console.log(`Usage:
  node validation/deerflow-evidence-audit.mjs [--root <cdp-artifact-root>]
  node validation/deerflow-evidence-audit.mjs --case n1:<result-json-or-dir> --case n4:<result-json-or-dir>

Expectations:
  n1           natural data analysis: visible surface plus real visual evidence
  n2           useful concept interaction: visible surface plus real controls
  n3           action roundtrip: useful controls plus post-click agent continuation
  n4           text-only negative: readable answer and zero Vizual surfaces
  n5           explicit web/file negative: readable answer and zero Vizual surfaces
  n6           failure absorption: readable answer, no load failure, no blank surface
  activity     natural long task/activity evidence: staged surface or message progression
  stream       natural incremental evidence: poll timeline shows visible growth before final
  surface      generic positive surface evidence
  interactive generic visible control evidence
  negative     generic zero-surface evidence

The script audits evidence already produced by a browser run. It does not decide
whether an Agent should have used Vizual for a natural-language prompt.`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function statFile(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function resolveResultTarget(target) {
  const stats = await statFile(target);
  if (!stats) throw new Error(`Artifact target not found: ${target}`);
  if (stats.isDirectory()) {
    const direct = path.join(target, "result.json");
    if (await exists(direct)) return direct;
    const files = await fs.readdir(target);
    const candidate = files.find((file) => file.endsWith("result.json") || file === "summary.json");
    if (candidate) return path.join(target, candidate);
    throw new Error(`No result.json or summary.json under ${target}`);
  }
  return target;
}

async function listResultFiles(dir, limit) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const fileName of ["result.json", "summary.json"]) {
        const candidate = path.join(fullPath, fileName);
        if (await exists(candidate)) results.push(candidate);
      }
    } else if (entry.isFile() && entry.name.endsWith("result.json")) {
      results.push(fullPath);
    }
  }
  return results.sort().slice(-limit);
}

function readPngSize(buffer) {
  if (buffer.length < 24) return null;
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function inspectImage(filePath) {
  const stats = await statFile(filePath);
  if (!stats || !stats.isFile()) return { path: filePath, exists: false, bytes: 0, png: null };
  const buffer = await fs.readFile(filePath);
  return {
    path: filePath,
    exists: true,
    bytes: stats.size,
    png: readPngSize(buffer),
  };
}

function normalizeSummary(raw = {}) {
  const final = raw.final || {};
  const surfaceCount = number(raw.surfaceCount, final.vizualSurfaces, Array.isArray(raw.surfaces) ? raw.surfaces.length : undefined, 0);
  const controlCount = number(raw.controlCount, final.inputCount, 0);
  const visualCount = number(
    raw.visualCount,
    Array.isArray(raw.visuals) ? raw.visuals.length : undefined,
    final.canvasCount,
    0,
  );
  const textLength = number(raw.textLength, final.textLength, 0);
  const surfaces = Array.isArray(raw.surfaces) ? raw.surfaces : [];
  return {
    surfaceCount,
    controlCount,
    visualCount,
    textLength,
    pending: Boolean(raw.pending || final.stopButton),
    url: raw.url || final.href || "",
    surfaces,
    blankSurfaceCount: number(raw.blankSurfaceCount, inferBlankSurfaces(surfaces), 0),
    fallbackSurfaceCount: number(raw.fallbackSurfaceCount, inferFallbackSurfaces(surfaces), 0),
  };
}

function number(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function inferBlankSurfaces(surfaces) {
  return surfaces.filter((surface) => {
    const visible = surface.visible !== false;
    const width = number(surface.w, surface.width, 0);
    const height = number(surface.h, surface.height, 0);
    const textLength = typeof surface.textLength === "number" ? surface.textLength : String(surface.text || "").trim().length;
    const nestedControlCount = number(surface.nestedControlCount, 0);
    const nestedVisualCount = number(surface.nestedVisualCount, 0);
    return visible && width > 20 && height > 20 && textLength < 20 && nestedControlCount === 0 && nestedVisualCount === 0;
  }).length;
}

function inferFallbackSurfaces(surfaces) {
  return surfaces.filter((surface) => surface.status === "fallback" || surface.previewOk === "false" || Boolean(surface.issues)).length;
}

async function collectEvidenceImages(result, resultFile, baseDir) {
  const paths = new Set();
  for (const value of Object.values(result.evidence || {})) {
    if (typeof value === "string" && value) paths.add(value);
  }
  for (const value of Object.values(result.screenshots || {})) {
    if (typeof value === "string" && value) paths.add(value);
  }
  for (const fileName of [
    "submitted-before-click.png",
    "surface-visible.png",
    "final-visible.png",
    "after-interaction-visible.png",
    "final-bottom.png",
  ]) {
    const candidate = path.join(baseDir, fileName);
    if (await exists(candidate)) paths.add(candidate);
  }
  if (paths.size === 0 && resultFile.endsWith("-result.json")) {
    const prefix = resultFile.slice(0, -"result.json".length);
    for (const suffix of ["final.png", "mid.png", "ready.png", "after-click.png"]) {
      const candidate = `${prefix}${suffix}`;
      if (await exists(candidate)) paths.add(candidate);
    }
  }
  const images = [];
  for (const imagePath of paths) images.push(await inspectImage(imagePath));
  return images;
}

async function loadArtifact(target) {
  const resultFile = await resolveResultTarget(target);
  const result = await readJson(resultFile);
  const baseDir = result.outDir || path.dirname(resultFile);
  const visiblePath = path.join(baseDir, "summary-visible-before-interaction.json");
  const beforePath = path.join(baseDir, "summary-before-interaction.json");
  const afterPath = path.join(baseDir, "summary-after-interaction.json");
  const pollLogPath = path.join(baseDir, "poll-log.json");
  const visibleRaw = (await exists(visiblePath)) ? await readJson(visiblePath) : null;
  const beforeRaw = result.before || ((await exists(beforePath)) ? await readJson(beforePath) : result);
  const afterRaw = result.after || ((await exists(afterPath)) ? await readJson(afterPath) : null);
  const pollLog = Array.isArray(result.pollLog)
    ? result.pollLog
    : ((await exists(pollLogPath)) ? await readJson(pollLogPath) : []);
  const visible = normalizeSummary(visibleRaw || beforeRaw || result);
  const before = normalizeSummary(beforeRaw || result);
  const after = afterRaw ? normalizeSummary(afterRaw) : null;
  const images = await collectEvidenceImages(result, resultFile, baseDir);

  return {
    resultFile,
    baseDir,
    name: result.caseName || path.basename(baseDir),
    threadId: result.threadId || result.thread_id || extractThreadId(visible.url || before.url || result.threadUrl || ""),
    timedOut: Boolean(result.timedOut),
    presentVizualToolCount: typeof result.presentVizualToolCount === "number" ? result.presentVizualToolCount : null,
    errors: collectErrors(result),
    before,
    visible,
    after,
    pollLog: Array.isArray(pollLog) ? pollLog : [],
    stateBeforeInteraction: result.stateBeforeInteraction || null,
    stateAfterInteraction: result.stateAfterInteraction || null,
    images,
  };
}

function extractThreadId(value) {
  const match = String(value).match(/\/workspace\/chats\/([^/?#]+)/);
  return match ? match[1] : "";
}

function collectErrors(result) {
  const errors = [];
  if (Array.isArray(result.errors)) errors.push(...result.errors.map(String));
  if (result.response && Array.isArray(result.response.errors)) errors.push(...result.response.errors.map(String));
  if (result.error) errors.push(String(result.error));
  return errors;
}

function evaluate(expect, artifact) {
  const checks = [];
  const visible = artifact.visible;
  const after = artifact.after;

  add(checks, Boolean(artifact.resultFile), "result file is readable");
  add(checks, !hasLoadFailure(artifact.errors), "no browser/load failure was recorded");
  add(checks, artifact.images.length > 0, "at least one browser screenshot exists");
  add(checks, artifact.images.every((image) => image.exists && image.bytes > 1000), "all referenced screenshots are non-empty files");
  add(checks, artifact.images.every((image) => !image.png || (image.png.width >= 300 && image.png.height >= 200)), "PNG screenshots have usable dimensions");

  if (["n1", "n2", "n3", "surface", "interactive", "activity", "stream"].includes(expect)) {
    add(checks, Boolean(artifact.threadId), "thread id is captured");
    add(checks, visible.surfaceCount > 0, "visible Vizual surface exists");
    add(checks, visible.blankSurfaceCount === 0, "no visible blank surface");
    add(checks, visible.fallbackSurfaceCount === 0, "no fallback/preview-error surface");
  }

  if (expect === "n1") {
    add(checks, visible.visualCount > 0, "chart/table/canvas visual evidence exists");
    add(checks, visible.textLength >= 800, "answer text is present alongside UI");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
  } else if (expect === "n2" || expect === "interactive") {
    add(checks, visible.controlCount > 0, "useful visible controls exist");
    add(checks, visible.textLength >= 300, "concept explanation text is present");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
    if (expect === "n2") {
      add(
        checks,
        Boolean(after || artifact.images.some((image) => image.path.includes("after-interaction") && image.exists)),
        "post-interaction evidence exists",
      );
    }
  } else if (expect === "n3") {
    add(checks, visible.controlCount > 0, "clickable controls exist before interaction");
    add(checks, Boolean(after), "after-interaction page summary exists");
    add(checks, artifact.images.some((image) => image.path.includes("after-interaction") && image.exists), "after-interaction screenshot exists");
    const beforeCount = artifact.stateBeforeInteraction?.count;
    const afterCount = artifact.stateAfterInteraction?.count;
    add(checks, typeof beforeCount === "number" && typeof afterCount === "number" && afterCount >= beforeCount + 2, "thread state grew after action");
    add(checks, artifact.stateAfterInteraction?.lastType === "ai", "agent continued after action");
  } else if (expect === "n4" || expect === "n5" || expect === "negative") {
    add(checks, visible.surfaceCount === 0, "zero Vizual surfaces");
    if (artifact.presentVizualToolCount !== null) {
      add(checks, artifact.presentVizualToolCount === 0, "present_vizual_ui was not called");
    }
    add(checks, visible.textLength >= 100, "readable answer exists");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
  } else if (expect === "n6") {
    add(checks, visible.textLength >= 100, "readable answer is preserved");
    add(checks, visible.blankSurfaceCount === 0, "no visible blank surface");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
  } else if (expect === "activity") {
    add(checks, visible.textLength >= 300, "long-task answer text is present");
    add(checks, visible.surfaceCount > 0, "visible staged/activity surface exists");
    add(checks, hasProgressionEvidence(artifact), "timeline or thread state shows staged progression");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
  } else if (expect === "stream") {
    add(checks, visible.textLength >= 300, "incremental answer text is present");
    add(checks, visible.surfaceCount > 0, "visible incremental surface exists");
    add(checks, hasIncrementalTimeline(artifact.pollLog), "poll timeline shows incremental visible growth");
    add(checks, !artifact.timedOut && !visible.pending, "run settled without timeout");
  } else if (expect === "surface") {
    add(checks, visible.textLength >= 100, "surface is accompanied by readable text");
  } else {
    add(checks, false, `unknown expectation: ${expect}`);
  }

  const pass = checks.every((check) => check.pass);
  return { expect, pass, checks };
}

function hasProgressionEvidence(artifact) {
  const beforeCount = artifact.stateBeforeInteraction?.count;
  const afterCount = artifact.stateAfterInteraction?.count;
  if (typeof beforeCount === "number" && typeof afterCount === "number" && afterCount > beforeCount) return true;
  return artifact.pollLog.some((item) => {
    const summary = item?.summary || item;
    return summary && (summary.surfaceCount > 0 || summary.visualCount > 0) && summary.pending === true;
  });
}

function hasIncrementalTimeline(pollLog) {
  if (!Array.isArray(pollLog) || pollLog.length < 2) return false;
  const visible = pollLog
    .map((item) => item?.summary || item)
    .filter((summary) => summary && (summary.textLength > 0 || summary.surfaceCount > 0));
  if (visible.length < 2) return false;
  const first = visible[0];
  const last = visible[visible.length - 1];
  const textGrew = number(last.textLength, 0) > number(first.textLength, 0) + 100;
  const surfacesGrew = number(last.surfaceCount, 0) > number(first.surfaceCount, 0);
  const visualsGrew = number(last.visualCount, 0) > number(first.visualCount, 0);
  return textGrew || surfacesGrew || visualsGrew;
}

function add(checks, pass, label) {
  checks.push({ pass: Boolean(pass), label });
}

function hasLoadFailure(errors) {
  return errors.some((error) => /load failed|browser request failed|request failed before/i.test(error));
}

function compactArtifact(artifact) {
  return {
    name: artifact.name,
    resultFile: artifact.resultFile,
    threadId: artifact.threadId,
    timedOut: artifact.timedOut,
    presentVizualToolCount: artifact.presentVizualToolCount,
    errors: artifact.errors,
    visible: artifact.visible,
    after: artifact.after,
    pollLog: artifact.pollLog,
    stateBeforeInteraction: artifact.stateBeforeInteraction,
    stateAfterInteraction: artifact.stateAfterInteraction,
    images: artifact.images.map((image) => ({
      path: image.path,
      exists: image.exists,
      bytes: image.bytes,
      png: image.png,
    })),
  };
}

function printReport(reports) {
  for (const report of reports) {
    const status = report.verdict?.pass === false ? "FAIL" : report.verdict?.pass === true ? "PASS" : "INFO";
    console.log(`${status} ${report.expect || "summary"} ${report.artifact.name}`);
    console.log(`  result: ${report.artifact.resultFile}`);
    console.log(
      `  thread: ${report.artifact.threadId || "(missing)"}  surfaces=${report.artifact.visible.surfaceCount} controls=${report.artifact.visible.controlCount} visuals=${report.artifact.visible.visualCount} blanks=${report.artifact.visible.blankSurfaceCount} fallbacks=${report.artifact.visible.fallbackSurfaceCount} text=${report.artifact.visible.textLength}`,
    );
    console.log(`  screenshots: ${report.artifact.images.length}`);
    if (report.verdict) {
      for (const check of report.verdict.checks) {
        console.log(`    ${check.pass ? "ok" : "FAIL"} - ${check.label}`);
      }
    }
  }
}

const reports = [];
if (cases.length > 0) {
  for (const item of cases) {
    const artifact = await loadArtifact(item.target);
    reports.push({
      expect: item.expect,
      artifact: compactArtifact(artifact),
      verdict: evaluate(item.expect, artifact),
    });
  }
} else {
  const resultFiles = await listResultFiles(root, max);
  for (const resultFile of resultFiles) {
    const artifact = await loadArtifact(resultFile);
    reports.push({ artifact: compactArtifact(artifact) });
  }
}

if (json) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  printReport(reports);
}

if (reports.some((report) => report.verdict?.pass === false)) {
  process.exitCode = 1;
}
