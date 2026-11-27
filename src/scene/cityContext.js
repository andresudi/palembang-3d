import * as THREE from 'three';
import { GROUND_Y, getRiverBoundsAt } from './riverMusi.js';
import { getPBRTextures } from './textures.js';

function createRumahLimas(x, z, rotY, scale, materials) {
  const g = new THREE.Group();
  const { woodDark, woodMid, terracotta, maroon, gold, windowGlow } = materials;

  // Unglen timber stilts grounded cleanly below GROUND_Y
  for (const sx of [-2.4, 0, 2.4]) {
    for (const sz of [-1.8, 1.8]) {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.8, 6), woodDark);
      stilt.position.set(sx, 0.9, sz);
      g.add(stilt);
    }
  }

  // Elevated timber body & tiered veranda
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.3, 4.4), woodMid);
  body.position.y = 3.1;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Prado maroon & gold fascia trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.35, 4.65), maroon);
  trim.position.y = 2.05;
  g.add(trim);

  const goldBand = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.14, 4.7), gold);
  goldBand.position.y = 4.22;
  g.add(goldBand);

  // Glowing front windows
  const win = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 4.48), windowGlow);
  win.position.y = 3.2;
  g.add(win);

  // Multi-tiered truncated Limas roof + simbar apex
  const roofLower = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.7, 4), terracotta);
  roofLower.rotation.y = Math.PI / 4;
  roofLower.scale.set(1.18, 1, 0.92);
  roofLower.position.y = 5.05;
  roofLower.castShadow = true;
  g.add(roofLower);

  const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.8, 4), terracotta);
  roofUpper.rotation.y = Math.PI / 4;
  roofUpper.scale.set(1.15, 1, 0.88);
  roofUpper.position.y = 6.2;
  roofUpper.castShadow = true;
  g.add(roofUpper);

  // Simbar decorative ridge horns
  for (const sx of [-0.7, 0.7]) {
    const simbar = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 4), gold);
    simbar.position.set(sx, 7.15, 0);
    g.add(simbar);
  }

  g.position.set(x, GROUND_Y - 0.35, z);
  g.rotation.y = rotY;
  g.scale.setScalar(scale);
  return g;
}

