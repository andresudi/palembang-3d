// v3.5 — 6 True-Scale Iconic Palembang 3D Models + Bespoke Living Animations
// 1. Jembatan Musi VI (Steel Tied-Arch + RGB LED Night Lightshow)
// 2. Tugu Ikan Belido Plaza BKB (12m Silver Fish Monument + Parabolic Water Fountain into Musi)
// 3. Masjid Muhammad Cheng Ho Jakabaring (Sino-Islamic Pagoda Mosque + Swaying Lanterns & Fountain)
// 4. Danau Dayung Jakabaring JSC (Asian Games Rowing Course + 4 Racing Rowing Sculls)
// 5. Taman Kambang Iwak Besak (Dancing Lake Fountain + Lakeside Joggers)
// 6. Bukit Siguntang (Srivijaya Hilltop Pendopo + Floating Golden Fireflies)
import * as THREE from 'three';

function addBeam(parent, p1, p2, thickness, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.01) return null;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(mesh);
  return mesh;
}

function addRamp(g, zStart, zEnd, roadY, deckW, roadW, mats) {
  const dz = zEnd - zStart;
  const dy = 0.15 - roadY;
  const len = Math.hypot(dz, dy);
  const phi = -Math.atan(dy / dz);
  const midY = (roadY + 0.15) / 2;
  const midZ = (zStart + zEnd) / 2;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, 1.8, len), mats.concrete);
  deck.position.set(0, midY - 1.0, midZ);
  deck.rotation.x = phi;
  g.add(deck);

  const road = new THREE.Mesh(new THREE.BoxGeometry(roadW, 0.35, len), mats.asphalt);
  road.position.set(0, midY, midZ);
  road.rotation.x = phi;
  g.add(road);

  for (const t of [0.16, 0.45, 0.72]) {
    const z = zStart + dz * t;
    const h = roadY + dy * t - 2.2;
    if (h < 2.2) continue;
    for (const sx of [-deckW * 0.28, deckW * 0.28]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, h, 8), mats.concrete);
      col.position.set(sx, h / 2, z);
      g.add(col);
    }
  }
}

// ============================================================================
// 1. JEMBATAN MUSI VI — Steel Tied-Arch + Flowing RGB LED Lightshow
// ============================================================================
export function buildRealMusiVIModel(mats) {
  const g = new THREE.Group();
  const deckY = 15.0;
  const spanLen = 400; // Central + side spans (total with ramps = 680m, matching OSM 666m)

  const deck = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2.0, spanLen), mats.whiteConcrete);
  deck.position.set(0, deckY - 1.0, 0);
  g.add(deck);

  const road = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.35, spanLen), mats.asphalt);
  road.position.set(0, deckY + 0.12, 0);
  g.add(road);

  // River piers flanking the 210m main steel arch span
  for (const pz of [-175, -105, 105, 175]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(19, 17, 7.5), mats.concrete);
    pier.position.set(0, 6.5, pz);
    g.add(pier);
  }

  // Twin parabolic steel arches spanning z = -105..+105, peaking at y = 48m
  const archHalf = 105;
  const archRise = 33;
  const segs = 24;
  const rgbMats = [];
  const deckLedMats = [];

  for (let i = 0; i < segs; i++) {
    rgbMats.push(new THREE.MeshBasicMaterial({ color: '#6cf0ff' }));
  }
  for (let i = 0; i < 12; i++) {
    deckLedMats.push(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  }

  const archY = (z) => {
    const u = z / archHalf;
    return deckY + Math.max(0, 1 - u * u) * archRise;
  };

  for (let i = 0; i < segs; i++) {
    const z0 = -archHalf + (i / segs) * (archHalf * 2);
    const z1 = -archHalf + ((i + 1) / segs) * (archHalf * 2);
    const y0 = archY(z0);
    const y1 = archY(z1);

    for (const sx of [-7.6, 7.6]) {
      // Main white structural arch rib
      addBeam(g, new THREE.Vector3(sx, y0, z0), new THREE.Vector3(sx, y1, z1), 1.65, mats.whiteConcrete);
      // Vivid glowing outer & upper RGB LED tube tracing the arch
      addBeam(
        g,
        new THREE.Vector3(sx + Math.sign(sx) * 1.15, y0 + 0.55, z0),
        new THREE.Vector3(sx + Math.sign(sx) * 1.15, y1 + 0.55, z1),
        1.15,
        rgbMats[i]
      );
    }

    // Overhead K-bracing struts across the upper half of the arch
    if (i >= 4 && i <= segs - 4 && i % 2 === 0) {
      addBeam(g, new THREE.Vector3(-7.6, y0, z0), new THREE.Vector3(7.6, y0, z0), 0.9, mats.whiteConcrete);
      if (i < segs - 4) {
        const zNext = -archHalf + ((i + 2) / segs) * (archHalf * 2);
        const yNext = archY(zNext);
        addBeam(g, new THREE.Vector3(-7.6, y0, z0), new THREE.Vector3(7.6, yNext, zNext), 0.5, mats.cable);
        addBeam(g, new THREE.Vector3(7.6, y0, z0), new THREE.Vector3(-7.6, yNext, zNext), 0.5, mats.cable);
      }
    }

    // Vertical suspender hanger cables from arch down to deck
    if (i >= 2 && i <= segs - 2) {
      const zMid = (z0 + z1) * 0.5;
      const yMid = archY(zMid);
      if (yMid > deckY + 3.5) {
        for (const sx of [-7.6, 7.6]) {
          addBeam(g, new THREE.Vector3(sx, yMid - 0.5, zMid), new THREE.Vector3(sx, deckY + 0.3, zMid), 0.24, mats.cable);
        }
      }
    }
  }

  // Deck-edge RGB accent strips spanning full bridge
  const stripLen = spanLen / deckLedMats.length;
  for (let i = 0; i < deckLedMats.length; i++) {
    const cz = -spanLen / 2 + (i + 0.5) * stripLen;
    for (const sx of [-8.6, 8.6]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, stripLen - 0.6), deckLedMats[i]);
      bar.position.set(sx, deckY - 0.55, cz);
      g.add(bar);
    }
  }

  addRamp(g, spanLen / 2, spanLen / 2 + 140, deckY + 0.12, 15.8, 12.6, mats);
  addRamp(g, -spanLen / 2, -spanLen / 2 - 140, deckY + 0.12, 15.8, 12.6, mats);

  const tmpColor = new THREE.Color();
  function update(elapsedSec, { lightingMode }) {
    const isNight = lightingMode === 'malam';
    const isSunset = lightingMode === 'senja';
    const sat = isNight ? 1.0 : isSunset ? 0.92 : 0.55;
    const light = isNight ? 0.64 : isSunset ? 0.6 : 0.72;
    for (let i = 0; i < rgbMats.length; i++) {
      // Smooth vibrant rainbow + Songket gold wave flowing along the arch
      const hue = ((elapsedSec * 0.14 + i / rgbMats.length) % 1 + 1) % 1;
      tmpColor.setHSL(hue, sat, light);
      rgbMats[i].color.copy(tmpColor);
    }
    for (let i = 0; i < deckLedMats.length; i++) {
      const hue = ((elapsedSec * 0.14 + 0.35 + i / deckLedMats.length) % 1 + 1) % 1;
      tmpColor.setHSL(hue, sat, light);
      deckLedMats[i].color.copy(tmpColor);
    }
  }

  return { model: g, update };
}

