import * as THREE from 'three';

function seededRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { canvas: c, ctx: c.getContext('2d') };
}

function configureTex(canvas, { repeatX = 1, repeatY = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// 1. Asphalt grain + tire-wear texture (albedo + bump)
function buildAsphaltTextures() {
  const size = 256;
  const rand = seededRand(101);
  const { canvas: colC, ctx: colCtx } = makeCanvas(size, size);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);

  colCtx.fillStyle = '#333840';
  colCtx.fillRect(0, 0, size, size);
  bmpCtx.fillStyle = '#808080';
  bmpCtx.fillRect(0, 0, size, size);

  // Fine mineral aggregate speckle
  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = Math.floor(38 + rand() * 34);
    colCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    colCtx.fillRect(x, y, 2, 2);

    const bv = Math.floor(90 + rand() * 90);
    bmpCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bmpCtx.fillRect(x, y, 2, 2);
  }

  // Subtle longitudinal tire wear & weathered streaks
  colCtx.fillStyle = 'rgba(20, 23, 28, 0.22)';
  colCtx.fillRect(size * 0.18, 0, size * 0.14, size);
  colCtx.fillRect(size * 0.68, 0, size * 0.14, size);

  return {
    map: configureTex(colC, { repeatX: 4, repeatY: 16, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 4, repeatY: 16, srgb: false }),
  };
}

// 2. Urban stone paving / plaza tile texture
function buildPlazaTextures() {
  const size = 256;
  const rand = seededRand(202);
  const { canvas: colC, ctx: colCtx } = makeCanvas(size, size);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);

  colCtx.fillStyle = '#b4aea2';
  colCtx.fillRect(0, 0, size, size);
  bmpCtx.fillStyle = '#909090';
  bmpCtx.fillRect(0, 0, size, size);

  const step = 32;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const shade = Math.floor(-10 + rand() * 20);
      const r = 178 + shade;
      const g = 173 + shade;
      const b = 161 + shade;
      colCtx.fillStyle = `rgb(${r},${g},${b})`;
      colCtx.fillRect(x + 1, y + 1, step - 2, step - 2);

      // Subtle stone grain inside each tile
      for (let k = 0; k < 12; k++) {
        const gx = x + 2 + rand() * (step - 4);
        const gy = y + 2 + rand() * (step - 4);
        colCtx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(40,36,30,0.08)';
        colCtx.fillRect(gx, gy, 2, 2);
      }

      // Grout lines in bump map
      bmpCtx.strokeStyle = '#383838';
      bmpCtx.lineWidth = 2;
      bmpCtx.strokeRect(x + 0.5, y + 0.5, step - 1, step - 1);
    }
  }

  return {
    map: configureTex(colC, { repeatX: 8, repeatY: 8, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 8, repeatY: 8, srgb: false }),
  };
}

// 3. Organic tropical grass / ground terrain texture
function buildGrassTextures() {
  const size = 256;
  const rand = seededRand(303);
  const { canvas: colC, ctx: colCtx } = makeCanvas(size, size);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);

  colCtx.fillStyle = '#4e6c3f';
  colCtx.fillRect(0, 0, size, size);
  bmpCtx.fillStyle = '#808080';
  bmpCtx.fillRect(0, 0, size, size);

  // Soft mottled turf patches
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 6 + rand() * 22;
    const tones = ['rgba(63,97,49,0.22)', 'rgba(94,122,68,0.2)', 'rgba(54,82,42,0.2)', 'rgba(104,116,74,0.14)'];
    colCtx.fillStyle = tones[Math.floor(rand() * tones.length)];
    colCtx.beginPath();
    colCtx.arc(x, y, rad, 0, Math.PI * 2);
    colCtx.fill();
  }

  // Fine blade speckle
  for (let i = 0; i < 4200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const v = Math.floor(68 + rand() * 38);
    colCtx.fillStyle = `rgba(${v},${v + 28},${Math.floor(v * 0.72)},0.45)`;
    colCtx.fillRect(x, y, 2, 2);

    const bv = Math.floor(95 + rand() * 75);
    bmpCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bmpCtx.fillRect(x, y, 2, 2);
  }

  return {
    map: configureTex(colC, { repeatX: 16, repeatY: 16, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 16, repeatY: 16, srgb: false }),
  };
}