function createMasjidAgung(x, z, materials) {
  const g = new THREE.Group();
  g.name = 'MasjidAgungSMBI';
  const { whiteMarble, creamWall, terracotta, emerald, gold, windowGlow } = materials;

  // Marble stepped plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(38, 1.5, 36), whiteMarble);
  plinth.position.y = 0.75;
  plinth.receiveShadow = true;
  g.add(plinth);

  // Main colonnaded prayer hall
  const hall = new THREE.Mesh(new THREE.BoxGeometry(28, 7.5, 26), whiteMarble);
  hall.position.y = 5.2;
  hall.castShadow = true;
  hall.receiveShadow = true;
  g.add(hall);

  // Doric-inspired perimeter pillars
  for (let px = -14.5; px <= 14.5; px += 4.8) {
    for (const pz of [-13.5, 13.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 7.5, 8), creamWall);
      col.position.set(px, 5.2, pz);
      col.castShadow = true;
      g.add(col);
    }
  }

  // Emerald green accent band & glowing arched windows
  const greenTrim = new THREE.Mesh(new THREE.BoxGeometry(28.6, 0.85, 26.6), emerald);
  greenTrim.position.y = 8.6;
  g.add(greenTrim);

  const winBand = new THREE.Mesh(new THREE.BoxGeometry(28.2, 2.4, 26.2), windowGlow);
  winBand.position.y = 5.2;
  g.add(winBand);

  // Iconic 3-tiered pyramidal Atap Tumpang / Limas roof
  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(23.5, 4.4, 4), terracotta);
  tier1.rotation.y = Math.PI / 4;
  tier1.position.y = 11.1;
  tier1.castShadow = true;
  g.add(tier1);

  const tier2Base = new THREE.Mesh(new THREE.BoxGeometry(17.5, 1.8, 16.5), whiteMarble);
  tier2Base.position.y = 13.3;
  g.add(tier2Base);

  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(16.2, 3.8, 4), terracotta);
  tier2.rotation.y = Math.PI / 4;
  tier2.position.y = 15.6;
  tier2.castShadow = true;
  g.add(tier2);

  const tier3Base = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.4, 8.8), emerald);
  tier3Base.position.y = 17.5;
  g.add(tier3Base);

  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(8.4, 3.5, 4), terracotta);
  tier3.rotation.y = Math.PI / 4;
  tier3.position.y = 19.6;
  tier3.castShadow = true;
  g.add(tier3);

  const mustaka = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.65, 2.8, 8), gold);
  mustaka.position.y = 22.3;
  g.add(mustaka);

  // Tall main white minaret (45m proportion)
  const minX = 18.5;
  const minZ = 11.5;
  const minBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 6.0, 8), whiteMarble);
  minBase.position.set(minX, 4.2, minZ);
  minBase.castShadow = true;
  g.add(minBase);

  const minShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.35, 24.0, 10), whiteMarble);
  minShaft.position.set(minX, 18.5, minZ);
  minShaft.castShadow = true;
  g.add(minShaft);

  for (const by of [16.5, 26.5]) {
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.2, 0.9, 10), emerald);
    balcony.position.set(minX, by, minZ);
    g.add(balcony);
  }

  const minDome = new THREE.Mesh(new THREE.SphereGeometry(1.85, 12, 10), gold);
  minDome.position.set(minX, 31.3, minZ);
  g.add(minDome);

  const minSpire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.6, 8), gold);
  minSpire.position.set(minX, 33.8, minZ);
  g.add(minSpire);

  // Older historic octagonal white minaret on the west side
  const oldMinX = -17.5;
  const oldMinZ = 9.0;
  const oldShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 16.5, 8), creamWall);
  oldShaft.position.set(oldMinX, 9.5, oldMinZ);
  oldShaft.castShadow = true;
  g.add(oldShaft);

  const oldDome = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.4, 8), terracotta);
  oldDome.position.set(oldMinX, 18.9, oldMinZ);
  g.add(oldDome);

  g.position.set(x, GROUND_Y - 0.15, z);
  return g;
}

function createMonpera(x, z, materials) {
  const g = new THREE.Group();
  g.name = 'Monpera';
  const { concreteLight, concreteMid, stonePlaza, lampGlow } = materials;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 13.0, 1.4, 8), stonePlaza);
  base.position.y = 0.7;
  base.receiveShadow = true;
  g.add(base);

  const podium = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 8.2, 3.2, 8), concreteMid);
  podium.position.y = 2.8;
  podium.castShadow = true;
  g.add(podium);

  // Central soaring shaft
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(3.4, 14.5, 3.4), concreteLight);
  shaft.position.y = 10.2;
  shaft.castShadow = true;
  g.add(shaft);

  // Sweeping concrete architectural wings
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 11.5, 5.2), concreteLight);
    wing.position.set(Math.cos(ang) * 3.1, 8.2, Math.sin(ang) * 3.1);
    wing.rotation.y = -ang;
    wing.castShadow = true;
    g.add(wing);
  }

  // Rooftop observation crown
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.6, 1.6, 8), concreteMid);
  crown.position.y = 17.8;
  g.add(crown);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), lampGlow);
  finial.position.y = 19.2;
  g.add(finial);

  g.position.set(x, GROUND_Y - 0.15, z);
  return g;
}

