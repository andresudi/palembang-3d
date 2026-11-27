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

const PORT = 4188;
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
  await page.waitForTimeout(1200);

  const initState = await page.evaluate(() => ({
    heroCount: window.__PALEMBANG_3D__?.heroCount,
    passportTotal: window.__PALEMBANG_3D__?.passport?.total,
    landmarkCount: window.__PALEMBANG_3D__?.landmarkCount,
  }));
  if (initState.heroCount !== 14) throw new Error(`Expected 14 hero 3D models, got ${initState.heroCount}`);
  if (initState.passportTotal !== 26) throw new Error(`Expected 26 POIs in Passport, got ${initState.passportTotal}`);

  // 1. Test Ampera 1965 Vertical-Lift button (+24m raised span + Pinisi ship)
  await page.click('[data-preset-btn="ampera"]');
  await page.waitForTimeout(1600);
  await page.click('[data-ampera-lift-btn="true"]');
  await page.waitForFunction(() => (window.__PALEMBANG_3D__?.amperaLift?.liftMeters || 0) >= 20, null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  const amperaLift = await page.evaluate(() => window.__PALEMBANG_3D__?.amperaLift);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-ampera-lift.png') });
  // Lower Ampera back down
  await page.click('[data-ampera-lift-btn="true"]');
  await page.waitForTimeout(300);

  // 2. Test Tugu Ikan Belido (via Pin/Drawer Jelajah)
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-drawer-tab="explore"]');
  await page.waitForTimeout(200);
  await page.click('[data-poi-card="tugu-belido"]');
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(1700);
  const liftVisibleOnBelido = await page.locator('[data-ampera-lift-btn="true"]').isVisible();
  if (liftVisibleOnBelido) throw new Error('Ampera Lift button should be hidden on non-Ampera cards');
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-tugu-belido.png') });

  // 3. Test Jembatan Musi VI at Night (RGB LED Arch Lightshow!)
  await page.click('[data-lighting-btn="malam"]');
  await page.click('[data-preset-btn="musi-vi"]');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-musi-vi-night.png') });

  // 4. Test Masjid Cheng Ho Jakabaring at Sunset
  await page.click('[data-lighting-btn="senja"]');
  await page.click('[data-preset-btn="masjid-cheng-ho"]');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-cheng-ho.png') });

  // 5. Test Danau Dayung Jakabaring (Day — Rowing Race)
  await page.click('[data-lighting-btn="siang"]');
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-poi-card="danau-dayung"]');
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(1700);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-danau-dayung.png') });

  // 6. Test Taman Kambang Iwak Besak (Sunset — Dancing Lake Fountain + Joggers)
  await page.click('[data-lighting-btn="senja"]');
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-poi-card="kambang-iwak"]');
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(1700);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-kambang-iwak.png') });

  // 7. Test Bukit Siguntang at Night (Golden Fireflies + Pendopo)
  await page.click('[data-lighting-btn="malam"]');
  await page.click('[data-preset-btn="bukit-siguntang"]');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v35-bukit-siguntang.png') });

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        initState,
        amperaLift,
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
