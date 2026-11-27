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

async function waitSettled(page, extraMs = 1600) {
  await page.waitForFunction(
    () => Boolean(window.__PALEMBANG_3D__?.ready && !window.__PALEMBANG_3D__?.tweening),
    null,
    { timeout: 25000 }
  );
  await page.waitForTimeout(extraMs);
}

const PORT = 4183;
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
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await waitSettled(page, 2200);

  // 1. v2.4 Gedung Ledeng + Rumah Limas + 2D Mini-Map Radar
  await page.click('[data-preset-btn="kuto-besak"]');
  await page.waitForTimeout(1400);
  await waitSettled(page, 1600);
  const radarVisible = await page.evaluate(() => Boolean(window.__PALEMBANG_3D__?.radarVisible));
  if (!radarVisible) throw new Error('Radar should be visible by default');
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-bkb-limas-radar.png') });

  // 2. v2.1 Festival Bidar Sungai Musi
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(250);
  await page.click('[data-drawer-tab="festival"]');
  await page.waitForTimeout(200);
  await page.click('[data-festival-btn="bidar"]');
  await page.waitForTimeout(1800);
  const bidarMode = await page.evaluate(() => window.__PALEMBANG_3D__?.festivalMode);
  if (bidarMode !== 'bidar') throw new Error(`Bidar festival failed: ${bidarMode}`);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-festival-bidar.png') });

  // 3. v2.1 Malam Kembang Api Ampera + Lampion Kemaro + 24h Slider
  await page.click('[data-festival-btn="fireworks"]');
  await page.waitForTimeout(2200);
  const fwCheck = await page.evaluate(() => ({
    festivalMode: window.__PALEMBANG_3D__?.festivalMode,
    lighting: window.__PALEMBANG_3D__?.lighting,
    hour: window.__PALEMBANG_3D__?.hour,
  }));
  if (fwCheck.festivalMode !== 'fireworks' || fwCheck.lighting !== 'malam') {
    throw new Error(`Fireworks festival failed: ${JSON.stringify(fwCheck)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-festival-fireworks.png') });

  // 4. v2.1 Photo Mode (hides HUD cleanly, shows bottom shutter pill)
  await page.click('[data-photo-enter="true"]');
  await page.waitForTimeout(450);
  const inPhoto = await page.evaluate(() => Boolean(window.__PALEMBANG_3D__?.photoMode));
  if (!inPhoto) throw new Error('Photo Mode did not activate');
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-photo-mode.png') });
  await page.click('[data-photo-exit="true"]');
  await page.waitForTimeout(250);

  // Stop festival & return to daylight for Playable Boat test
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-festival-btn="fireworks"]');
  await page.click('[data-lighting-btn="siang"]');

  // 5. v2.2 Playable Perahu Ketek + 5 Sriwijaya Golden Relics
  await page.click('[data-drawer-tab="ride"]');
  await page.waitForTimeout(200);
  await page.click('[data-action-mode="play-boat"]');
  await page.click('[data-explore-btn="true"]'); // collapse drawer for immersive view
  await page.waitForTimeout(400);
  const boat0 = await page.evaluate(() => window.__PALEMBANG_3D__?.playableBoat);
  await page.keyboard.down('KeyW');
  await page.waitForFunction(
    (b0) => {
      const b = window.__PALEMBANG_3D__?.playableBoat;
      return b?.active && Math.hypot(b.lng - b0.lng, b.lat - b0.lat) > 0.00004;
    },
    boat0,
    { timeout: 10000 }
  );
  await page.keyboard.up('KeyW');
  const boat1 = await page.evaluate(() => window.__PALEMBANG_3D__?.playableBoat);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-playable-boat.png') });
  await page.click('[data-stop-mode-btn="true"]');

  // 6. v2.3 Real Road Route Planner (Ampera -> Pempek Candy) + Full Bilingual EN toggle
  await page.click('[data-lang-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(200);
  await page.click('[data-drawer-tab="explore"]');
  await page.waitForTimeout(200);
  await page.click('[data-route-go]');
  await page.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.route?.distanceM > 500), null, { timeout: 12000 });
  await page.waitForTimeout(1600);
  const v23Check = await page.evaluate(() => ({
    lang: window.__PALEMBANG_3D__?.lang,
    route: window.__PALEMBANG_3D__?.route,
  }));
  if (v23Check.lang !== 'en' || !v23Check.route?.gmapsUrl) {
    throw new Error(`v2.3 i18n/route check failed: ${JSON.stringify(v23Check)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v2-route-en.png') });

  // Verify PWA manifest & SW exist in dist/
  const pwaFilesOk =
    fs.existsSync(path.join(distDir, 'manifest.webmanifest')) &&
    fs.existsSync(path.join(distDir, 'icon.svg')) &&
    fs.existsSync(path.join(distDir, 'sw.js'));
  if (!pwaFilesOk) throw new Error('PWA files missing in dist/');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        radarVisible,
        bidarMode,
        fwCheck,
        inPhoto,
        boatMoved: Math.hypot(boat1.lng - boat0.lng, boat1.lat - boat0.lat) > 0.00004,
        boat1,
        v23Check: {
          lang: v23Check.lang,
          from: v23Check.route.fromLabel,
          to: v23Check.route.toLabel,
          formatted: v23Check.route.formatted,
          source: v23Check.route.source,
        },
        pwaFilesOk,
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
