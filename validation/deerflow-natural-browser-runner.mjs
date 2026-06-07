import fs from "node:fs/promises";
import path from "node:path";

const CDP_BASE = process.env.CDP_BASE || "http://127.0.0.1:9227";
const DEERFLOW_URL = process.env.DEERFLOW_URL || "http://localhost:2026";
const ARTIFACTS_ROOT =
  process.env.DEERFLOW_EVIDENCE_DIR ||
  "/Users/wu/Documents/CC/deer-flow-vizual-clean/validation-artifacts/cdp";

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

const slug = args.get("slug") || `natural-${Date.now()}`;
const promptFile = args.get("prompt-file");
const promptText = args.get("prompt");
const shouldInteract = args.get("interact") === "true";
const waitMs = Number(args.get("wait-ms") || 240000);
const keepTab = args.get("keep-tab") === "true";
const skipTargetPreflight = args.get("skip-target-preflight") === "true";
const maxExistingDeerflowTargets = Number(
  args.get("max-existing-deerflow-targets") ?? process.env.MAX_EXISTING_DEERFLOW_TARGETS ?? "0",
);

if (!promptFile && !promptText) {
  console.error("Usage: node validation/deerflow-natural-browser-runner.mjs --slug <id> --prompt-file <file> [--interact]");
  process.exit(2);
}

const prompt = promptFile ? await fs.readFile(promptFile, "utf8") : promptText;
const outDir = path.join(
  ARTIFACTS_ROOT,
  `deerflow-natural-${slug}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cdpFetch(route, init) {
  const response = await fetch(`${CDP_BASE}${route}`, init);
  if (!response.ok) throw new Error(`${route} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function isDeerflowTarget(target) {
  const url = String(target?.url || "");
  return target?.type === "page" && (url.startsWith(DEERFLOW_URL) || url.includes("/workspace/chats/"));
}

async function preflightTargets() {
  if (skipTargetPreflight) return { skipped: true, existingDeerflowTargets: [] };
  const targets = await cdpFetch("/json/list");
  const existingDeerflowTargets = Array.isArray(targets) ? targets.filter(isDeerflowTarget) : [];
  if (existingDeerflowTargets.length > maxExistingDeerflowTargets) {
    throw new Error(
      `CDP target preflight failed: found ${existingDeerflowTargets.length} DeerFlow page target(s), max allowed is ${maxExistingDeerflowTargets}. Close old DeerFlow tabs or pass --skip-target-preflight intentionally.`,
    );
  }
  return {
    skipped: false,
    maxExistingDeerflowTargets,
    existingDeerflowTargets: existingDeerflowTargets.map((target) => ({
      id: target.id,
      title: target.title,
      url: target.url,
    })),
  };
}

async function closeTarget(targetId) {
  if (!targetId || keepTab) return;
  try {
    await fetch(`${CDP_BASE}/json/close/${targetId}`);
  } catch {
    // Best-effort cleanup only; evidence is already written before this runs.
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  return {
    send(method, params = {}) {
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function clickAt(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

async function drag(cdp, fromX, fromY, toX, toY) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: fromX, y: fromY });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: fromX, y: fromY, button: "left", clickCount: 1 });
  for (let step = 1; step <= 8; step += 1) {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: fromX + ((toX - fromX) * step) / 8,
      y: fromY + ((toY - fromY) * step) / 8,
      button: "left",
    });
  }
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: toX, y: toY, button: "left", clickCount: 1 });
}

