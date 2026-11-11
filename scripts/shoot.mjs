// Dev-only: capture screenshots at an exact CSS viewport with an emulated
// colour scheme, using Edge + the DevTools protocol. Not part of the site.
//
//   node scripts/shoot.mjs <url> <width> <height> <light|dark> <out.png> [full]
//
// Requires Node 22+ (global WebSocket) and Microsoft Edge on Windows.

import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, width = "390", height = "844", scheme = "light", out = "shot.png", full] = process.argv.slice(2);
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9333 + Math.floor(Math.random() * 200);
const profile = await mkdtemp(join(tmpdir(), "edge-cdp-"));

const child = spawn(EDGE, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(path, init) {
  for (let i = 0; i < 200; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`, init);
      if (res.ok) return res.json();
    } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error("Edge did not expose the debugging port");
}

const version = await json("/json/version");
const target = await json("/json/new?about:blank", { method: "PUT" });
const ws = new WebSocket(target.webSocketDebuggerUrl);

let id = 0;
const pending = new Map();
const events = new Map();

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method && events.has(msg.method)) {
    events.get(msg.method).forEach((fn) => fn(msg.params));
    events.delete(msg.method);
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const messageId = ++id;
  ws.send(JSON.stringify({ id: messageId, method, params }));
  return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
}

function once(method) {
  return new Promise((resolve) => events.set(method, [resolve]));
}

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(width),
  height: Number(height),
  deviceScaleFactor: 1,
  mobile: Number(width) < 600,
});
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-color-scheme", value: scheme },
    // Reveal-on-scroll elements only animate in when scrolled to; for a
    // full-page capture we want them visible immediately.
    { name: "prefers-reduced-motion", value: "reduce" },
  ],
});

// Start from a clean profile so localStorage is empty and the media query wins.
await send("Page.navigate", { url });
await once("Page.loadEventFired");
await sleep(400);

// Scroll through once so lazy-loaded images are fetched before capture.
await send("Runtime.evaluate", {
  expression: `(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
    return document.body.scrollHeight;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});

if (process.env.SHOOT_EXPR) {
  const result = await send("Runtime.evaluate", {
    expression: process.env.SHOOT_EXPR,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log("eval:", JSON.stringify(result.result?.value));
  await sleep(300);
}

await sleep(300);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: Boolean(full),
});

await writeFile(out, Buffer.from(shot.data, "base64"));
console.log(`saved ${out} (${version.Browser})`);

ws.close();
child.kill();
process.exit(0);
