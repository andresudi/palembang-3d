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

const PORT = 4189;
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

  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(`http://127.0.0.1:${PORT}/?mode=satellite&noonboarding=1`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.ready), null, { timeout: 25000 });
  await page.waitForTimeout(1200);

  // 1. Tap Ampera -> must open compact Peek Bar (NOT giant full card!)
  await page.click('[data-preset-btn="ampera"]');
  await page.waitForTimeout(1800);
  const peekCheck = await page.evaluate(() => {
    const card = document.querySelector('.info-card');
    const rect = card.getBoundingClientRect();
    return {
      infoMode: window.__PALEMBANG_3D__?.infoMode,
      heightPx: Math.round(rect.height),
      peekVisible: document.querySelector('[data-info-peek-bar]').getBoundingClientRect().height > 20,
    };
  });
  if (peekCheck.infoMode !== 'peek' || peekCheck.heightPx > 82) {
    throw new Error(`Expected compact Peek Bar (<=82px), got: ${JSON.stringify(peekCheck)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v36-mobile-peek.png') });

  // 2. Tap Detail -> expands smoothly; tap Ringkas -> returns to Peek
  await page.click('[data-peek-expand]');
  await page.waitForTimeout(400);
  const expandedCheck = await page.evaluate(() => ({
    infoMode: window.__PALEMBANG_3D__?.infoMode,
    heightPx: Math.round(document.querySelector('.info-card').getBoundingClientRect().height),
  }));
  if (expandedCheck.infoMode !== 'expanded' || expandedCheck.heightPx < 150) {
    throw new Error(`Expected expanded mobile Info Card, got: ${JSON.stringify(expandedCheck)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v36-mobile-expanded.png') });

  // 3. Start Playable Perahu Ketek on mobile -> drawer MUST auto-close & Virtual Joystick MUST drive boat!
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(250);
  await page.click('[data-action-mode="play-boat"]');
  await page.waitForTimeout(700);

  const boatStart = await page.evaluate(() => ({
    drawerOpen: window.__PALEMBANG_3D__?.drawerOpen,
    boat: window.__PALEMBANG_3D__?.playableBoat,
    joyRect: document.querySelector('[data-boat-joystick="true"]')?.getBoundingClientRect()?.toJSON(),
    turboVisible: document.querySelector('[data-boat-turbo="true"]')?.getBoundingClientRect()?.width > 30,
  }));
  if (boatStart.drawerOpen) throw new Error('Explore drawer did NOT auto-close when starting Perahu Ketek on mobile!');
  if (!boatStart.boat?.active) throw new Error('Playable boat did not activate!');
  if (!boatStart.joyRect || boatStart.joyRect.width < 90) {
    throw new Error(`Virtual Joystick not visible on mobile: ${JSON.stringify(boatStart.joyRect)}`);
  }

  // Simulate thumb dragging the Virtual Joystick UP-RIGHT to accelerate & steer simultaneously!
  const cx = boatStart.joyRect.left + boatStart.joyRect.width / 2;
  const cy = boatStart.joyRect.top + boatStart.joyRect.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 18, cy - 38, { steps: 6 });

  await page.waitForFunction(
    (startLat) => {
      const b = window.__PALEMBANG_3D__?.playableBoat;
      return b && b.speedKmh >= 15 && Math.hypot(b.lat - startLat, 0) > 0.0001;
    },
    boatStart.boat.lat,
    { timeout: 12000 }
  );
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v36-mobile-boat-joystick.png') });
  await page.mouse.up();

  const boatMoved = await page.evaluate(() => window.__PALEMBANG_3D__?.playableBoat);

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        peekCheck,
        expandedCheck,
        boatStart: {
          drawerOpen: boatStart.drawerOpen,
          turboVisible: boatStart.turboVisible,
          startLng: boatStart.boat.lng,
          startLat: boatStart.boat.lat,
        },
        boatMoved: {
          speedKmh: boatMoved.speedKmh,
          endLng: boatMoved.lng,
          endLat: boatMoved.lat,
          bearingDeg: boatMoved.bearingDeg,
        },
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