async function pageSummary(cdp) {
  const result = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const text = document.body.innerText || '';
      const surfaceSelector = '[data-vizual-render-status], [data-vizual-render-mount]';
      const controlSelector = 'input,select,textarea,button,[role="button"]';
      const visualSelector = 'canvas,svg,table';
      const surfaces = Array.from(document.querySelectorAll(surfaceSelector)).map((element, index) => {
        const rect = element.getBoundingClientRect();
        const nestedControls = Array.from(element.querySelectorAll(controlSelector)).filter((child) => {
          const childRect = child.getBoundingClientRect();
          return childRect.width > 0 && childRect.height > 0;
        });
        const nestedVisuals = Array.from(element.querySelectorAll(visualSelector)).filter((child) => {
          const childRect = child.getBoundingClientRect();
          return childRect.width > 20 && childRect.height > 20;
        });
        const surfaceText = element.innerText.trim();
        const visible = rect.width > 20 && rect.height > 20;
        const hasVisibleContent = surfaceText.length > 20 || nestedControls.length > 0 || nestedVisuals.length > 0;
        return {
          index,
          status: element.getAttribute('data-vizual-render-status') || '',
          surfaceId: element.getAttribute('data-vizual-surface-id') || '',
          previewOk: element.getAttribute('data-vizual-preview-ok') || '',
          issues: element.getAttribute('data-vizual-preview-issues') || '',
          components: element.getAttribute('data-vizual-preview-components') || '',
          text: surfaceText.slice(0, 600),
          textLength: surfaceText.length,
          nestedControlCount: nestedControls.length,
          nestedVisualCount: nestedVisuals.length,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          top: Math.round(rect.top),
          visible,
          blank: visible && !hasVisibleContent,
        };
      });
      const controls = Array.from(document.querySelectorAll('[data-vizual-render-status] input,[data-vizual-render-status] select,[data-vizual-render-status] textarea,[data-vizual-render-status] button,[data-vizual-render-status] [role="button"],[data-vizual-render-mount] input,[data-vizual-render-mount] select,[data-vizual-render-mount] textarea,[data-vizual-render-mount] button,[data-vizual-render-mount] [role="button"]')).map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tag: element.tagName,
          role: element.getAttribute('role') || '',
          type: element.type || '',
          value: element.value || '',
          text: (element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 160),
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
        };
      }).filter((control) => control.visible);
      const visuals = Array.from(document.querySelectorAll('[data-vizual-render-status] canvas,[data-vizual-render-status] svg,[data-vizual-render-status] table,[data-vizual-render-mount] canvas,[data-vizual-render-mount] svg,[data-vizual-render-mount] table')).map((element, index) => {
        const rect = element.getBoundingClientRect();
        return { index, tag: element.tagName, w: Math.round(rect.width), h: Math.round(rect.height), top: Math.round(rect.top), text: element.innerText?.slice(0, 160) || '' };
      }).filter((visual) => visual.w > 20 && visual.h > 20);
      return {
        url: location.href,
        title: document.title,
        pending: /正在生成|正在运行|正在思考|正在处理|思考中|运行中|Running|Loading|加载中|Thinking|Generating|Submitting|处理中|请稍候/.test(text),
        textLength: text.length,
        textTail: text.slice(-1800),
        surfaceCount: surfaces.length,
        blankSurfaceCount: surfaces.filter((surface) => surface.blank).length,
        fallbackSurfaceCount: surfaces.filter((surface) => surface.status === 'fallback' || surface.previewOk === 'false' || surface.issues).length,
        surfaces,
        controlCount: controls.length,
        controls,
        visualCount: visuals.length,
        visuals,
      };
    })()`,
    returnByValue: true,
  });
  return result.result.value;
}

async function threadMessageSummary(threadId) {
  if (!threadId) return null;
  try {
    const response = await fetch(`${DEERFLOW_URL}/api/langgraph/threads/${threadId}/state`);
    if (!response.ok) return null;
    const state = await response.json();
    const messages = state?.values?.messages;
    if (!Array.isArray(messages)) return null;
    return {
      count: messages.length,
      lastType: messages.at(-1)?.type || "",
      tailTypes: messages.slice(-6).map((message) => message?.type || ""),
    };
  } catch {
    return null;
  }
}

async function capture(cdp, fileName) {
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await fs.writeFile(path.join(outDir, fileName), Buffer.from(screenshot.data, "base64"));
}

async function waitForTextarea(cdp, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const textarea = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const element = document.querySelector('textarea');
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 20) return null;
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height };
      })()`,
      returnByValue: true,
    });
    if (textarea.result.value) return textarea.result.value;
    await sleep(1000);
  }
  return null;
}

function inViewport(control) {
  return control.visible && control.y >= 0 && control.y <= 1200 && control.x >= 0 && control.x <= 1600;
}

