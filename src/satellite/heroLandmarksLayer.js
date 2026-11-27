import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';

// Road-deck geometry shared with the animated traffic layer so vehicles drive exactly on the
// hero bridge models (deck span + sloped approach ramps), not on the river surface below.
export const HERO_BRIDGE_SPECS = [
  {
    id: 'ampera',
    lngLat: [104.76340, -2.99194],
    bearingDeg: 147.8,
    spanHalf: 175,
    rampLen: 160,
    roadTop: 14.325,
    roadHalfWidth: 8.75,
  },
  {
    id: 'musi-iv',
    lngLat: [104.77410, -2.98355],
    bearingDeg: 159.5,
    spanHalf: 200,
    rampLen: 180,
    roadTop: 16.275,
    roadHalfWidth: 8,
  },
];

function addBeam(parent, p1, p2, thickness, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(mesh);
  return mesh;
}

// Sloped concrete approach ramp from the bridge deck end down to ground level (the far end
// sinks into the terrain, so any bank height mismatch stays hidden).
function addApproachRamp(g, zStart, zEnd, roadY, deckW, roadW, mats) {
  const dz = zEnd - zStart;
  const dy = 0.15 - roadY;
  const len = Math.hypot(dz, dy);
  const phi = -Math.atan(dy / dz);
  const midY = (roadY + 0.15) / 2;
  const midZ = (zStart + zEnd) / 2;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckW, 2.0, len), mats.concrete);
  deck.position.set(0, midY - 1.2, midZ);
  deck.rotation.x = phi;
  g.add(deck);

  const road = new THREE.Mesh(new THREE.BoxGeometry(roadW, 0.35, len), mats.asphalt);
  road.position.set(0, midY, midZ);
  road.rotation.x = phi;
  g.add(road);

  for (const t of [0.1, 0.32, 0.54]) {
    const z = zStart + dz * t;
    const h = roadY + dy * t - 2.4;
    if (h < 2.5) continue;
    for (const sx of [-deckW * 0.3, deckW * 0.3]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, h, 8), mats.concrete);
      col.position.set(sx, h / 2, z);
      g.add(col);
    }
  }
}