// ============================================================================
// 2. TUGU IKAN BELIDO (PLAZA BKB) — 12m Silver Fish + Parabolic Water Jet into Musi
// ============================================================================
export function buildRealTuguBelidoModel(mats) {
  const g = new THREE.Group();

  const silverMat = new THREE.MeshStandardMaterial({
    color: '#e5ecf2',
    metalness: 0.82,
    roughness: 0.22,
  });
  const poolMat = new THREE.MeshStandardMaterial({
    color: '#1b89a8',
    roughness: 0.2,
    metalness: 0.15,
    emissive: '#0e4a60',
    emissiveIntensity: 0.35,
  });
  const jetMat = new THREE.MeshStandardMaterial({
    color: '#e2f7ff',
    emissive: '#6ad8ff',
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.86,
  });
  const splashMat = new THREE.MeshBasicMaterial({
    color: '#e6f9ff',
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });

  // Stepped circular Songket riverside plaza & water basin
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 10.2, 1.4, 12), mats.concrete);
  base1.position.y = 0.7;
  g.add(base1);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 1.3, 16), mats.whiteConcrete);
  basin.position.y = 1.9;
  g.add(basin);

  const waterPool = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.25, 16), poolMat);
  waterPool.position.y = 2.52;
  g.add(waterPool);

  const goldRing = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 0.35, 16), mats.gold);
  goldRing.position.y = 2.55;
  g.add(goldRing);

  // Central sculpted stone pedestal rising out of basin
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, 3.6, 10), mats.creamWall);
  ped.position.y = 4.2;
  g.add(ped);

  // Sculpted 12m leaping Silver Belido Fish curving gracefully forward (+Z = toward Musi River)
  const fishGroup = new THREE.Group();
  fishGroup.position.set(0, 5.8, 0);

  // Multi-segment tapered curving silver body (characteristic humped knife-fish silhouette)
  const segSpecs = [
    { z: -4.2, y: 2.2, rx: 0.55, ry: 1.5, rz: 1.6, rotX: -0.55 }, // tail stem
    { z: -2.4, y: 4.1, rx: 1.15, ry: 2.5, rz: 2.4, rotX: -0.35 },
    { z: -0.2, y: 5.5, rx: 1.55, ry: 3.1, rz: 2.8, rotX: -0.05 }, // humped mid-body
    { z: 2.0, y: 6.2, rx: 1.45, ry: 2.6, rz: 2.5, rotX: 0.18 },
    { z: 4.0, y: 6.6, rx: 1.15, ry: 1.95, rz: 2.1, rotX: 0.25 },  // head
    { z: 5.4, y: 6.7, rx: 0.78, ry: 1.15, rz: 1.3, rotX: 0.15 },  // snout/mouth
  ];
  for (const s of segSpecs) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), silverMat);
    seg.scale.set(s.rx, s.ry, s.rz);
    seg.position.set(0, s.y, s.z);
    seg.rotation.x = s.rotX;
    fishGroup.add(seg);
  }

  // Sweeping forked silver tail fin & dorsal crest
  const tailUpper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 2.2), silverMat);
  tailUpper.position.set(0, 1.3, -5.6);
  tailUpper.rotation.x = -0.68;
  fishGroup.add(tailUpper);

  const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 4), silverMat);
  dorsalFin.scale.set(0.35, 1, 1.4);
  dorsalFin.position.set(0, 8.3, 0.2);
  dorsalFin.rotation.x = -0.3;
  fishGroup.add(dorsalFin);

  // Golden eyes on both sides of head
  for (const sx of [-0.95, 0.95]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), mats.gold);
    eye.position.set(sx, 6.95, 4.3);
    fishGroup.add(eye);
  }
  g.add(fishGroup);

  // Animated 3D parabolic water fountain arc spraying from mouth (0, 12.4, 6.2) into Sungai Musi (z ≈ 25)
  const DROP_COUNT = 34;
  const dropGeo = new THREE.SphereGeometry(0.48, 7, 7);
  const dropInst = new THREE.InstancedMesh(dropGeo, jetMat, DROP_COUNT);
  dropInst.frustumCulled = false;
  g.add(dropInst);

  // Expanding splash ring on the river surface where the water jet lands
  const splashRing = new THREE.Mesh(new THREE.RingGeometry(1.1, 3.2, 20), splashMat);
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.position.set(0, 0.35, 25.5);
  g.add(splashRing);

  const dummy = new THREE.Object3D();
  function update(elapsedSec, { lightingMode, quality }) {
    const isNight = lightingMode === 'malam';
    const isSunset = lightingMode === 'senja';
    jetMat.emissive.set(isNight ? '#ffd27a' : isSunset ? '#ffad5a' : '#6ad8ff');
    jetMat.emissiveIntensity = isNight ? 2.6 : isSunset ? 1.4 : 0.45;
    poolMat.emissiveIntensity = isNight ? 1.8 : 0.35;

    const count = quality === 'eco' ? 18 : DROP_COUNT;
    dropInst.count = count;

    for (let i = 0; i < count; i++) {
      const phase = ((elapsedSec * 0.72 + i / count) % 1 + 1) % 1;
      const z = 6.1 + phase * 19.6;
      // Parabolic ballistic trajectory from y=12.3 peaking at y=14.6 down to river y=0.3
      const y = 12.3 + phase * 8.4 - phase * phase * 20.4;
      const spreadX = Math.sin(i * 2.7 + elapsedSec * 2.5) * phase * 0.85;
      const sc = 0.62 + phase * 1.15;
      dummy.position.set(spreadX, Math.max(0.25, y), z);
      dummy.scale.set(sc * 0.85, sc * 0.85, sc * 1.45);
      dummy.updateMatrix();
      dropInst.setMatrixAt(i, dummy.matrix);
    }
    dropInst.instanceMatrix.needsUpdate = true;

    const ringPulse = (elapsedSec * 1.1) % 1;
    const rs = 0.7 + ringPulse * 1.5;
    splashRing.scale.set(rs, rs, 1);
    splashMat.opacity = (1 - ringPulse) * (isNight ? 0.8 : 0.55);
  }

  return { model: g, update };
}