async function centerMatchingControl(cdp, control) {
  if (!control) return null;
  const result = await cdp.send("Runtime.evaluate", {
    expression: `((targetText, targetTag, targetRole) => {
      const selector = '[data-vizual-render-status] input,[data-vizual-render-status] select,[data-vizual-render-status] textarea,[data-vizual-render-status] button,[data-vizual-render-status] [role="button"],[data-vizual-render-mount] input,[data-vizual-render-mount] select,[data-vizual-render-mount] textarea,[data-vizual-render-mount] button,[data-vizual-render-mount] [role="button"]';
      const candidates = Array.from(document.querySelectorAll(selector)).filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 160);
        const tag = element.tagName;
        const role = element.getAttribute('role') || '';
        return text === targetText && tag === targetTag && role === targetRole;
      });
      const element = candidates[0];
      if (!element) return null;
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        role: element.getAttribute('role') || '',
        type: element.type || '',
        text: (element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 160),
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        visible: rect.width > 0 && rect.height > 0,
      };
    })(${JSON.stringify(control.text || "")}, ${JSON.stringify(control.tag || "")}, ${JSON.stringify(control.role || "")})`,
    returnByValue: true,
  });
  await sleep(500);
  return result.result.value || control;
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  let target;
  let cdp;

  let summaryBeforeInteraction = null;
  let summaryAfterInteraction = null;
  let stateBeforeInteraction = null;
  let stateAfterInteraction = null;
  let threadId = "";
  const pollLog = [];
  let targetPreflight = null;

  try {
    targetPreflight = await preflightTargets();
    target = await cdpFetch(`/json/new?${encodeURIComponent(`${DEERFLOW_URL}/workspace/chats/new`)}`, {
      method: "PUT",
    });
    cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.bringToFront");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1600,
      height: 1200,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(2500);

    const textarea = await waitForTextarea(cdp);
    if (!textarea) throw new Error("DeerFlow textarea not visible");
    await clickAt(cdp, textarea.x, textarea.y);
    await cdp.send("Input.insertText", { text: prompt.trim() });
    await capture(cdp, "submitted-before-click.png");

    const submit = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find((candidate) => (candidate.innerText || candidate.getAttribute('aria-label') || '').trim() === 'Submit' && candidate.getBoundingClientRect().width > 20);
        if (!button) return null;
        const rect = button.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`,
      returnByValue: true,
    });
    if (!submit.result.value) throw new Error("Submit button not found");
    await clickAt(cdp, submit.result.value.x, submit.result.value.y);

    const start = Date.now();
    let stable = 0;
    while (Date.now() - start < waitMs) {
      await sleep(3000);
      summaryBeforeInteraction = await pageSummary(cdp);
      const match = summaryBeforeInteraction.url.match(/\/workspace\/chats\/([^/?#]+)/);
      if (match) threadId = match[1];
      const hasFinalishText = summaryBeforeInteraction.textLength > 800 && !summaryBeforeInteraction.pending;
      const hasSurfaceOrDone = summaryBeforeInteraction.surfaceCount > 0 || hasFinalishText;
      const stateNow = await threadMessageSummary(threadId);
      pollLog.push({
        t: Math.round((Date.now() - start) / 1000),
        threadId,
        state: stateNow,
        summary: {
          pending: summaryBeforeInteraction.pending,
          textLength: summaryBeforeInteraction.textLength,
          surfaceCount: summaryBeforeInteraction.surfaceCount,
          blankSurfaceCount: summaryBeforeInteraction.blankSurfaceCount,
          fallbackSurfaceCount: summaryBeforeInteraction.fallbackSurfaceCount,
          controlCount: summaryBeforeInteraction.controlCount,
          visualCount: summaryBeforeInteraction.visualCount,
        },
      });
      const agentSettled = !stateNow || stateNow.lastType === "ai";
      if (threadId && hasFinalishText && hasSurfaceOrDone && agentSettled) stable += 1;
      else stable = 0;
      if (stable >= 3) break;
    }

    await fs.writeFile(path.join(outDir, "summary-before-interaction.json"), JSON.stringify(summaryBeforeInteraction, null, 2));
    await fs.writeFile(path.join(outDir, "poll-log.json"), JSON.stringify(pollLog, null, 2));

    const firstSurface = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const surface = document.querySelector('[data-vizual-render-status], [data-vizual-render-mount]');
        if (!surface) return false;
        surface.scrollIntoView({ block: 'start' });
        return true;
      })()`,
      returnByValue: true,
    });
    await sleep(700);
    await capture(cdp, firstSurface.result.value ? "surface-visible.png" : "final-visible.png");
    const summaryVisibleBeforeInteraction = await pageSummary(cdp);
    await fs.writeFile(
      path.join(outDir, "summary-visible-before-interaction.json"),
      JSON.stringify(summaryVisibleBeforeInteraction, null, 2),
    );
    stateBeforeInteraction = await threadMessageSummary(threadId);
    if (stateBeforeInteraction) {
      await fs.writeFile(
        path.join(outDir, "state-before-interaction.json"),
        JSON.stringify(stateBeforeInteraction, null, 2),
      );
    }

    if (shouldInteract && summaryVisibleBeforeInteraction?.controlCount > 0) {
      const controls = summaryVisibleBeforeInteraction.controls.filter(inViewport);
      const range = controls.find((control) => control.tag === "INPUT" && control.type === "range" && control.w > 60);
      const button = controls.find((control) => (control.tag === "BUTTON" || control.role === "button") && control.visible);
      if (range) {
        const centeredRange = await centerMatchingControl(cdp, range);
        const targetX = Math.max(centeredRange.left + 8, Math.min(centeredRange.right - 8, centeredRange.left + centeredRange.w * 0.82));
        await drag(cdp, centeredRange.x, centeredRange.y, targetX, centeredRange.y);
        await sleep(500);
      }
      if (button) {
        const centeredButton = await centerMatchingControl(cdp, button);
        await clickAt(cdp, centeredButton.x, centeredButton.y);
        await sleep(1000);
      }
      const interactStart = Date.now();
      let changed = false;
      while (Date.now() - interactStart < 180000) {
        await sleep(3000);
        summaryAfterInteraction = await pageSummary(cdp);
        stateAfterInteraction = await threadMessageSummary(threadId);
        const agentContinued =
          stateBeforeInteraction &&
          stateAfterInteraction &&
          stateAfterInteraction.count >= stateBeforeInteraction.count + 2 &&
          stateAfterInteraction.lastType === "ai";
        pollLog.push({
          t: `after-${Math.round((Date.now() - interactStart) / 1000)}`,
          threadId,
          state: stateAfterInteraction,
          summary: {
            pending: summaryAfterInteraction.pending,
            textLength: summaryAfterInteraction.textLength,
            surfaceCount: summaryAfterInteraction.surfaceCount,
            blankSurfaceCount: summaryAfterInteraction.blankSurfaceCount,
            fallbackSurfaceCount: summaryAfterInteraction.fallbackSurfaceCount,
            controlCount: summaryAfterInteraction.controlCount,
            visualCount: summaryAfterInteraction.visualCount,
          },
        });
        changed =
          agentContinued ||
          summaryAfterInteraction.textLength > (summaryVisibleBeforeInteraction?.textLength || 0) + 50 ||
          summaryAfterInteraction.surfaceCount > (summaryVisibleBeforeInteraction?.surfaceCount || 0);
        if (!summaryAfterInteraction.pending && changed && (!stateBeforeInteraction || agentContinued)) break;
      }
      await fs.writeFile(path.join(outDir, "summary-after-interaction.json"), JSON.stringify(summaryAfterInteraction, null, 2));
      await fs.writeFile(path.join(outDir, "poll-log.json"), JSON.stringify(pollLog, null, 2));
      if (stateAfterInteraction) {
        await fs.writeFile(
          path.join(outDir, "state-after-interaction.json"),
          JSON.stringify(stateAfterInteraction, null, 2),
        );
      }
      await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const surfaces = document.querySelectorAll('[data-vizual-render-status], [data-vizual-render-mount]');
          const target = surfaces[surfaces.length - 1];
          if (target) target.scrollIntoView({ block: 'start' });
          else window.scrollTo(0, document.documentElement.scrollHeight);
          return true;
        })()`,
        returnByValue: true,
      });
      await sleep(700);
      await capture(cdp, "after-interaction-visible.png");
    }

    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, document.documentElement.scrollHeight); true", returnByValue: true });
    await sleep(700);
    await capture(cdp, "final-bottom.png");

    const output = {
      outDir,
      resultJson: path.join(outDir, "result.json"),
      threadId,
      targetPreflight,
      before: summaryBeforeInteraction,
      after: summaryAfterInteraction,
      stateBeforeInteraction,
      stateAfterInteraction,
      pollLog,
      evidence: {
        submitted: path.join(outDir, "submitted-before-click.png"),
        surface: path.join(outDir, firstSurface.result.value ? "surface-visible.png" : "final-visible.png"),
        afterInteraction: shouldInteract ? path.join(outDir, "after-interaction-visible.png") : null,
        finalBottom: path.join(outDir, "final-bottom.png"),
      },
    };
    await fs.writeFile(path.join(outDir, "result.json"), JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
  } finally {
    cdp?.close();
    await closeTarget(target?.id);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