// True-scale Jembatan Ampera in real-world meters (towers ~63m tall, central lift span ~75m, deck ~360m)
function buildRealAmperaModel(mats) {
  const g = new THREE.Group();
  const deckY = 14;
  const spanLen = 350;

  // Main red steel bridge deck & asphalt road
  const deck = new THREE.Mesh(new THREE.BoxGeometry(24, 2.4, spanLen), mats.steelRed);
  deck.position.set(0, deckY - 1.1, 0);
  g.add(deck);

  const road = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.35, spanLen), mats.asphalt);
  road.position.set(0, deckY + 0.15, 0);
  g.add(road);

  // Twin iconic 66m brick-red H-portal towers spaced 75m apart (z = -37.5 and +37.5)
  for (const tz of [-37.5, 37.5]) {
    // Concrete river pier + cutwater
    const pier = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 12.5), mats.concrete);
    pier.position.set(0, 5, tz);
    g.add(pier);

    // Steel tower legs rising to 66m (encasing OSM tower footprint cleanly)
    const legX = 12.0;
    const legH = 54;
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(4.2, legH, 6.2), mats.steelRed);
      leg.position.set(sx * legX, deckY + legH / 2 - 1, tz);
      g.add(leg);

      const led = new THREE.Mesh(new THREE.BoxGeometry(0.55, legH - 4, 0.65), mats.warmGlow);
      led.position.set(sx * (legX + 2.2), deckY + legH / 2 - 1, tz);
      g.add(led);
    }

    // Crossbeams & X-bracing
    const levels = [27, 39, 51, 63];
    for (const ly of levels) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(legX * 2 + 2.2, 2.2, 3.2), mats.steelRed);
      bar.position.set(0, ly, tz);
      g.add(bar);
    }
    for (let i = 0; i < levels.length - 1; i++) {
      addBeam(g, new THREE.Vector3(-legX + 1, levels[i], tz), new THREE.Vector3(legX - 1, levels[i + 1], tz), 0.85, mats.steelDarkRed);
      addBeam(g, new THREE.Vector3(legX - 1, levels[i], tz), new THREE.Vector3(-legX + 1, levels[i + 1], tz), 0.85, mats.steelDarkRed);
    }

    // Crown sheave housing + gold cap + aviation beacons
    const crown = new THREE.Mesh(new THREE.BoxGeometry(28.5, 4.8, 6.8), mats.steelRed);
    crown.position.set(0, 67.5, tz);
    g.add(crown);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(29.5, 1.0, 7.2), mats.gold);
    trim.position.set(0, 70.2, tz);
    g.add(trim);

    for (const sx of [-1, 1]) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), mats.beacon);
      beacon.position.set(sx * legX, 71.4, tz);
      g.add(beacon);
    }

    // Vertical lift cables down to central span
    const innerZ = tz > 0 ? 33 : -33;
    for (const sx of [-1, 1]) {
      addBeam(g, new THREE.Vector3(sx * 11.2, 65, tz), new THREE.Vector3(sx * 11.2, 24, innerZ), 0.28, mats.cable);
      addBeam(g, new THREE.Vector3(sx * 11.2, 65, tz), new THREE.Vector3(sx * 11.2, 24, tz > 0 ? 22 : -22), 0.24, mats.cable);
    }
  }

  // Steel side trusses along central lift span & flanking river spans (-115m..+115m)
  for (const [z0, z1] of [[-110, -39], [-36, 36], [39, 110]]) {
    const len = z1 - z0;
    const mid = (z0 + z1) / 2;
    const topY = 24;
    const bays = Math.max(4, Math.round(len / 13));
    const step = len / bays;
    for (const sx of [-10.5, 10.5]) {
      const topChord = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, len), mats.steelRed);
      topChord.position.set(sx, topY, mid);
      g.add(topChord);
      for (let i = 0; i <= bays; i++) {
        const z = z0 + i * step;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, topY - deckY, 0.7), mats.steelRed);
        post.position.set(sx, (topY + deckY) / 2, z);
        g.add(post);
        if (i < bays) {
          addBeam(
            g,
            new THREE.Vector3(sx, i % 2 === 0 ? deckY : topY, z),
            new THREE.Vector3(sx, i % 2 === 0 ? topY : deckY, z + step),
            0.55,
            mats.steelDarkRed
          );
        }
      }
    }
    for (let i = 1; i < bays; i++) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(21, 0.8, 0.8), mats.steelRed);
      cross.position.set(0, topY, z0 + i * step);
      g.add(cross);
    }
  }

  // Approach concrete piers
  for (const pz of [-155, -110, 110, 155]) {
    for (const sx of [-6, 6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 16, 8), mats.concrete);
      col.position.set(sx, 6, pz);
      g.add(col);
    }
  }

  addApproachRamp(g, spanLen / 2, spanLen / 2 + 160, deckY + 0.15, 22, 17.5, mats);
  addApproachRamp(g, -spanLen / 2, -spanLen / 2 - 160, deckY + 0.15, 22, 17.5, mats);

  return g;
}

