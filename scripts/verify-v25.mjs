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

const PORT = 4185;
const previewProc = spawn(
  process.execPath,
  [path.join(projectRoot, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
);

let browser;
try {
  // 1. Verify code-splitting produced distinct chunks (diorama, maplibre, three, paths)
  const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
  const hasSplitChunks =
    assetFiles.some((f) => f.includes('vendor-maplibre')) &&
    assetFiles.some((f) => f.includes('vendor-three')) &&
    assetFiles.some((f) => f.includes('dioramaEntry'));
  if (!hasSplitChunks) {
    throw new Error(`Expected code-split chunks missing in dist/assets: ${assetFiles.join(', ')}`);
  }

  await waitForServer(`http://127.0.0.1:${PORT}/`);
  const { chromium } = resolvePlaywright();
  const executablePath = resolveExecutablePath();
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  // === DESKTOP (1280x760) ===
  const ctxDesktop = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  const page = await ctxDesktop.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto(`http://127.0.0.1:${PORT}/?mode=satellite`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.ready), null, { timeout: 25000 });
  await page.waitForTimeout(1800);

  // Onboarding card should appear on first visit
  const desktopInit = await page.evaluate(() => ({
    quality: window.__PALEMBANG_3D__?.quality,
    vehicles: window.__PALEMBANG_3D__?.animationStats?.vehicleCount,
    onboardingOpen: window.__PALEMBANG_3D__?.onboardingOpen,
  }));
  if (!desktopInit.onboardingOpen || desktopInit.quality !== 'high' || desktopInit.vehicles !== 420) {
    throw new Error(`Desktop init check failed: ${JSON.stringify(desktopInit)}`);
  }
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v25-desktop-onboarding.png') });

  // Dismiss onboarding -> Open ? shortcut help modal
  await page.click('[data-onboard-start]');
  await page.waitForTimeout(200);
  await page.click('[data-help-btn="true"]');
  await page.waitForTimeout(250);
  const helpOpened = await page.evaluate(() => Boolean(window.__PALEMBANG_3D__?.helpOpen));
  if (!helpOpened) throw new Error('Shortcut help modal did not open');
  await page.screenshot({ path: path.join(artifactsDir, 'preview-v25-shortcuts.png') });
  await page.click('[data-help-close]');
  await page.waitForTimeout(200);

  // Toggle Graphics Quality: High -> Eco -> verify live instanced counts drop 420 -> 160
  await page.click('[data-explore-btn="true"]');
  await page.waitForTimeout(250);
  await page.click('[data-quality-btn="eco"]');
  await page.waitForTimeout(250);
  const ecoState = await page.evaluate(() => ({
    quality: window.__PALEMBANG_3D__?.quality,
    vehicles: window.__PALEMBANG_3D__?.animationStats?.vehicleCount,
    boats: window.__PALEMBANG_3D__?.animationStats?.boatCount,
  }));
  if (ecoState.quality !== 'eco' || ecoState.vehicles !== 160 || ecoState.boats !== 18) {
    throw new Error(`Eco quality switch failed: ${JSON.stringify(ecoState)}`);
  }

  // Test clean lazy-switch to Diorama mode via code-split chunk
  await page.click('[data-mode-btn="diorama"]');
  await page.waitForFunction(() => window.__PALEMBANG_3D__?.mode === 'diorama' && window.__PALEMBANG_3D__?.ready, null, { timeout: 25000 });
  const dioramaLoaded = await page.evaluate(() => ({
    mode: window.__PALEMBANG_3D__?.mode,
    meshCount: window.__PALEMBANG_3D__?.meshCount,
  }));
  // Release Desktop WebGL2 context before opening Mobile context on SwiftShader
  await ctxDesktop.close();

  // === MOBILE (390x844) ===
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await ctxMobile.newPage();
  mPage.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`[mobile] ${m.text()}`);
  });
  mPage.on('pageerror', (e) => pageErrors.push(`[mobile] ${e.message}`));

  await mPage.goto(`http://127.0.0.1:${PORT}/?mode=satellite&noonboarding=1`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await mPage.waitForFunction(() => Boolean(window.__PALEMBANG_3D__?.ready), null, { timeout: 25000 });
  await mPage.waitForTimeout(1600);

  // Click Ampera preset on Mobile -> verify Mobile Bottom-Sheet Info Card is visible & fits within 390x844!
  await mPage.click('[data-preset-btn="ampera"]');
  await mPage.waitForTimeout(1800);
  const mobileCheck = await mPage.evaluate(() => {
    const top = document.querySelector('.hud-top')?.getBoundingClientRect();
    const card = document.querySelector('.info-card')?.getBoundingClientRect();
    const gmaps = document.querySelector('.info-gmaps-link')?.getBoundingClientRect();
    return {
      quality: window.__PALEMBANG_3D__?.quality,
      vehicles: window.__PALEMBANG_3D__?.animationStats?.vehicleCount,
      topFits: Boolean(top && top.left >= 0 && top.right <= 391),
      cardVisible: Boolean(card && card.width > 200 && card.height > 80 && card.left >= 0 && card.right <= 391),
      gmapsVisible: Boolean(gmaps && gmaps.width > 80 && gmaps.height > 15),
    };
  });
  if (mobileCheck.quality !== 'eco' || !mobileCheck.topFits || !mobileCheck.cardVisible || !mobileCheck.gmapsVisible) {
    throw new Error(`Mobile UX check failed: ${JSON.stringify(mobileCheck)}`);
  }
  await mPage.screenshot({ path: path.join(artifactsDir, 'preview-v25-mobile-sheet.png') });

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        chunkCount: assetFiles.filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).length,
        desktopInit,
        helpOpened,
        ecoState,
        dioramaLoaded,
        mobileCheck,
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