// ============================================================================
// 3. MASJID MUHAMMAD CHENG HO JAKABARING — Pagoda Mosque + Swaying Lanterns & Fountain
// ============================================================================
export function buildRealChengHoModel(mats) {
  const g = new THREE.Group();

  const jadeGreen = new THREE.MeshStandardMaterial({ color: '#147a52', roughness: 0.4, metalness: 0.18 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#ff3b28',
    emissive: '#ff521c',
    emissiveIntensity: 0.75,
    roughness: 0.35,
  });
  const fountainMat = new THREE.MeshStandardMaterial({
    color: '#d8f4ff',
    emissive: '#5ac8ff',
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.84,
  });

  // Elevated courtyard plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(44, 1.8, 42), mats.concrete);
  plinth.position.y = 0.9;
  g.add(plinth);

  // Main Sino-Islamic crimson-cream prayer hall (2 floors)
  const hall1 = new THREE.Mesh(new THREE.BoxGeometry(28, 7.2, 26), mats.creamWall);
  hall1.position.set(0, 5.4, -2);
  g.add(hall1);

  // Red perimeter pillars
  for (const px of [-14.2, -7.1, 0, 7.1, 14.2]) {
    for (const pz of [-15.2, 11.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 7.4, 8), mats.crimson);
      col.position.set(px, 5.5, pz);
      g.add(col);
    }
  }

  // Warm illuminated window band
  const winBand = new THREE.Mesh(new THREE.BoxGeometry(28.5, 2.4, 26.5), mats.warmGlow);
  winBand.position.set(0, 5.6, -2);
  g.add(winBand);

  // Iconic 3-tier pagoda roof (emerald jade green + crimson eaves + gold trim)
  const tiers = [
    { r: 23.5, h: 4.8, y: 11.4, mat: jadeGreen },
    { r: 16.5, h: 4.5, y: 16.0, mat: mats.crimson },
    { r: 10.2, h: 4.4, y: 20.2, mat: jadeGreen },
  ];
  for (const t of tiers) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 8), t.mat);
    roof.position.set(0, t.y, -2);
    g.add(roof);
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 0.96, t.r * 0.99, 0.42, 8), mats.gold);
    trim.position.set(0, t.y - t.h * 0.48, -2);
    g.add(trim);
  }

  // Golden crescent & mustaka spire
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 5.2, 8), mats.gold);
  spire.position.set(0, 24.8, -2);
  g.add(spire);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), mats.gold);
  orb.position.set(0, 27.6, -2);
  g.add(orb);

  // Twin flanking 5-story octagonal pagoda minarets (Haji Muhammad & Siti Khadijah towers)
  for (const sx of [-18.5, 18.5]) {
    const mx = sx;
    const mz = 9.5;
    let cy = 1.8;
    for (let i = 0; i < 5; i++) {
      const r = 3.8 - i * 0.45;
      const sh = 3.6 - i * 0.25;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, sh, 8), i % 2 === 0 ? mats.crimson : mats.creamWall);
      body.position.set(mx, cy + sh / 2, mz);
      g.add(body);
      const eave = new THREE.Mesh(new THREE.ConeGeometry(r * 1.48, 1.4, 8), i === 4 ? mats.gold : jadeGreen);
      eave.position.set(mx, cy + sh + 0.5, mz);
      g.add(eave);
      cy += sh + 0.45;
    }
    const mSpire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.6, 8), mats.gold);
    mSpire.position.set(mx, cy + 1.8, mz);
    g.add(mSpire);
  }

  // Ceremonial Chinese-Islamic Paifang entrance arch at front (+Z)
  for (const ax of [-6.5, 6.5]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 8.5, 8), mats.crimson);
    p.position.set(ax, 6.0, 18.5);
    g.add(p);
  }
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 2.2), mats.crimson);
  archBeam.position.set(0, 9.8, 18.5);
  g.add(archBeam);
  const archRoof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 2.8, 4), jadeGreen);
  archRoof.rotation.y = Math.PI / 4;
  archRoof.scale.set(1.25, 1, 0.35);
  archRoof.position.set(0, 11.7, 18.5);
  g.add(archRoof);

  // 14 Swaying Red-Gold Lanterns suspended around eaves & archway
  const lanterns = [];
  const lanternCoords = [
    [-12, 8.8, 11.4], [-6, 8.8, 11.4], [0, 8.8, 11.4], [6, 8.8, 11.4], [12, 8.8, 11.4],
    [-12, 8.8, -15.4], [0, 8.8, -15.4], [12, 8.8, -15.4],
    [-14.5, 8.8, -2], [14.5, 8.8, -2],
    [-5.2, 9.2, 18.5], [-1.8, 9.2, 18.5], [1.8, 9.2, 18.5], [5.2, 9.2, 18.5],
  ];
  for (let i = 0; i < lanternCoords.length; i++) {
    const [lx, ly, lz] = lanternCoords[i];
    const pivot = new THREE.Group();
    pivot.position.set(lx, ly, lz);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 4), mats.gold);
    cord.position.y = -0.6;
    pivot.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.82, 8, 8), lanternMat);
    bulb.scale.set(1, 1.18, 1);
    bulb.position.y = -1.65;
    pivot.add(bulb);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 8), mats.gold);
    cap.position.y = -0.95;
    pivot.add(cap);
    g.add(pivot);
    lanterns.push({ pivot, phase: i * 0.7 });
  }

  // Courtyard water fountain basin & 16 bubbling droplets
  const fBasin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 0.85, 14), mats.whiteConcrete);
  fBasin.position.set(0, 2.2, 14.5);
  g.add(fBasin);
  const DROP_COUNT = 16;
  const fDropInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 6, 6), fountainMat, DROP_COUNT);
  fDropInst.frustumCulled = false;
  g.add(fDropInst);

  const dummy = new THREE.Object3D();
  function update(elapsedSec, { lightingMode, quality }) {
    const isNight = lightingMode === 'malam';
    const isSunset = lightingMode === 'senja';
    lanternMat.emissiveIntensity = isNight ? 3.5 : isSunset ? 2.0 : 0.55;
    fountainMat.emissiveIntensity = isNight ? 2.2 : isSunset ? 1.2 : 0.35;

    for (const l of lanterns) {
      l.pivot.rotation.z = Math.sin(elapsedSec * 1.9 + l.phase) * 0.16;
      l.pivot.rotation.x = Math.cos(elapsedSec * 1.4 + l.phase) * 0.09;
    }

    const cnt = quality === 'eco' ? 8 : DROP_COUNT;
    fDropInst.count = cnt;
    for (let i = 0; i < cnt; i++) {
      const p = ((elapsedSec * 1.15 + i / cnt) % 1 + 1) % 1;
      const ang = (i / cnt) * Math.PI * 2 + elapsedSec * 0.4;
      const r = p * 2.5;
      const y = 2.6 + p * 5.2 - p * p * 5.2;
      dummy.position.set(Math.cos(ang) * r, y, 14.5 + Math.sin(ang) * r);
      const sc = 0.65 + (1 - p) * 0.6;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      fDropInst.setMatrixAt(i, dummy.matrix);
    }
    fDropInst.instanceMatrix.needsUpdate = true;
  }

  return { model: g, update };
}