// True-scale Jembatan Musi IV in real-world meters (cable-stayed white pylons ~58m tall)
function buildRealMusiIVModel(mats) {
  const g = new THREE.Group();
  const deckY = 16;
  const spanLen = 400;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(21, 2.0, spanLen), mats.whiteConcrete);
  deck.position.set(0, deckY - 1.0, 0);
  g.add(deck);

  const road = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, spanLen), mats.asphalt);
  road.position.set(0, deckY + 0.1, 0);
  g.add(road);

  for (const sx of [-10.7, 10.7]) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, spanLen), mats.cyanGlow);
    led.position.set(sx, deckY - 0.8, 0);
    g.add(led);
  }

  for (const pz of [-82, 82]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(24, 18, 9), mats.concrete);
    pier.position.set(0, 7, pz);
    g.add(pier);

    for (const sx of [-10.5, 10.5]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(2.6, 46, 4.0), mats.whiteConcrete);
      leg.position.set(sx, deckY + 21, pz);
      g.add(leg);

      const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.45, 38, 0.5), mats.cyanGlow);
      pLed.position.set(sx + Math.sign(sx) * 1.45, deckY + 22, pz);
      g.add(pLed);
    }

    for (const cy of [36, 56]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(23, 2.4, 3.2), mats.whiteConcrete);
      bar.position.set(0, cy, pz);
      g.add(bar);
    }

    const crown = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 3.6), mats.gold);
    crown.position.set(0, 60.5, pz);
    g.add(crown);

    const dirIn = pz < 0 ? 1 : -1;
    const dists = [18, 34, 50, 66, 80];
    for (let i = 0; i < dists.length; i++) {
      const anchorY = 57 - i * 3.0;
      for (const sx of [-10.2, 10.2]) {
        addBeam(g, new THREE.Vector3(sx, anchorY, pz), new THREE.Vector3(sx, deckY + 0.5, pz + dirIn * dists[i]), 0.22, mats.cable);
        if (i < 4) {
          addBeam(g, new THREE.Vector3(sx, anchorY, pz), new THREE.Vector3(sx, deckY + 0.5, pz - dirIn * (18 + i * 16)), 0.22, mats.cable);
        }
      }
    }
  }

  addApproachRamp(g, spanLen / 2, spanLen / 2 + 180, deckY + 0.1, 20, 16, mats);
  addApproachRamp(g, -spanLen / 2, -spanLen / 2 - 180, deckY + 0.1, 20, 16, mats);

  return g;
}

// True-scale 45m 9-Story Octagonal Pagoda + Klenteng Pavilion on Pulau Kemaro
function buildRealKemaroPagodaModel(mats) {
  const g = new THREE.Group();

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.5, 2.2, 8), mats.concrete);
  plinth.position.y = 1.1;
  g.add(plinth);

  let curY = 2.2;
  const stories = 9;
  for (let i = 0; i < stories; i++) {
    const t = i / (stories - 1);
    const radius = THREE.MathUtils.lerp(7.2, 2.9, t);
    const storyH = THREE.MathUtils.lerp(4.4, 3.2, t);

    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.94, radius, storyH, 8), mats.whiteConcrete);
    wall.position.y = curY + storyH / 2;
    g.add(wall);

    const win = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, storyH * 0.35, 8), mats.warmGlow);
    win.position.y = curY + storyH * 0.52;
    g.add(win);

    const eaveR = radius * 1.44;
    const eave = new THREE.Mesh(new THREE.ConeGeometry(eaveR, 1.8, 8), i === stories - 1 ? mats.gold : mats.crimson);
    eave.position.y = curY + storyH + 0.45;
    g.add(eave);

    const trim = new THREE.Mesh(new THREE.CylinderGeometry(eaveR * 1.02, eaveR * 1.04, 0.28, 8), mats.gold);
    trim.position.y = curY + storyH - 0.22;
    g.add(trim);

    curY += storyH + 0.48;
  }

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 6.2, 8), mats.gold);
  spire.position.y = curY + 3.1;
  g.add(spire);

  return g;
}