function createLRTViaductAndTrain(materials) {
  const g = new THREE.Group();
  g.name = 'LRTSumsel';
  const lrtX = -22;
  const { concreteMid, steelLight, lrtBlue, glassDark, lampGlow } = materials;

  // Continuous elevated box-girder viaduct from z=-175 to z=+215 (serving Ampera & Jakabaring stations)
  const trackLen = 390;
  const trackCenterZ = 20;
  const girder = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, trackLen), concreteMid);
  girder.position.set(lrtX, 14.3, trackCenterZ);
  girder.castShadow = true;
  girder.receiveShadow = true;
  g.add(girder);

  const trackBed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, trackLen), steelLight);
  trackBed.position.set(lrtX, 15.1, trackCenterZ);
  g.add(trackBed);

  // Concrete T-piers placed cleanly outside the Musi navigation corridor (|z| >= 44)
  const pierZs = [-156, -130, -102, -74, -46, 44, 70, 96, 122, 148, 174, 200];
  for (const z of pierZs) {
    const nearBank = Math.abs(z) < 48;
    const pierH = nearBank ? 14.5 : 11.2;
    const pierY = 14.0 - pierH / 2;
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, pierH, 8), concreteMid);
    pier.position.set(lrtX, pierY, z);
    pier.castShadow = true;
    g.add(pier);

    const head = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 1.8), concreteMid);
    head.position.set(lrtX, 13.7, z);
    g.add(head);
  }

  // Stasiun LRT Ampera on Seberang Ilir (z = -74)
  const stnGroup = new THREE.Group();
  const stnPlatform = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.4, 24), concreteMid);
  stnPlatform.position.set(lrtX, 14.5, -74);
  stnPlatform.castShadow = true;
  stnGroup.add(stnPlatform);

  const stnCanopy = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 5.6, 25, 10, 1, false, 0, Math.PI),
    lrtBlue
  );
  stnCanopy.rotation.z = Math.PI / 2;
  stnCanopy.rotation.y = Math.PI / 2;
  stnCanopy.scale.set(1, 0.48, 1);
  stnCanopy.position.set(lrtX, 18.2, -74);
  stnCanopy.castShadow = true;
  stnGroup.add(stnCanopy);
  g.add(stnGroup);

  // Animated 3-car LRT Sumsel trainset
  const train = new THREE.Group();
  for (let c = -1; c <= 1; c++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 8.2), steelLight);
    car.position.set(0, 16.3, c * 8.8);
    car.castShadow = true;
    train.add(car);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.55, 8.22), lrtBlue);
    stripe.position.set(0, 15.65, c * 8.8);
    train.add(stripe);

    const win = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.65, 7.2), glassDark);
    win.position.set(0, 16.55, c * 8.8);
    train.add(win);
  }

  const headLight = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.2), lampGlow);
  headLight.position.set(0, 15.7, 13.0);
  train.add(headLight);

  train.position.x = lrtX;
  g.add(train);

  return { group: g, train };
}

function createTree(x, y, z, scale, foliageMat, trunkMat) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2.4 * scale, 5), trunkMat);
  trunk.position.y = 1.2 * scale;
  tree.add(trunk);

  const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65 * scale, 1), foliageMat);
  canopy.position.y = 2.9 * scale;
  canopy.castShadow = true;
  tree.add(canopy);

  tree.position.set(x, y, z);
  return tree;
}

