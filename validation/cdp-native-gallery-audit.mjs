import fs from "node:fs/promises";
import path from "node:path";

const CDP_HOST = process.env.CDP_HOST || "127.0.0.1";
const CDP_PORT = process.env.CDP_PORT || "9227";
const DEFAULT_URL =
  "http://127.0.0.1:8793/validation/eval-full-31.html?run=native-core-gallery";

const cliArgs = process.argv.slice(2);
const keepTab = cliArgs.includes("--keep-tab") || process.env.KEEP_CDP_TAB === "true";
const positionalArgs = cliArgs.filter((arg) => arg !== "--keep-tab");
const targetUrl = positionalArgs[0] || DEFAULT_URL;
const outDir =
  positionalArgs[1] ||
  path.join(
    process.cwd(),
    "validation",
    "artifacts",
    `native-core-gallery-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

async function cdpFetch(route, init) {
  const response = await fetch(`http://${CDP_HOST}:${CDP_PORT}${route}`, init);
  if (!response.ok) {
    throw new Error(`${route} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function openTarget(url) {
  const target = await cdpFetch(`/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  return target;
}

async function closeTarget(targetId) {
  if (!targetId || keepTab) return;
  try {
    await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/close/${targetId}`);
  } catch {
    // Best-effort cleanup only; artifacts are already written before this runs.
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
      return new Promise((resolve, reject) => {
        pending.set(callId, { resolve, reject });
      });
    },
    close() {
      ws.close();
    },
  };
}

async function writePng(filePath, captureResult) {
  await fs.writeFile(filePath, Buffer.from(captureResult.data, "base64"));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  let target;
  let cdp;

  try {
    target = await openTarget(targetUrl);
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
    await cdp.send("Page.navigate", { url: targetUrl });
    await cdp.send("Runtime.evaluate", {
      expression: `new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
          if (window.__vizualCatalogResults || Date.now() - start > 30000) resolve(true);
          else setTimeout(tick, 250);
        };
        tick();
      })`,
      awaitPromise: true,
      returnByValue: true,
    });

    const evaluation = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const results = window.__vizualCatalogResults || [];
        const cards = Array.from(document.querySelectorAll('.case')).map((card, index) => {
          const area = card.querySelector('.render-area');
          const rect = card.getBoundingClientRect();
          const areaRect = area?.getBoundingClientRect?.() || { width: 0, height: 0 };
          const primitives = Array.from(
            card.querySelectorAll('canvas,svg,img,video,audio,table,input,textarea,select,button,[role="button"],[role="tab"],[role="slider"]')
          ).map((element) => {
            const primitiveRect = element.getBoundingClientRect();
            const isImage = element.tagName === 'IMG';
            return {
              tag: element.tagName,
              role: element.getAttribute('role') || '',
              width: Math.round(primitiveRect.width),
              height: Math.round(primitiveRect.height),
              loaded: isImage ? Boolean(element.complete && element.naturalWidth > 0 && element.naturalHeight > 0) : true,
              naturalWidth: isImage ? element.naturalWidth : undefined,
              naturalHeight: isImage ? element.naturalHeight : undefined,
              text: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('alt') || '').trim().slice(0, 80),
            };
          }).filter((primitive) => primitive.width > 0 && primitive.height > 0);

          const textLength = (area?.innerText || '').trim().length;
          const brokenMedia = primitives.filter((primitive) => primitive.loaded === false);
          return {
            index,
            id: card.id,
            name: card.querySelector('.case-title')?.textContent?.trim() || '',
            badge: card.querySelector('.badge')?.textContent?.trim() || '',
            resultOk: Boolean(results[index]?.ok),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            areaWidth: Math.round(areaRect.width),
            areaHeight: Math.round(areaRect.height),
            textLength,
            primitiveCount: primitives.length,
            brokenMedia,
            primitives: primitives.slice(0, 8),
            visible: rect.width > 80 && rect.height > 80 && areaRect.width > 80 && areaRect.height > 40 && (textLength > 0 || primitives.length > 0) && brokenMedia.length === 0,
          };
        });

        const failures = cards.filter((card) =>
          card.badge !== 'Rendered' ||
          !card.resultOk ||
          !card.visible ||
          card.brokenMedia.length > 0 ||
          (card.textLength === 0 && card.primitiveCount === 0)
        );

        return {
          url: location.href,
          title: document.title,
          statusText: document.querySelector('#status')?.textContent?.trim() || '',
          resultCount: results.length,
          passCount: results.filter((result) => result.ok).length,
          failCount: results.filter((result) => !result.ok).length,
          cardCount: cards.length,
          failures,
          cards,
          scrollHeight: document.documentElement.scrollHeight,
          viewport: { width: innerWidth, height: innerHeight },
        };
      })()`,
      returnByValue: true,
    });

    const summary = evaluation.result.value;
    await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

    const maxY = Math.max(0, summary.scrollHeight - 1200);
    const positions = Array.from(new Set([0, Math.floor(maxY / 3), Math.floor((maxY * 2) / 3), maxY]));
    for (let index = 0; index < positions.length; index += 1) {
      await cdp.send("Runtime.evaluate", {
        expression: `window.scrollTo(0, ${positions[index]}); true`,
        returnByValue: true,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      });
      await writePng(path.join(outDir, `viewport-${String(index).padStart(2, "0")}.png`), screenshot);
    }

    await cdp.send("Runtime.evaluate", {
      expression: "window.scrollTo(0, 0); true",
      returnByValue: true,
    });
    const layout = await cdp.send("Page.getLayoutMetrics");
    const fullPage = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: Math.min(1600, Math.ceil(layout.contentSize.width)),
        height: Math.min(30000, Math.ceil(layout.contentSize.height)),
        scale: 1,
      },
    });
    await writePng(path.join(outDir, "fullpage.png"), fullPage);

    console.log(
      JSON.stringify(
        {
          ok: summary.failCount === 0 && summary.failures.length === 0 && summary.cardCount === 52,
          outDir,
          statusText: summary.statusText,
          passCount: summary.passCount,
          failCount: summary.failCount,
          cardCount: summary.cardCount,
          failures: summary.failures,
          scrollHeight: summary.scrollHeight,
        },
        null,
        2,
      ),
    );
  } finally {
    cdp?.close();
    await closeTarget(target?.id);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