// True-scale Masjid Agung Sultan Mahmud Badaruddin I (3-tiered Palembang tumpang roof + 46m minaret)
function buildRealMasjidAgungModel(mats) {
  const g = new THREE.Group();

  // Raised marble plaza plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(58, 2.2, 54), mats.concrete);
  plinth.position.y = 1.1;
  g.add(plinth);

  // Main colonnaded prayer hall (encases flat OSM box with detailed heritage silhouette)
  const hall = new THREE.Mesh(new THREE.BoxGeometry(46, 13.5, 42), mats.creamWall);
  hall.position.y = 2.2 + 6.75;
  g.add(hall);

  // Glowing arched night-window bands on all four facades
  const winBandX = new THREE.Mesh(new THREE.BoxGeometry(46.6, 4.2, 34), mats.warmGlow);
  winBandX.position.y = 9.5;
  g.add(winBandX);
  const winBandZ = new THREE.Mesh(new THREE.BoxGeometry(38, 4.2, 42.6), mats.warmGlow);
  winBandZ.position.y = 9.5;
  g.add(winBandZ);

  // Iconic 3-tiered Palembang tumpang pyramidal roof (emerald-green heritage tiles + gold cornice)
  const tiers = [
    { w: 51, d: 47, h: 6.2, y: 15.7 },
    { w: 36, d: 33, h: 5.8, y: 21.6 },
    { w: 22, d: 20, h: 5.5, y: 27.1 },
  ];
  for (const t of tiers) {
    // 4-sided pyramid rotated 45 deg so edges align with rectangular hall
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(t.w, t.d) * 0.72, t.h, 4), mats.mosqueGreen);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, t.d / t.w);
    roof.position.y = t.y + t.h * 0.5;
    g.add(roof);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(t.w * 0.96, 0.55, t.d * 0.96), mats.gold);
    trim.position.y = t.y;
    g.add(trim);
  }

  // Golden mustaka crown finial
  const finial = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6.0, 8), mats.gold);
  finial.position.y = 35.4;
  g.add(finial);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 10), mats.gold);
  orb.position.y = 33.0;
  g.add(orb);

  // Iconic 46m tall cylindrical white-and-gold Menara Masjid Agung (east-south corner)
  const mx = 31;
  const mz = 18;
  const mBase = new THREE.Mesh(new THREE.BoxGeometry(8.5, 9, 8.5), mats.whiteConcrete);
  mBase.position.set(mx, 4.5, mz);
  g.add(mBase);

  const mShaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.3, 30, 14), mats.whiteConcrete);
  mShaft.position.set(mx, 24, mz);
  g.add(mShaft);

  for (const gy of [28, 37]) {
    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 3.8, 1.4, 14), mats.gold);
    gallery.position.set(mx, gy, mz);
    g.add(gallery);
  }
  const mLantern = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.2, 12), mats.warmGlow);
  mLantern.position.set(mx, 40.5, mz);
  g.add(mLantern);

  const mDome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), mats.mosqueGreen);
  mDome.position.set(mx, 43.2, mz);
  g.add(mDome);

  const mSpire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 4.5, 8), mats.gold);
  mSpire.position.set(mx, 47.2, mz);
  g.add(mSpire);

  return g;
}

// True-scale Monumen Perjuangan Rakyat (Monpera) — iconic 5-petal Melati flower monument (~22m)
function buildRealMonperaModel(mats) {
  const g = new THREE.Group();

  // Stepped pentagonal ceremonial plaza base
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 18.0, 1.8, 5), mats.concrete);
  step1.position.y = 0.9;
  g.add(step1);
  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(12.2, 13.5, 2.2, 5), mats.whiteConcrete);
  step2.position.y = 2.9;
  g.add(step2);

  // Central museum drum & glowing ring
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 8.2, 5.0, 10), mats.whiteConcrete);
  drum.position.y = 6.5;
  g.add(drum);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 0.85, 10), mats.warmGlow);
  ring.position.y = 8.4;
  g.add(ring);

  // Five sweeping white Melati petals curving upward & outward
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const petalGroup = new THREE.Group();
    petalGroup.rotation.y = angle;

    const lower = new THREE.Mesh(new THREE.BoxGeometry(5.6, 10.5, 1.6), mats.whiteConcrete);
    lower.position.set(0, 12.2, 5.2);
    lower.rotation.x = 0.24;
    petalGroup.add(lower);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(4.4, 8.5, 1.25), mats.whiteConcrete);
    upper.position.set(0, 20.0, 7.6);
    upper.rotation.x = 0.48;
    petalGroup.add(upper);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 4), mats.gold);
    tip.position.set(0, 24.4, 9.8);
    tip.rotation.x = 0.56;
    petalGroup.add(tip);

    g.add(petalGroup);
  }

  // Golden core flame/stamen
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.0, 13.5, 8), mats.gold);
  core.position.y = 14.5;
  g.add(core);

  return g;
}