export function createCityContext(scene, env) {
  const group = new THREE.Group();
  group.name = 'PalembangCityContext';

  const pbr = getPBRTextures();
  const materials = {
    whiteMarble: new THREE.MeshStandardMaterial({
      color: '#faf8f2',
      map: pbr.plaster.map,
      bumpMap: pbr.plaster.bumpMap,
      bumpScale: 0.14,
      roughness: 0.66,
    }),
    creamWall: new THREE.MeshStandardMaterial({
      color: '#efe8d7',
      map: pbr.plaster.map,
      bumpMap: pbr.plaster.bumpMap,
      bumpScale: 0.18,
      roughness: 0.78,
    }),
    terracotta: new THREE.MeshStandardMaterial({
      color: '#e5b6a6',
      map: pbr.roofTile.map,
      bumpMap: pbr.roofTile.bumpMap,
      bumpScale: 0.26,
      roughness: 0.74,
    }),
    emerald: new THREE.MeshStandardMaterial({ color: '#1e6b47', roughness: 0.62, metalness: 0.1 }),
    gold: new THREE.MeshStandardMaterial({ color: '#e2ae2e', roughness: 0.28, metalness: 0.65 }),
    maroon: new THREE.MeshStandardMaterial({ color: '#7a2520', roughness: 0.72 }),
    woodDark: new THREE.MeshStandardMaterial({ color: '#4d321f', roughness: 0.88 }),
    woodMid: new THREE.MeshStandardMaterial({ color: '#754c2e', roughness: 0.82 }),
    concreteLight: new THREE.MeshStandardMaterial({
      color: '#d4d7da',
      map: pbr.plaster.map,
      roughness: 0.8,
    }),
    concreteMid: new THREE.MeshStandardMaterial({
      color: '#adb2b8',
      map: pbr.plaster.map,
      roughness: 0.84,
    }),
    stonePlaza: new THREE.MeshStandardMaterial({
      color: '#cac3b7',
      map: pbr.plaza.map,
      bumpMap: pbr.plaza.bumpMap,
      bumpScale: 0.18,
      roughness: 0.86,
    }),
    steelLight: new THREE.MeshStandardMaterial({
      color: '#dfe4ea',
      bumpMap: pbr.steelBump,
      bumpScale: 0.08,
      roughness: 0.38,
      metalness: 0.42,
    }),
    lrtBlue: new THREE.MeshStandardMaterial({ color: '#1f70b8', roughness: 0.42, metalness: 0.25 }),
    glassDark: new THREE.MeshStandardMaterial({ color: '#1f2c38', roughness: 0.18, metalness: 0.45 }),
    windowGlow: new THREE.MeshStandardMaterial({
      color: '#ffd98a',
      emissive: '#ffaa38',
      emissiveIntensity: 0.14,
    }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: '#fff1cc',
      emissive: '#ffc254',
      emissiveIntensity: 0.25,
    }),
  };

  // 1. Masjid Agung SMB I (North-west of Ampera Ilir foot, north of BKB-Ampera axis)
  group.add(createMasjidAgung(-66, -124, materials));

  // 2. Monpera Monument (near Ampera Ilir foot)
  group.add(createMonpera(-48, -72, materials));

  // 3. LRT Sumsel elevated viaduct + Stasiun Ampera + animated train
  const lrt = createLRTViaductAndTrain(materials);
  group.add(lrt.group);

  // 4. Rumah Limas riverfront stilt house clusters (flanking Kampung Kapitan, East Ulu & West Ilir)
  const uluClusterA = [-168, -152, -136];
  for (let i = 0; i < uluClusterA.length; i++) {
    const rx = uluClusterA[i];
    const bounds = getRiverBoundsAt(rx);
    group.add(createRumahLimas(rx, bounds.southEdgeZ + 7.5 + (i % 2) * 2.5, Math.PI, 1.0, materials));
  }

  const uluClusterB = [54, 72, 92];
  for (let i = 0; i < uluClusterB.length; i++) {
    const rx = uluClusterB[i];
    const bounds = getRiverBoundsAt(rx);
    group.add(createRumahLimas(rx, bounds.southEdgeZ + 7.5 + (i % 2) * 2.5, Math.PI, 0.95, materials));
  }

  const ilirClusterWest = [-244, -228, -212];
  for (let i = 0; i < ilirClusterWest.length; i++) {
    const rx = ilirClusterWest[i];
    const bounds = getRiverBoundsAt(rx);
    group.add(createRumahLimas(rx, bounds.northEdgeZ - 8.5, 0, 1.0, materials));
  }

  // Dense urban blocks, avenues, and tropical greenery are now provided by urbanFabric.js

  env.onLightingChange((cfg) => {
    materials.windowGlow.emissiveIntensity = 0.14 + cfg.nightGlow * 1.9;
    materials.lampGlow.emissiveIntensity = 0.25 + cfg.nightGlow * 2.4;
  });

  scene.add(group);

  return {
    group,
    update(elapsed) {
      // Smooth back-and-forth LRT glide between Stasiun Ampera (-140) and Stasiun Jakabaring (+185)
      const zPos = 22.5 + Math.sin(elapsed * 0.18) * 162;
      lrt.train.position.z = zPos;
    },
  };
}