// ============================================================================
// 4. DANAU DAYUNG JAKABARING (JSC) — Asian Games Rowing Course + 4 Racing Sculls
// ============================================================================
export function buildRealDanauDayungModel(mats) {
  const g = new THREE.Group();

  // Lakeside Finish Tower & Spectator Grandstand on West Bank (local x = -92)
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 72), mats.whiteConcrete);
  standBase.position.set(-96, 4.5, 0);
  g.add(standBase);
  const standRoof = new THREE.Mesh(new THREE.BoxGeometry(24, 1.4, 78), mats.steelRed);
  standRoof.position.set(-94, 13.2, 0);
  standRoof.rotation.z = -0.14;
  g.add(standRoof);

  // Finish timing tower
  const fTower = new THREE.Mesh(new THREE.BoxGeometry(10, 22, 10), mats.whiteConcrete);
  fTower.position.set(-86, 11, 68);
  g.add(fTower);
  const fGlass = new THREE.Mesh(new THREE.BoxGeometry(10.6, 5, 10.6), mats.cyanGlow);
  fGlass.position.set(-86, 18.5, 68);
  g.add(fGlass);

  // Floating finish line pontoon marker
  const pontoon = new THREE.Mesh(new THREE.BoxGeometry(104, 0.7, 3.2), mats.gold);
  pontoon.position.set(-18, 0.45, 72);
  g.add(pontoon);

  // 5 parallel floating buoy lines (x = -58, -38, -18, +2, +22) along z = -220..+220
  const buoyGeo = new THREE.SphereGeometry(0.7, 6, 6);
  const buoyMat = new THREE.MeshStandardMaterial({
    color: '#ff6a38',
    emissive: '#ff4418',
    emissiveIntensity: 0.4,
  });
  const laneXs = [-58, -38, -18, 2, 22];
  const buoyCoords = [];
  for (const lx of laneXs) {
    for (let z = -210; z <= 210; z += 20) {
      buoyCoords.push([lx, 0.45, z]);
    }
  }
  const buoyInst = new THREE.InstancedMesh(buoyGeo, buoyMat, buoyCoords.length);
  const tmp = new THREE.Object3D();
  for (let i = 0; i < buoyCoords.length; i++) {
    tmp.position.set(buoyCoords[i][0], buoyCoords[i][1], buoyCoords[i][2]);
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    buoyInst.setMatrixAt(i, tmp.matrix);
  }
  buoyInst.instanceMatrix.needsUpdate = true;
  g.add(buoyInst);

  // 4 Sleek Racing Rowing Sculls (4 lanes between buoys: x = -48, -28, -8, +12)
  const boatColors = ['#d93829', '#eab308', '#0284c7', '#10b981'];
  const wakeMat = new THREE.MeshBasicMaterial({
    color: '#e0f7ff',
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const boats = [];
  const boatLaneXs = [-48, -28, -8, 12];

  for (let i = 0; i < 4; i++) {
    const bGroup = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: boatColors[i], roughness: 0.35, metalness: 0.25 });

    // Long slender racing shell (scaled crisply for aerial visibility)
    bGroup.scale.setScalar(1.35);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 19.5), hullMat);
    hull.position.y = 0.5;
    bGroup.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.2, 4), hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(0, 0.55, 10.8);
    bGroup.add(bow);

    // 4 synchronized rowers + sweeping oars
    const oars = [];
    for (let r = 0; r < 4; r++) {
      const rz = -5.5 + r * 3.6;
      const rower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 1.45, 6), mats.whiteConcrete);
      rower.position.set(0, 1.5, rz);
      bGroup.add(rower);

      for (const side of [-1, 1]) {
        const oarPivot = new THREE.Group();
        oarPivot.position.set(side * 0.7, 1.05, rz);
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 0.22), mats.gold);
        shaft.position.set(side * 2.2, 0, 0);
        oarPivot.add(shaft);
        bGroup.add(oarPivot);
        oars.push({ pivot: oarPivot, side });
      }
    }

    // Soft V-wake trail behind stern
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 22), wakeMat);
    wake.rotation.x = -Math.PI / 2;
    wake.position.set(0, 0.16, -20);
    bGroup.add(wake);

    g.add(bGroup);
    boats.push({
      group: bGroup,
      oars,
      x: boatLaneXs[i],
      speed: 14.5 + i * 0.9,
      phase: i * 1.45,
      offset: -180 + i * 28,
    });
  }

  function update(elapsedSec, { lightingMode }) {
    const isNight = lightingMode === 'malam';
    buoyMat.emissiveIntensity = isNight ? 2.2 : 0.35;
    for (const b of boats) {
      const courseLen = 420;
      const surge = Math.sin(elapsedSec * 0.55 + b.phase) * 14;
      const z = -210 + ((((elapsedSec * b.speed + b.offset + 210) % courseLen) + courseLen) % courseLen) + surge * 0.25;
      b.group.position.set(b.x, 0.15, z);
      // Synchronized oar rowing stroke
      const stroke = Math.sin(elapsedSec * 5.2 + b.phase);
      const lift = Math.cos(elapsedSec * 5.2 + b.phase) * 0.22;
      for (const o of b.oars) {
        o.pivot.rotation.y = o.side * stroke * 0.48;
        o.pivot.rotation.z = o.side * lift;
      }
    }
  }

  return { model: g, update };
}