// True-scale Benteng Kuto Besak riverside fortress wall, twin corner bastions & Lawang Kuto gateway
function buildRealKutoBesakWallModel(mats) {
  const g = new THREE.Group();
  const wallLen = 152;
  const wallH = 8.8;

  // Main fortified limestone wall facing Sungai Musi
  const mainWall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, wallH, 4.2), mats.creamWall);
  mainWall.position.set(0, wallH / 2, 0);
  g.add(mainWall);

  // Parapet coping & warm heritage wall uplight strip
  const coping = new THREE.Mesh(new THREE.BoxGeometry(wallLen + 1.5, 0.9, 5.0), mats.terracotta);
  coping.position.set(0, wallH + 0.45, 0);
  g.add(coping);

  const glow = new THREE.Mesh(new THREE.BoxGeometry(wallLen - 16, 0.55, 4.7), mats.warmGlow);
  glow.position.set(0, 2.2, 0);
  g.add(glow);

  // Twin riverside corner bastions (east & west flanks)
  for (const sx of [-1, 1]) {
    const bastion = new THREE.Mesh(new THREE.BoxGeometry(19, wallH + 2.2, 16), mats.creamWall);
    bastion.position.set(sx * (wallLen / 2 + 4), (wallH + 2.2) / 2, 3.2);
    g.add(bastion);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 5.0, 4), mats.terracotta);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(sx * (wallLen / 2 + 4), wallH + 4.7, 3.2);
    g.add(roof);
  }

  // Lawang Kuto ceremonial central riverside gateway with Palembang limasan roof
  const gateTower = new THREE.Mesh(new THREE.BoxGeometry(22, 12.5, 9.5), mats.whiteConcrete);
  gateTower.position.set(0, 6.25, 1.5);
  g.add(gateTower);

  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6.8, 10.1), mats.asphalt);
  gateArch.position.set(0, 3.4, 1.5);
  g.add(gateArch);

  const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(16.5, 6.4, 4), mats.terracotta);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.scale.set(1.2, 1, 0.72);
  gateRoof.position.set(0, 15.6, 1.5);
  g.add(gateRoof);

  const gateTrim = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.7, 10.4), mats.gold);
  gateTrim.position.set(0, 12.5, 1.5);
  g.add(gateTrim);

  return g;
}

// True-scale Kantor Walikota Palembang (Gedung Ledeng — 1928 Dutch-colonial Water Tower, ~36m)
function buildRealGedungLedengModel(mats) {
  const g = new THREE.Group();

  // Symmetric colonial main office wings
  const wing = new THREE.Mesh(new THREE.BoxGeometry(44, 11.5, 18), mats.creamWall);
  wing.position.y = 5.75;
  g.add(wing);

  const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(45.5, 2.2, 19.5), mats.terracotta);
  wingRoof.position.y = 12.6;
  g.add(wingRoof);

  // Glowing heritage arcade windows along main facade
  const wingWin = new THREE.Mesh(new THREE.BoxGeometry(38, 3.2, 18.6), mats.warmGlow);
  wingWin.position.y = 6.2;
  g.add(wingWin);

  // Iconic central 36m square-stepped Water Tower (Menara Air / Gedung Ledeng)
  const tBase = new THREE.Mesh(new THREE.BoxGeometry(15, 18, 15), mats.whiteConcrete);
  tBase.position.y = 14;
  g.add(tBase);

  const tUpper = new THREE.Mesh(new THREE.BoxGeometry(12.2, 11.5, 12.2), mats.creamWall);
  tUpper.position.y = 26.5;
  g.add(tUpper);

  const tGallery = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.1, 14.5), mats.gold);
  tGallery.position.y = 23.2;
  g.add(tGallery);

  const tClockBand = new THREE.Mesh(new THREE.BoxGeometry(12.7, 3.0, 12.7), mats.warmGlow);
  tClockBand.position.y = 28.0;
  g.add(tClockBand);

  const tRoof = new THREE.Mesh(new THREE.ConeGeometry(10.2, 6.2, 4), mats.terracotta);
  tRoof.rotation.y = Math.PI / 4;
  tRoof.position.y = 35.3;
  g.add(tRoof);

  const tSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 4.5, 8), mats.gold);
  tSpire.position.y = 40.0;
  g.add(tSpire);

  return g;
}