// 4. Indonesian terracotta clay roof tiles (albedo + bump)
function buildRoofTileTextures() {
  const size = 256;
  const rand = seededRand(404);
  const { canvas: colC, ctx: colCtx } = makeCanvas(size, size);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);

  colCtx.fillStyle = '#a44b33';
  colCtx.fillRect(0, 0, size, size);
  bmpCtx.fillStyle = '#808080';
  bmpCtx.fillRect(0, 0, size, size);

  const rowH = 16;
  const colW = 16;
  for (let y = 0; y < size; y += rowH) {
    for (let x = 0; x < size; x += colW) {
      const d = Math.floor(-12 + rand() * 24);
      colCtx.fillStyle = `rgb(${164 + d},${75 + Math.floor(d * 0.6)},${51 + Math.floor(d * 0.4)})`;
      colCtx.fillRect(x, y, colW - 1, rowH - 2);

      // Horizontal overlap shadow line
      colCtx.fillStyle = 'rgba(42, 16, 10, 0.34)';
      colCtx.fillRect(x, y + rowH - 3, colW, 3);

      // Curved ridge highlight in bump map
      const grad = bmpCtx.createLinearGradient(x, y, x + colW, y);
      grad.addColorStop(0, '#444444');
      grad.addColorStop(0.5, '#d8d8d8');
      grad.addColorStop(1, '#444444');
      bmpCtx.fillStyle = grad;
      bmpCtx.fillRect(x, y, colW, rowH - 2);
      bmpCtx.fillStyle = '#252525';
      bmpCtx.fillRect(x, y + rowH - 2, colW, 2);
    }
  }

  return {
    map: configureTex(colC, { repeatX: 3, repeatY: 3, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 3, repeatY: 3, srgb: false }),
  };
}

// 5. Weathered colonial plaster & masonry (BKB, Walikota, Masjid, Museum)
function buildPlasterTextures() {
  const size = 256;
  const rand = seededRand(505);
  const { canvas: colC, ctx: colCtx } = makeCanvas(size, size);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);

  colCtx.fillStyle = '#e7e0d0';
  colCtx.fillRect(0, 0, size, size);
  bmpCtx.fillStyle = '#888888';
  bmpCtx.fillRect(0, 0, size, size);

  // Subtle horizontal stone courses
  for (let y = 0; y < size; y += 32) {
    colCtx.fillStyle = 'rgba(90, 82, 68, 0.1)';
    colCtx.fillRect(0, y, size, 2);
    bmpCtx.fillStyle = '#555555';
    bmpCtx.fillRect(0, y, size, 2);
  }

  // Organic tropical weathering & plaster patina
  for (let i = 0; i < 600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const rad = 4 + rand() * 16;
    colCtx.fillStyle = rand() > 0.45 ? 'rgba(130,118,98,0.06)' : 'rgba(255,252,244,0.07)';
    colCtx.beginPath();
    colCtx.arc(x, y, rad, 0, Math.PI * 2);
    colCtx.fill();
  }

  for (let i = 0; i < 2400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const bv = Math.floor(110 + rand() * 55);
    bmpCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bmpCtx.fillRect(x, y, 2, 2);
  }

  return {
    map: configureTex(colC, { repeatX: 3, repeatY: 2, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 3, repeatY: 2, srgb: false }),
  };
}