// ============================================================================
// 5. TAMAN KAMBANG IWAK BESAK — Dancing Lake Fountain + Lakeside Joggers
// ============================================================================
export function buildRealKambangIwakModel(mats) {
  const g = new THREE.Group();

  // Central stone fountain ring island inside Kambang Iwak lake
  const island = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 10.0, 1.5, 20), mats.whiteConcrete);
  island.position.y = 0.75;
  g.add(island);
  const ringGold = new THREE.Mesh(new THREE.CylinderGeometry(9.0, 9.0, 0.4, 20), mats.gold);
  ringGold.position.y = 1.55;
  g.add(ringGold);

  // 4 Lakeside heritage park gazebos around the oval jogging track
  const gazeboAngles = [0.45, 2.65, 3.6, 5.8];
  for (const ang of gazeboAngles) {
    const gx = Math.cos(ang) * 136;
    const gz = Math.sin(ang) * 60;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 3.8, 6), mats.creamWall);
    col.position.set(gx, 1.9, gz);
    g.add(col);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.8, 6), mats.terracotta);
    roof.position.set(gx, 5.1, gz);
    g.add(roof);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), mats.warmGlow);
    lamp.position.set(gx, 3.2, gz);
    g.add(lamp);
  }

  // Dancing Musical Fountain — 42 instanced luminous water plumes in concentric rings
  const JET_COUNT = 42;
  const jetMat = new THREE.MeshBasicMaterial({
    color: '#7ce8ff',
    transparent: true,
    opacity: 0.9,
  });
  const jetInst = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 7, 7), jetMat, JET_COUNT);
  jetInst.frustumCulled = false;
  g.add(jetInst);

  // 14 Colorful Animated Joggers running along the real lakeside oval track (rx ≈ 128m, rz ≈ 54m)
  const JOGGER_COUNT = 14;
  const joggerBodyInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.6, 0.75, 2.4, 6),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
    JOGGER_COUNT
  );
  const joggerHeadInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.58, 7, 7),
    mats.gold,
    JOGGER_COUNT
  );
  joggerBodyInst.frustumCulled = false;
  joggerHeadInst.frustumCulled = false;

  const shirtPalette = ['#e11d48', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];
  const cTmp = new THREE.Color();
  const joggers = [];
  for (let i = 0; i < JOGGER_COUNT; i++) {
    cTmp.set(shirtPalette[i % shirtPalette.length]);
    joggerBodyInst.setColorAt(i, cTmp);
    joggers.push({
      angle: (i / JOGGER_COUNT) * Math.PI * 2,
      dir: i % 3 === 0 ? -1 : 1,
      speed: 0.032 + (i % 4) * 0.009,
      laneOffset: (i % 2 === 0 ? 1 : -1) * 2.2,
      stridePhase: i * 1.1,
    });
  }
  joggerBodyInst.instanceColor.needsUpdate = true;
  g.add(joggerBodyInst, joggerHeadInst);

  const dummy = new THREE.Object3D();
  const fColor = new THREE.Color();
  function update(elapsedSec, { lightingMode, quality }) {
    const isNight = lightingMode === 'malam';
    const isSunset = lightingMode === 'senja';
    // Musical fountain color choreography at night/sunset
    if (isNight || isSunset) {
      const hue = ((elapsedSec * 0.14) % 1 + 1) % 1;
      fColor.setHSL(hue, 0.92, 0.68);
      jetMat.color.copy(fColor);
    } else {
      jetMat.color.set('#b8f1ff');
    }

    const activeJets = quality === 'eco' ? 22 : JET_COUNT;
    jetInst.count = activeJets;
    for (let i = 0; i < activeJets; i++) {
      const ring = i < 10 ? 0 : 1; // Inner tall geyser vs outer dancing ring
      const idxInRing = ring === 0 ? i : i - 10;
      const ringTotal = ring === 0 ? 10 : Math.max(1, activeJets - 10);
      const p = ((elapsedSec * (ring === 0 ? 0.9 : 0.72) + idxInRing / ringTotal) % 1 + 1) % 1;
      const wave = 0.7 + 0.35 * Math.sin(elapsedSec * 2.1 + idxInRing * 0.5);
      const maxH = (ring === 0 ? 16.5 : 10.5) * wave;
      const ang = (idxInRing / ringTotal) * Math.PI * 2 + elapsedSec * (ring === 0 ? 0.35 : -0.25);
      const r = ring === 0 ? 1.5 + p * 3.8 : 4.2 + p * 7.5;
      const y = 1.6 + Math.sin(p * Math.PI) * maxH;
      const sc = 0.65 + Math.sin(p * Math.PI) * 0.95;
      dummy.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);
      dummy.scale.set(sc, sc * 1.4, sc);
      dummy.updateMatrix();
      jetInst.setMatrixAt(i, dummy.matrix);
    }
    jetInst.instanceMatrix.needsUpdate = true;

    const activeJoggers = quality === 'eco' ? 8 : JOGGER_COUNT;
    joggerBodyInst.count = activeJoggers;
    joggerHeadInst.count = activeJoggers;
    for (let i = 0; i < activeJoggers; i++) {
      const j = joggers[i];
      const theta = j.angle + elapsedSec * j.speed * j.dir;
      const rx = 128 + j.laneOffset;
      const rz = 53 + j.laneOffset;
      const x = Math.cos(theta) * rx;
      const z = Math.sin(theta) * rz;
      const bounce = Math.abs(Math.sin(elapsedSec * 8.5 + j.stridePhase)) * 0.45;
      dummy.position.set(x, 1.3 + bounce, z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, -theta, 0);
      dummy.updateMatrix();
      joggerBodyInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, 3.0 + bounce, z);
      dummy.updateMatrix();
      joggerHeadInst.setMatrixAt(i, dummy.matrix);
    }
    joggerBodyInst.instanceMatrix.needsUpdate = true;
    joggerHeadInst.instanceMatrix.needsUpdate = true;
  }

  return { model: g, update };
}

