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
  console.error('dist/ not found. Run `npm run build` before `npm run verify`.');
  process.exit(1);
}

fs.mkdirSync(artifactsDir, { recursive: true });

function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    'playwright',
    path.join(os.homedir(), '.npm/_npx/31e32ef8478fbf80/node_modules/playwright'),
  ].filter(Boolean);

  for (const modPath of candidates) {
    try {
      return require(modPath);
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    'Unable to resolve Playwright. Set PLAYWRIGHT_PATH or ensure cached ~/.npm/_npx/.../playwright is available.'
  );
}

function resolveExecutablePath() {
  const candidates = [
    process.env.CHROMIUM_EXECUTABLE_PATH,
    path.join(
      os.homedir(),
      'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'
    ),
    path.join(
      os.homedir(),
      'Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    ),
  ].filter(Boolean);

  for (const exe of candidates) {
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
    } catch {
      // server not yet listening
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Preview server did not respond at ${url} within ${timeoutMs}ms`);
}

async function waitForSettled(page) {
  await page.waitForFunction(
    () => Boolean(window.__PALEMBANG_3D__?.ready && !window.__PALEMBANG_3D__?.tweening),
    null,
    { timeout: 10000 }
  );
  // Let SwiftShader render extra frames and finish HUD CSS transitions after tween
  await page.waitForTimeout(550);
}

async function sampleCanvasNonUniformity(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { ok: false, reason: 'Canvas element missing' };
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return { ok: false, reason: 'Canvas has zero dimensions' };

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { ok: false, reason: 'WebGL context missing on canvas' };

    // Read a 16x16 grid across the middle 80% of the canvas
    const samples = 16;
    const pixel = new Uint8Array(4);
    const colors = [];
    for (let gy = 0; gy < samples; gy++) {
      for (let gx = 0; gx < samples; gx++) {
        const px = Math.floor(w * (0.1 + 0.8 * (gx / (samples - 1))));
        const py = Math.floor(h * (0.1 + 0.8 * (gy / (samples - 1))));
        gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        colors.push([pixel[0], pixel[1], pixel[2]]);
      }
    }

    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    const unique = new Set();
    for (const [r, g, b] of colors) {
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
      gMin = Math.min(gMin, g); gMax = Math.max(gMax, g);
      bMin = Math.min(bMin, b); bMax = Math.max(bMax, b);
      unique.add(`${r >> 3},${g >> 3},${b >> 3}`);
    }

    const spread = (rMax - rMin) + (gMax - gMin) + (bMax - bMin);
    return {
      ok: spread > 45 && unique.size >= 10,
      width: w,
      height: h,
      spread,
      uniqueBuckets: unique.size,
    };
  });
}

const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/`;

const previewProc = spawn(
  process.execPath,
  [path.join(projectRoot, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
);

let browser;
try {
  await waitForServer(BASE_URL);

  const { chromium } = resolvePlaywright();
  const executablePath = resolveExecutablePath();

  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await waitForSettled(page);

  const initialTelemetry = await page.evaluate(() => window.__PALEMBANG_3D__);
  if (!initialTelemetry?.ready) {
    throw new Error('Scene telemetry did not report ready === true');
  }

  const uniformity = await sampleCanvasNonUniformity(page);
  if (!uniformity.ok) {
    throw new Error(`Canvas pixel check failed (blank or uniform): ${JSON.stringify(uniformity)}`);
  }

  // Capture Overview (Siang)
  await page.screenshot({ path: path.join(artifactsDir, 'preview-overview.png') });

  // Capture all landmark presets
  const presetCaptures = [
    ['ampera', 'preview-ampera.png'],
    ['masjid-lrt', 'preview-masjid-lrt.png'],
    ['pasar-16', 'preview-pasar16.png'],
    ['kuto-besak', 'preview-bkb.png'],
    ['walikota-kambang', 'preview-walikota-ki.png'],
    ['kampung-kapitan', 'preview-kapitan.png'],
    ['jakabaring', 'preview-jakabaring.png'],
    ['musi-iv', 'preview-musi-iv.png'],
    ['pulau-kemaro', 'preview-kemaro.png'],
  ];
  for (const [presetId, fileName] of presetCaptures) {
    await page.click(`[data-preset-btn="${presetId}"]`);
    await waitForSettled(page);
    await page.screenshot({ path: path.join(artifactsDir, fileName) });
  }

  // Capture Senja Musi on Ampera
  await page.click('[data-preset-btn="ampera"]');
  await page.click('[data-lighting-btn="senja"]');
  await waitForSettled(page);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-sunset.png') });

  // Capture Malam on Jakabaring (testing floodlights & city lights)
  await page.click('[data-preset-btn="jakabaring"]');
  await page.click('[data-lighting-btn="malam"]');
  await waitForSettled(page);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-jakabaring-night.png') });

  // Capture Malam on Overview
  await page.click('[data-preset-btn="overview"]');
  await waitForSettled(page);
  await page.screenshot({ path: path.join(artifactsDir, 'preview-night.png') });

  const finalTelemetry = await page.evaluate(() => window.__PALEMBANG_3D__);
  const domState = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      preset: app?.dataset.preset,
      lighting: app?.dataset.lighting,
      labels: app?.dataset.labels,
    };
  });

  // Mobile 390x844 HUD fit verification
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const mobileBounds = await page.evaluate(() => {
    const brand = document.querySelector('.brand-pill')?.getBoundingClientRect();
    const topCtrl = document.querySelector('.top-controls')?.getBoundingClientRect();
    const labelBtn = document.querySelector('[data-labels-btn]')?.getBoundingClientRect();
    const dock = document.querySelector('.preset-dock')?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      brandRight: brand ? Math.round(brand.right) : null,
      brandHeight: brand ? Math.round(brand.height) : null,
      topCtrlRight: topCtrl ? Math.round(topCtrl.right) : null,
      labelBtnRight: labelBtn ? Math.round(labelBtn.right) : null,
      dockRight: dock ? Math.round(dock.right) : null,
      fits:
        Boolean(brand && topCtrl && labelBtn && dock) &&
        brand.right <= window.innerWidth &&
        topCtrl.right <= window.innerWidth &&
        labelBtn.right <= window.innerWidth &&
        dock.right <= window.innerWidth,
    };
  });
  if (!mobileBounds.fits) {
    throw new Error(`Mobile HUD overflow detected: ${JSON.stringify(mobileBounds)}`);
  }

  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(
      `Browser runtime errors detected: consoleErrors=${JSON.stringify(consoleErrors)}, pageErrors=${JSON.stringify(pageErrors)}`
    );
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        initialTelemetry,
        finalTelemetry,
        domState,
        uniformity,
        mobileBounds,
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        screenshots: [
          'artifacts/preview-overview.png',
          'artifacts/preview-ampera.png',
          'artifacts/preview-masjid-lrt.png',
          'artifacts/preview-pasar16.png',
          'artifacts/preview-bkb.png',
          'artifacts/preview-walikota-ki.png',
          'artifacts/preview-kapitan.png',
          'artifacts/preview-jakabaring.png',
          'artifacts/preview-musi-iv.png',
          'artifacts/preview-kemaro.png',
          'artifacts/preview-sunset.png',
          'artifacts/preview-jakabaring-night.png',
          'artifacts/preview-night.png',
        ],
      },
      null,
      2
    )
  );
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }
  if (!previewProc.killed) {
    previewProc.kill('SIGTERM');
  }
}