// True-scale Rumah Limas Palembang Traditional Heritage Pavilion (Museum SMB II / Taman BKB)
function buildRealRumahLimasModel(mats) {
  const g = new THREE.Group();

  // Traditional elevated stilt pillars (rumah panggung)
  for (const px of [-9, -3, 3, 9]) {
    for (const pz of [-5.5, 0, 5.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.8, 6), mats.darkWood);
      post.position.set(px, 1.9, pz);
      g.add(post);
    }
  }

  // Raised kekijing timber platform & carved crimson-gold walls
  const floor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.9, 14), mats.darkWood);
  floor.position.y = 4.1;
  g.add(floor);

  const walls = new THREE.Mesh(new THREE.BoxGeometry(19.5, 4.8, 11.8), mats.crimson);
  walls.position.y = 6.95;
  g.add(walls);

  const goldCarving = new THREE.Mesh(new THREE.BoxGeometry(20.1, 0.65, 12.4), mats.gold);
  goldCarving.position.y = 9.2;
  g.add(goldCarving);

  const windows = new THREE.Mesh(new THREE.BoxGeometry(14, 2.0, 12.2), mats.warmGlow);
  windows.position.y = 7.0;
  g.add(windows);

  // Iconic steep Palembang Limas roof + golden simbar crest finials
  const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(17.5, 5.4, 4), mats.terracotta);
  lowerRoof.rotation.y = Math.PI / 4;
  lowerRoof.scale.set(1.18, 1, 0.8);
  lowerRoof.position.y = 12.0;
  g.add(lowerRoof);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.9, 1.1), mats.gold);
  ridge.position.y = 14.9;
  g.add(ridge);

  for (const sx of [-5.2, 0, 5.2]) {
    const simbar = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.4, 4), mats.gold);
    simbar.position.set(sx, 16.3, 0);
    g.add(simbar);
  }

  return g;
}