// ============================================================================
// 6. BUKIT SIGUNTANG — Srivijaya Hilltop Pendopo + Floating Golden Fireflies
// ============================================================================
export function buildRealBukitSiguntangModel(mats) {
  const g = new THREE.Group();

  const foliageDark = new THREE.MeshStandardMaterial({ color: '#215932', roughness: 0.85 });
  const foliageMid = new THREE.MeshStandardMaterial({ color: '#2e7540', roughness: 0.82 });
  const fireflyMat = new THREE.MeshStandardMaterial({
    color: '#ffe57f',
    emissive: '#ffbe2e',
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
  });

  // Tiered sacred hill terrace & stone sanctuary plaza
  const terrace1 = new THREE.Mesh(new THREE.CylinderGeometry(36, 44, 4.5, 16), foliageDark);
  terrace1.position.y = 2.25;
  g.add(terrace1);

  const terrace2 = new THREE.Mesh(new THREE.CylinderGeometry(24, 29, 3.2, 16), mats.concrete);
  terrace2.position.y = 5.8;
  g.add(terrace2);

  // Ceremonial stone staircase leading up the hill (+Z side)
  for (let s = 0; s < 5; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(9, 1.1, 3.2), mats.creamWall);
    step.position.set(0, 1.0 + s * 1.25, 34 - s * 2.8);
    g.add(step);
  }

  // Central Pendopo Agung Bukit Siguntang (traditional Srivijaya/Palembang limasan royal pavilion)
  const pFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 1.4, 18), mats.creamWall);
  pFloor.position.y = 8.1;
  g.add(pFloor);

  for (const px of [-9, -3, 3, 9]) {
    for (const pz of [-7, 7]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 6.2, 8), mats.darkWood);
      col.position.set(px, 11.8, pz);
      g.add(col);
    }
  }

  // Warm sanctuary inner glow
  const innerGlow = new THREE.Mesh(new THREE.BoxGeometry(12, 3.2, 9), mats.warmGlow);
  innerGlow.position.y = 10.6;
  g.add(innerGlow);

  // Tiered Palembang crimson-terracotta pavilion roof + golden simbar finials
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(18.5, 5.2, 4), mats.terracotta);
  roof1.rotation.y = Math.PI / 4;
  roof1.scale.set(1.15, 1, 0.92);
  roof1.position.y = 17.4;
  g.add(roof1);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(11.0, 4.4, 4), mats.crimson);
  roof2.rotation.y = Math.PI / 4;
  roof2.position.y = 21.4;
  g.add(roof2);

  const goldCrest = new THREE.Mesh(new THREE.ConeGeometry(0.95, 3.8, 6), mats.gold);
  goldCrest.position.y = 25.0;
  g.add(goldCrest);

  // Flanking historic royal tomb pavilions (Raja Segentar Alam & Putri Kembang Dadar)
  for (const sx of [-24, 24]) {
    const subBase = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 10), mats.creamWall);
    subBase.position.set(sx, 6.2, -8);
    g.add(subBase);
    const subRoof = new THREE.Mesh(new THREE.ConeGeometry(8.2, 4.0, 4), mats.terracotta);
    subRoof.rotation.y = Math.PI / 4;
    subRoof.position.set(sx, 10.2, -8);
    g.add(subRoof);
  }

  // Lush ring of 18 tropical heritage trees surrounding the hill
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    if (Math.abs(ang - Math.PI * 0.5) < 0.28) continue; // Keep stairway entrance clear
    const r = 34 + (i % 3) * 8;
    const tx = Math.cos(ang) * r;
    const tz = Math.sin(ang) * r;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.9, 6.5, 6), mats.darkWood);
    trunk.position.set(tx, 5.2, tz);
    g.add(trunk);
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(4.6 + (i % 3) * 1.1, 0), i % 2 === 0 ? foliageDark : foliageMid);
    canopy.position.set(tx, 10.5 + (i % 2) * 1.4, tz);
    g.add(canopy);
  }

  // 44 Floating Golden Srivijaya Fireflies orbiting gently around the hill & pendopo
  const FIREFLY_COUNT = 44;
  const fireflyInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.55, 6, 6), fireflyMat, FIREFLY_COUNT);
  fireflyInst.frustumCulled = false;
  g.add(fireflyInst);

  const flies = [];
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    flies.push({
      radius: 14 + (i * 7.3) % 34,
      baseY: 9.5 + (i * 3.7) % 14,
      ang: (i / FIREFLY_COUNT) * Math.PI * 2,
      speed: 0.14 + (i % 5) * 0.05,
      bobPhase: i * 1.37,
    });
  }

  const dummy = new THREE.Object3D();
  function update(elapsedSec, { lightingMode, quality }) {
    const isNight = lightingMode === 'malam';
    const isSunset = lightingMode === 'senja';
    fireflyMat.emissiveIntensity = isNight ? 4.4 : isSunset ? 2.4 : 0.65;
    fireflyMat.opacity = isNight ? 0.98 : isSunset ? 0.85 : 0.42;

    const cnt = quality === 'eco' ? 20 : FIREFLY_COUNT;
    fireflyInst.count = cnt;
    for (let i = 0; i < cnt; i++) {
      const f = flies[i];
      const a = f.ang + elapsedSec * f.speed;
      const x = Math.cos(a) * f.radius + Math.sin(elapsedSec * 0.9 + f.bobPhase) * 2.5;
      const z = Math.sin(a) * f.radius + Math.cos(elapsedSec * 0.8 + f.bobPhase) * 2.5;
      const y = f.baseY + Math.sin(elapsedSec * 1.6 + f.bobPhase) * 2.8;
      const twinkle = 0.55 + 0.65 * (0.5 + 0.5 * Math.sin(elapsedSec * 3.4 + f.bobPhase));
      const baseSc = isNight ? 1.25 : isSunset ? 1.0 : 0.62;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(twinkle * baseSc);
      dummy.updateMatrix();
      fireflyInst.setMatrixAt(i, dummy.matrix);
    }
    fireflyInst.instanceMatrix.needsUpdate = true;
  }

  return { model: g, update };
}
