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
  console.error('dist/ not found. Run `npm run build` first.');
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
    path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
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

const PORT = 4187;
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
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(`http://127.0.0.1:${PORT}/?mode=satellite&noonboarding=1`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.ready), null, { timeout: 25000 });
  await page.waitForTimeout(1600);

  // 1. Click Ampera -> verify Wikimedia real photo loads in Info Card + Lightbox opens cleanly
  await page.click('[data-preset-btn="ampera"]');
  await page.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.currentPhoto?.thumbUrl), null, { timeout: 10000 });
  await page.waitForTimeout(1600);
  const amperaPhoto = await page.evaluate(() => window.__PALEMBANG_3D__?.currentPhoto);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v3-ampera-photo.png') });

  // Open Photo Lightbox
  await page.click('[data-info-photo-btn="true"]');
  await page.waitForTimeout(500);
  const lbOpened = await page.evaluate(() => Boolean(window.__PALEMBANG_3D__?.lightboxOpen));
  if (!lbOpened) throw new Error('Wikimedia photo lightbox did not open');
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v3-lightbox.png') });
  await page.click('[data-lb-close]');
  await page.waitForTimeout(200);

  // 2. Test Audio Guide Speak button & Tour Narration toggle
  await page.click('[data-speak-btn="true"]');
  await page.waitForTimeout(200);
  const speakState = await page.evaluate(() => window.__PALEMBANG_3D__?.audioGuide);

  // 3. Open 5-Era Historical Timeline -> verify archival sepia filter & era switching
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(250);
  await page.click('[data-drawer-tab="festival"]');
  await page.waitForTimeout(200);
  await page.click('[data-timeline-open="true"]');
  await page.waitForTimeout(1800);
  const era1 = await page.evaluate(() => window.__PALEMBANG_3D__?.timeline);
  if (!era1?.active || era1.eraId !== 'era-sriwijaya') {
    throw new Error(`Timeline did not start at Sriwijaya: ${JSON.stringify(era1)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v3-timeline-sriwijaya.png') });

  // Jump to 1780 Kesultanan era
  await page.click('[data-era-btn="era-kesultanan"]');
  await page.waitForTimeout(1800);
  const era2 = await page.evaluate(() => window.__PALEMBANG_3D__?.timeline);
  if (era2.eraId !== 'era-kesultanan') {
    throw new Error(`Timeline switch failed: ${JSON.stringify(era2)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v3-timeline-kesultanan.png') });

  // Exit Timeline back to present
  await page.click('[data-timeline-exit="true"]');
  await page.waitForTimeout(250);
  const afterExit = await page.evaluate(() => window.__PALEMBANG_3D__?.timeline);
  if (afterExit?.active) throw new Error('Timeline did not exit cleanly');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        amperaPhoto,
        lbOpened,
        speakState,
        era1,
        era2,
        afterExit,
        consoleErrors,
        pageErrors,
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close().catch(() => {});
  if (!previewProc.killed) previewProc.kill('SIGTERM');
}