export function createHeroLandmarksCustomLayer() {
  const mats = {
    steelRed: new THREE.MeshStandardMaterial({ color: '#bd3228', roughness: 0.46, metalness: 0.32 }),
    steelDarkRed: new THREE.MeshStandardMaterial({ color: '#8f221b', roughness: 0.55, metalness: 0.35 }),
    crimson: new THREE.MeshStandardMaterial({ color: '#c42622', roughness: 0.5 }),
    asphalt: new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.9 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#c8c2b6', roughness: 0.85 }),
    whiteConcrete: new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.68 }),
    creamWall: new THREE.MeshStandardMaterial({ color: '#ede4d3', roughness: 0.74 }),
    mosqueGreen: new THREE.MeshStandardMaterial({ color: '#1b6b4b', roughness: 0.45, metalness: 0.15 }),
    terracotta: new THREE.MeshStandardMaterial({ color: '#a8442a', roughness: 0.62 }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#4a2c1d', roughness: 0.78 }),
    cable: new THREE.MeshStandardMaterial({ color: '#bfc8d2', roughness: 0.3, metalness: 0.7 }),
    gold: new THREE.MeshStandardMaterial({ color: '#e0ad2e', roughness: 0.32, metalness: 0.58 }),
    warmGlow: new THREE.MeshStandardMaterial({
      color: '#ffe8b0',
      emissive: '#ffaa38',
      emissiveIntensity: 0.25,
    }),
    cyanGlow: new THREE.MeshStandardMaterial({
      color: '#b5e2ff',
      emissive: '#3fa2ff',
      emissiveIntensity: 0.25,
    }),
    beacon: new THREE.MeshStandardMaterial({
      color: '#ff4838',
      emissive: '#ff2214',
      emissiveIntensity: 0.6,
    }),
  };

  // Three independently anchored Three.js scenes (zero Float32 precision loss across 6+ km!)
  const entries = [
    {
      name: 'Ampera',
      lngLat: [104.76340, -2.99194],
      altitude: 0,
      bearingDeg: 147.8,
      model: buildRealAmperaModel(mats),
    },
    {
      name: 'MusiIV',
      lngLat: [104.77410, -2.98355],
      altitude: 0,
      bearingDeg: 159.5,
      model: buildRealMusiIVModel(mats),
    },
    {
      name: 'KemaroPagoda',
      lngLat: [104.81312, -2.98038],
      altitude: 0,
      bearingDeg: 0,
      model: buildRealKemaroPagodaModel(mats),
    },
    {
      name: 'MasjidAgung',
      lngLat: [104.76008, -2.98778],
      altitude: 0,
      bearingDeg: 8,
      model: buildRealMasjidAgungModel(mats),
    },
    {
      name: 'Monpera',
      lngLat: [104.76065, -2.98968],
      altitude: 0,
      bearingDeg: 14,
      model: buildRealMonperaModel(mats),
    },
    {
      name: 'BentengKutoBesak',
      lngLat: [104.75985, -2.99185],
      altitude: 0,
      bearingDeg: 164,
      model: buildRealKutoBesakWallModel(mats),
    },
    {
      name: 'GedungLedeng',
      lngLat: [104.75667, -2.99104],
      altitude: 0,
      bearingDeg: 12,
      model: buildRealGedungLedengModel(mats),
    },
    {
      name: 'RumahLimas',
      lngLat: [104.75912, -2.99122],
      altitude: 0,
      bearingDeg: 164,
      model: buildRealRumahLimasModel(mats),
    },
  ];

  const scenes = entries.map((entry) => {
    const s = new THREE.Scene();
    const amb = new THREE.AmbientLight('#ffffff', 0.85);
    const sun = new THREE.DirectionalLight('#fff5de', 1.85);
    sun.position.set(120, 180, 90);
    const fill = new THREE.DirectionalLight('#9cc6ea', 0.55);
    fill.position.set(-100, 70, -80);
    s.add(amb, sun, fill, entry.model);
    return { ...entry, scene: s, amb, sun, fill };
  });

  let renderer = null;
  let camera = null;
  let mapRef = null;
  let baseBeaconIntensity = 0.6;

  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

  function setLightingMode(mode) {
    const isNight = mode === 'malam';
    const isSunset = mode === 'senja';
    const nightGlow = isNight ? 1.0 : isSunset ? 0.72 : 0.0;

    mats.warmGlow.emissiveIntensity = 0.25 + nightGlow * 2.8;
    mats.cyanGlow.emissiveIntensity = 0.25 + nightGlow * 2.8;
    baseBeaconIntensity = 0.6 + nightGlow * 2.4;
    mats.beacon.emissiveIntensity = baseBeaconIntensity;

    for (const s of scenes) {
      if (isNight) {
        s.sun.color.set('#8db4eb');
        s.sun.intensity = 0.85;
        s.amb.intensity = 0.45;
        s.fill.intensity = 0.35;
      } else if (isSunset) {
        s.sun.color.set('#ffa954');
        s.sun.intensity = 2.0;
        s.sun.position.set(-160, 55, 80);
        s.amb.intensity = 0.72;
        s.fill.intensity = 0.48;
      } else {
        s.sun.color.set('#fff5de');
        s.sun.intensity = 1.85;
        s.sun.position.set(120, 180, 90);
        s.amb.intensity = 0.85;
        s.fill.intensity = 0.55;
      }
    }
    if (mapRef) mapRef.triggerRepaint();
  }

  const customLayer = {
    id: 'palembang-hero-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      mapRef = map;
      camera = new THREE.Camera();
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    },
    render(gl, options) {
      if (!renderer || !camera) return;
      const projArr = options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix || options;
      const m = new THREE.Matrix4().fromArray(projArr);

      // Gentle aviation warning beacon pulse on Ampera's twin 66m towers
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0045));
      mats.beacon.emissiveIntensity = baseBeaconIntensity * (0.55 + pulse * 0.9);

      renderer.resetState();

      for (const item of scenes) {
        const elev = mapRef && typeof mapRef.queryTerrainElevation === 'function'
          ? (mapRef.queryTerrainElevation(item.lngLat) || 0)
          : 0;
        const origin = maplibregl.MercatorCoordinate.fromLngLat(item.lngLat, item.altitude + Math.max(0, elev));
        const scale = origin.meterInMercatorCoordinateUnits();
        // Under S(1,-1,1)*Rx(+PI/2)*Ry(theta), local +Z maps to (East=sin(theta), South=+cos(theta)).
        // For compass bearing B (clockwise from North: East=sin(B), South=-cos(B)), theta = PI - B.
        const bearingRad = THREE.MathUtils.degToRad(item.bearingDeg);
        const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI - bearingRad);

        const l = new THREE.Matrix4()
          .makeTranslation(origin.x, origin.y, origin.z)
          .scale(new THREE.Vector3(scale, -scale, scale))
          .multiply(rotX)
          .multiply(rotY);

        camera.projectionMatrix = m.clone().multiply(l);
        renderer.render(item.scene, camera);
      }
    },
  };

  return { layer: customLayer, setLightingMode };
}
