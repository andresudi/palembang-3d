import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const artifactsDir = path.join(projectRoot, 'artifacts');

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run `npm run build` before verifying.');
  process.exit(1);
}
fs.mkdirSync(artifactsDir, { recursive: true });

function resolvePlaywright() {
  for (const modPath of [
    process.env.PLAYWRIGHT_PATH,
    'playwright',
    path.join(os.homedir(), '.npm/_npx/31e32ef8478fbf80/node_modules/playwright'),
  ].filter(Boolean)) {
    try {
      return require(modPath);
    } catch {}
  }
  throw new Error('Playwright not found');
}

function resolveExecutablePath() {
  for (const exe of [
    process.env.CHROMIUM_EXECUTABLE_PATH,
    path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'),
    path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  ].filter(Boolean)) {
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Preview server timeout at ${url}`);
}

async function waitForMapSettled(page) {
  await page.waitForFunction(
    () => Boolean(window.__PALEMBANG_3D__?.ready && !window.__PALEMBANG_3D__?.tweening),
    null,
    { timeout: 25000 }
  );
  // Allow satellite/OSM tiles & 3D hero layer to settle cleanly
  await page.waitForTimeout(2400);
}

const PORT = 4181;
const BASE_URL = `http://127.0.0.1:${PORT}/?mode=satellite`;

const previewProc = spawn(
  process.execPath,
  [path.join(projectRoot, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
);

let browser;
try {
  await waitForServer(`http://127.0.0.1:${PORT}/`);
  const { chromium } = resolvePlaywright();
  const executablePath = resolveExecutablePath();

  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const consoleLogs = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    consoleLogs.push(`[${m.type()}] ${m.text()}`);
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
  try {
    await waitForMapSettled(page);
  } catch (err) {
    const state = await page.evaluate(() => ({
      telemetry: window.__PALEMBANG_3D__,
      html: document.getElementById('app')?.innerText?.slice(0, 300),
    }));
    console.error('DIAGNOSTIC:', JSON.stringify({ state, consoleErrors, pageErrors, recentLogs: consoleLogs.slice(-15) }, null, 2));
    throw err;
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-sat-overview.png') });

  for (const [presetId, file] of [
    ['ampera', 'preview-sat-ampera.png'],
    ['masjid-lrt', 'preview-sat-masjid.png'],
    ['kuto-besak', 'preview-sat-bkb.png'],
    ['jakabaring', 'preview-sat-jakabaring.png'],
    ['musi-iv', 'preview-sat-musi-iv.png'],
    ['pulau-kemaro', 'preview-sat-kemaro.png'],
  ]) {
    await page.click(`[data-preset-btn="${presetId}"]`);
    await page.waitForTimeout(1600);
    await waitForMapSettled(page);
    await page.screenshot({ path: path.join(artifactsDir, file) });
  }

  // Sunset Ampera
  await page.click('[data-preset-btn="ampera"]');
  await page.click('[data-lighting-btn="senja"]');
  await page.waitForTimeout(1600);
  await waitForMapSettled(page);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-sat-ampera-sunset.png') });

  // Night Overview
  await page.click('[data-preset-btn="overview"]');
  await page.click('[data-lighting-btn="malam"]');
  await page.waitForTimeout(1600);
  await waitForMapSettled(page);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-sat-night.png') });

  const telemetry = await page.evaluate(() => window.__PALEMBANG_3D__);
  console.log(JSON.stringify({ status: 'PASS', telemetry, consoleErrors, pageErrors }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (!previewProc.killed) previewProc.kill('SIGTERM');
}