// 6. Multi-story Palembang Shophouse (Ruko) facade with realistic lit/unlit window grid
function buildRukoFacadeTextures() {
  const w = 256;
  const h = 256;
  const rand = seededRand(606);
  const { canvas: colC, ctx: colCtx } = makeCanvas(w, h);
  const { canvas: emiC, ctx: emiCtx } = makeCanvas(w, h);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(w, h);

  // Neutral bright base so Three.js per-instance colors tint naturally
  colCtx.fillStyle = '#efece6';
  colCtx.fillRect(0, 0, w, h);
  emiCtx.fillStyle = '#000000';
  emiCtx.fillRect(0, 0, w, h);
  bmpCtx.fillStyle = '#a0a0a0';
  bmpCtx.fillRect(0, 0, w, h);

  // Subtle concrete floor ledges
  const floors = 4;
  const cols = 4;
  const floorH = h / floors;
  const colW = w / cols;

  for (let f = 0; f < floors; f++) {
    const fy = f * floorH;
    // Floor cornice / balcony slab
    colCtx.fillStyle = '#d3cec4';
    colCtx.fillRect(0, fy, w, 6);
    bmpCtx.fillStyle = '#d8d8d8';
    bmpCtx.fillRect(0, fy, w, 6);

    const isGroundFloor = f === floors - 1;
    for (let c = 0; c < cols; c++) {
      const cx = c * colW;
      const padX = isGroundFloor ? 7 : 10;
      const winW = colW - padX * 2;
      const winH = isGroundFloor ? floorH - 18 : floorH - 24;
      const winY = fy + (isGroundFloor ? 12 : 13);

      // Recessed window frame
      colCtx.fillStyle = '#5c6670';
      colCtx.fillRect(cx + padX - 2, winY - 2, winW + 4, winH + 4);
      bmpCtx.fillStyle = '#404040';
      bmpCtx.fillRect(cx + padX, winY, winW, winH);

      // Daytime reflective tinted glass
      const litRoll = rand();
      const isLit = litRoll > (isGroundFloor ? 0.35 : 0.42);
      const glassGrad = colCtx.createLinearGradient(cx + padX, winY, cx + padX, winY + winH);
      glassGrad.addColorStop(0, '#3a4f63');
      glassGrad.addColorStop(0.55, '#2a3947');
      glassGrad.addColorStop(1, '#4f6272');
      colCtx.fillStyle = glassGrad;
      colCtx.fillRect(cx + padX, winY, winW, winH);

      // Window mullions
      colCtx.fillStyle = 'rgba(210, 215, 220, 0.35)';
      colCtx.fillRect(cx + padX + winW * 0.5 - 1, winY, 2, winH);
      colCtx.fillRect(cx + padX, winY + winH * 0.5 - 1, winW, 2);

      // Realistic randomized warm/cool interior glow for Senja & Malam
      if (isLit) {
        const warmTones = ['#ffd27d', '#ffbe55', '#ffe7a8', '#fff0c8', '#ffc973'];
        emiCtx.fillStyle = warmTones[Math.floor(rand() * warmTones.length)];
        emiCtx.fillRect(cx + padX + 2, winY + 2, winW - 4, winH - 4);
        // Keep mullion bars dark in emissive map for crisp architectural feel!
        emiCtx.fillStyle = '#221810';
        emiCtx.fillRect(cx + padX + winW * 0.5 - 1, winY, 2, winH);
        emiCtx.fillRect(cx + padX, winY + winH * 0.5 - 1, winW, 2);
      }
    }
  }

  return {
    map: configureTex(colC, { repeatX: 1, repeatY: 1, srgb: true }),
    emissiveMap: configureTex(emiC, { repeatX: 1, repeatY: 1, srgb: true }),
    bumpMap: configureTex(bmpC, { repeatX: 1, repeatY: 1, srgb: false }),
  };
}

// 7. Brushed / riveted structural steel bump map (Ampera & Musi IV)
function buildSteelBump() {
  const size = 128;
  const rand = seededRand(707);
  const { canvas: bmpC, ctx: bmpCtx } = makeCanvas(size, size);
  bmpCtx.fillStyle = '#808080';
  bmpCtx.fillRect(0, 0, size, size);

  // Subtle brushed metal lines + plate seams
  for (let i = 0; i < 600; i++) {
    const y = rand() * size;
    const v = Math.floor(110 + rand() * 36);
    bmpCtx.fillStyle = `rgb(${v},${v},${v})`;
    bmpCtx.fillRect(0, y, size, 1);
  }
  bmpCtx.strokeStyle = '#505050';
  bmpCtx.lineWidth = 2;
  bmpCtx.strokeRect(1, 1, size - 2, size / 2 - 2);
  bmpCtx.strokeRect(1, size / 2 + 1, size - 2, size / 2 - 2);

  return configureTex(bmpC, { repeatX: 2, repeatY: 2, srgb: false });
}

// 8. Stadium mowed pitch stripe texture
function buildPitchTexture() {
  const w = 256;
  const h = 128;
  const { canvas, ctx } = makeCanvas(w, h);
  const bands = 12;
  const bw = w / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#2b823c' : '#359446';
    ctx.fillRect(i * bw, 0, bw + 1, h);
  }
  // Crisp white pitch outline & penalty boxes
  ctx.strokeStyle = 'rgba(245, 245, 238, 0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeRect(8, h * 0.25, 32, h * 0.5);
  ctx.strokeRect(w - 40, h * 0.25, 32, h * 0.5);

  return configureTex(canvas, { repeatX: 1, repeatY: 1, srgb: true });
}

let cachedTextures = null;

export function getPBRTextures() {
  if (cachedTextures) return cachedTextures;
  cachedTextures = {
    asphalt: buildAsphaltTextures(),
    plaza: buildPlazaTextures(),
    grass: buildGrassTextures(),
    roofTile: buildRoofTileTextures(),
    plaster: buildPlasterTextures(),
    rukoFacade: buildRukoFacadeTextures(),
    steelBump: buildSteelBump(),
    pitchMap: buildPitchTexture(),
  };
  return cachedTextures;
}
