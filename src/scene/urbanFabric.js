import * as THREE from 'three';
import { GROUND_Y, getRiverBoundsAt } from './riverMusi.js';

// Deterministic PRNG for reproducible dense city placement
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Keep all landmarks, plazas, LRT, bridges, and riverfront stilt houses collision-free
const EXCLUSION_BOXES = [
  // Ampera bridge approaches & Sudirman center road
  { xMin: -11, xMax: 11, zMin: -268, zMax: 268 },
  // LRT Sumsel corridor + stations
  { xMin: -31, xMax: -13, zMin: -182, zMax: 222 },
  // Bundaran Air Mancur Masjid Agung
  { xMin: -22, xMax: 22, zMin: -146, zMax: -102 },
  // Masjid Agung SMB I
  { xMin: -90, xMax: -42, zMin: -146, zMax: -101 },
  // Monpera
  { xMin: -65, xMax: -32, zMin: -89, zMax: -56 },
  // Benteng Kuto Besak + Plaza BKB
  { xMin: -180, xMax: -84, zMin: -116, zMax: -42 },
  // Museum SMB II
  { xMin: -206, xMax: -172, zMin: -84, zMax: -46 },
  // Kantor Walikota (Menara Air / Ledeng)
  { xMin: -178, xMax: -130, zMin: -162, zMax: -122 },
  // Taman & Danau Kambang Iwak
  { xMin: -198, xMax: -98, zMin: -240, zMax: -172 },
  // Pasar 16 Ilir
  { xMin: 28, xMax: 88, zMin: -84, zMax: -38 },
  // Jembatan Musi IV approaches & Veteran road
  { xMin: 109, xMax: 131, zMin: -260, zMax: 235 },
  // Kampung Kapitan 7 Ulu
  { xMin: -116, xMax: -42, zMin: 36, zMax: 80 },
  // Stadion Gelora Sriwijaya / Jakabaring Sport City (centered at x=58, z=184)
  { xMin: 6, xMax: 112, zMin: 136, zMax: 232 },
  // Existing Rumah Limas riverfront clusters (Ulu A west of Kapitan, Ulu B east of Ampera, Ilir West)
  { xMin: -176, xMax: -128, zMin: 36, zMax: 60 },
  { xMin: 44, xMax: 102, zMin: 44, zMax: 68 },
  { xMin: -252, xMax: -204, zMin: -66, zMax: -42 },
];

// Arterial & collector road bands (buildings must stay outside road widths)
const ROAD_SEGMENTS = [
  // Seberang Ilir arterials
  { x1: 0, z1: -262, x2: 0, z2: -140, w: 12, arterial: true },        // Jl. Jend. Sudirman North
  { x1: -265, z1: -158, x2: 265, z2: -158, w: 10.5, arterial: true }, // Jl. Kolonel Atmo / Ring Ilir
  { x1: -92, z1: -218, x2: 255, z2: -218, w: 8.5, arterial: false },  // North residential collector
  { x1: -250, z1: -116, x2: -84, z2: -116, w: 8.5, arterial: false }, // Jl. Merdeka (behind BKB)
  { x1: -250, z1: -53, x2: -204, z2: -53, w: 8.0, arterial: false },  // West waterfront road
  { x1: -84, z1: -53, x2: 28, z2: -53, w: 8.5, arterial: true },      // Riverfront link under Ampera
  { x1: 86, z1: -53, x2: 112, z2: -53, w: 8.0, arterial: false },     // East Pasar 16 -> Musi IV
  { x1: 120, z1: -255, x2: 120, z2: -110, w: 10.5, arterial: true },  // Jl. Veteran -> Musi IV North
  // Seberang Ilir north-south collectors
  { x1: -215, z1: -245, x2: -215, z2: -54, w: 7.5, arterial: false },
  { x1: -92, z1: -245, x2: -92, z2: -54, w: 8.0, arterial: false },
  { x1: 36, z1: -245, x2: 36, z2: -84, w: 7.5, arterial: false },
  { x1: 86, z1: -245, x2: 86, z2: -54, w: 7.5, arterial: false },
  { x1: 175, z1: -245, x2: 175, z2: -76, w: 7.5, arterial: false },
  { x1: 225, z1: -245, x2: 225, z2: -82, w: 7.5, arterial: false },
  { x1: 126, z1: -96, x2: 260, z2: -96, w: 7.5, arterial: false },    // East Ilir middle avenue

  // Seberang Ulu arterials
  { x1: -265, z1: 116, x2: 265, z2: 116, w: 11.0, arterial: true },   // Jl. Jend. Ahmad Yani
  { x1: 0, z1: 114, x2: 0, z2: 248, w: 11.0, arterial: true },        // Jl. Gub. H. Bastari (Jakabaring)
  { x1: 120, z1: 116, x2: 120, z2: 235, w: 9.5, arterial: true },     // Musi IV South -> Plaju/Jakabaring
  { x1: -245, z1: 82, x2: 245, z2: 82, w: 8.0, arterial: false },     // Ulu Riverfront / 7 Ulu avenue
  { x1: -10, z1: 234, x2: 124, z2: 234, w: 8.0, arterial: false },    // Jakabaring South loop
  { x1: -245, z1: 176, x2: -24, z2: 176, w: 8.0, arterial: false },   // Kertapati West collector
  { x1: 122, z1: 176, x2: 255, z2: 176, w: 8.0, arterial: false },    // Plaju East collector
  // Seberang Ulu north-south collectors
  { x1: -180, z1: 58, x2: -180, z2: 232, w: 7.5, arterial: false },
  { x1: -124, z1: 58, x2: -124, z2: 232, w: 7.5, arterial: false },
  { x1: -44, z1: 82, x2: -44, z2: 232, w: 7.5, arterial: false },
  { x1: 52, z1: 68, x2: 52, z2: 136, w: 7.5, arterial: false },
  { x1: 178, z1: 82, x2: 178, z2: 232, w: 7.5, arterial: false },
  { x1: 230, z1: 82, x2: 230, z2: 232, w: 7.5, arterial: false },
];

function isClearForBuilding(x, z, hw, hd) {
  // Stay well clear of Sungai Musi + waterfront promenade
  const rb = getRiverBoundsAt(x);
  if (z + hd > rb.northEdgeZ - 9.5 && z - hd < rb.southEdgeZ + 9.5) return false;

  // Check landmark exclusion zones
  for (const box of EXCLUSION_BOXES) {
    if (x + hw > box.xMin && x - hw < box.xMax && z + hd > box.zMin && z - hd < box.zMax) {
      return false;
    }
  }

  // Check road segments (with sidewalk margin)
  for (const r of ROAD_SEGMENTS) {
    const pad = r.w / 2 + 2.2;
    const minX = Math.min(r.x1, r.x2) - pad;
    const maxX = Math.max(r.x1, r.x2) + pad;
    const minZ = Math.min(r.z1, r.z2) - pad;
    const maxZ = Math.max(r.z1, r.z2) + pad;
    if (x + hw > minX && x - hw < maxX && z + hd > minZ && z - hd < maxZ) {
      return false;
    }
  }
  return true;
}

function isClearForTree(x, z) {
  const rb = getRiverBoundsAt(x);
  if (z > rb.northEdgeZ - 6.0 && z < rb.southEdgeZ + 6.0) return false;
  for (const box of EXCLUSION_BOXES) {
    // Allow trees along Kambang Iwak outer edge only, handled explicitly
    if (x > box.xMin + 1 && x < box.xMax - 1 && z > box.zMin + 1 && z < box.zMax - 1) {
      return false;
    }
  }
  for (const r of ROAD_SEGMENTS) {
    const pad = r.w / 2 + 1.4;
    if (
      x > Math.min(r.x1, r.x2) - pad &&
      x < Math.max(r.x1, r.x2) + pad &&
      z > Math.min(r.z1, r.z2) - pad &&
      z < Math.max(r.z1, r.z2) + pad
    ) {
      return false;
    }
  }
  return true;
}

export function createUrbanFabric(scene, env) {
  const group = new THREE.Group();
  group.name = 'PalembangUrbanFabric';
  const rand = mulberry32(20261127);

  // --- 1. Urban Ground Zoning Pads (eliminating bare green lawn in urban districts) ---
  const commercialPadMat = new THREE.MeshStandardMaterial({ color: '#8f8c83', roughness: 0.94 });
  const residentialPadMat = new THREE.MeshStandardMaterial({ color: '#788469', roughness: 0.95 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: '#aba599', roughness: 0.9 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: '#393e46', roughness: 0.92 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: '#ebe4d1' });

  const zoningPads = [
    // Commercial core Seberang Ilir (Sudirman, Pasar 16 Ilir, Merdeka)
    { x: 58, z: -108, w: 230, d: 112, mat: commercialPadMat },
    { x: -158, z: -112, w: 196, d: 116, mat: commercialPadMat },
    // North Ilir residential neighborhoods (east of Kambang Iwak)
    { x: 76, z: -210, w: 344, d: 92, mat: residentialPadMat },
    { x: -232, z: -210, w: 72, d: 92, mat: residentialPadMat },
    // Seberang Ulu commercial (Jl. A. Yani) & dense neighborhoods
    { x: 0, z: 108, w: 505, d: 64, mat: commercialPadMat },
    { x: -140, z: 185, w: 230, d: 94, mat: residentialPadMat },
    { x: 186, z: 185, w: 145, d: 94, mat: residentialPadMat },
  ];

  for (const pad of zoningPads) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(pad.w, 0.08, pad.d), pad.mat);
    mesh.position.set(pad.x, GROUND_Y + 0.04, pad.z);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // --- 2. Connected Road Network + Sidewalks + Center Markings ---
  const dashPositions = [];
  for (const r of ROAD_SEGMENTS) {
    const dx = r.x2 - r.x1;
    const dz = r.z2 - r.z1;
    const len = Math.hypot(dx, dz);
    const cx = (r.x1 + r.x2) / 2;
    const cz = (r.z1 + r.z2) / 2;
    const horiz = Math.abs(dx) >= Math.abs(dz);

    // Subtle sidewalk border
    const sw = new THREE.Mesh(
      new THREE.BoxGeometry(horiz ? len + 2 : r.w + 2.4, 0.09, horiz ? r.w + 2.4 : len + 2),
      sidewalkMat
    );
    sw.position.set(cx, GROUND_Y + 0.06, cz);
    sw.receiveShadow = true;
    group.add(sw);

    // Asphalt carriageway
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(horiz ? len : r.w, 0.11, horiz ? r.w : len),
      asphaltMat
    );
    road.position.set(cx, GROUND_Y + 0.1, cz);
    road.receiveShadow = true;
    group.add(road);

    // Dashed markings on arterial roads
    if (r.arterial) {
      const steps = Math.floor(len / 9);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        dashPositions.push({
          x: r.x1 + dx * t,
          z: r.z1 + dz * t,
          horiz,
        });
      }
    }
  }

  // Instanced dashed road stripes
  const dashGeo = new THREE.BoxGeometry(3.2, 0.03, 0.24);
  const dashInst = new THREE.InstancedMesh(dashGeo, stripeMat, dashPositions.length);
  const dummy = new THREE.Object3D();
  dashPositions.forEach((d, idx) => {
    dummy.position.set(d.x, GROUND_Y + 0.17, d.z);
    dummy.rotation.set(0, d.horiz ? 0 : Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dashInst.setMatrixAt(idx, dummy.matrix);
  });
  dashInst.instanceMatrix.needsUpdate = true;
  group.add(dashInst);

  // --- 3. Dense Stylized Shophouses (Ruko) & Residential Houses via InstancedMesh ---
  const rukoList = [];
  const houseList = [];

  // Scan candidate grid across both Seberang Ilir & Seberang Ulu (-260..260, -252..246)
  for (let gx = -256; gx <= 256; gx += 13) {
    for (let gz = -248; gz <= 242; gz += 12) {
      const x = gx + (rand() - 0.5) * 3.4;
      const z = gz + (rand() - 0.5) * 3.0;

      // Determine district character (Commercial Ruko vs Residential)
      const nearSudirman = Math.abs(x) < 42 && z < -54 && z > -245;
      const nearPasar16 = x > 22 && x < 145 && z < -46 && z > -156;
      const nearMerdeka = x < -42 && x > -220 && z < -54 && z > -164;
      const nearAYani = Math.abs(z - 116) < 34 && Math.abs(x) < 235;
      const isCommercial = nearSudirman || nearPasar16 || nearMerdeka || nearAYani;

      if (isCommercial) {
        const w = 7.2 + rand() * 5.2;
        const d = 6.8 + rand() * 4.6;
        if (!isClearForBuilding(x, z, w / 2 + 0.8, d / 2 + 0.8)) continue;
        // Taller commercial skyline along Sudirman & Pasar 16 Ilir
        const heightBoost = nearSudirman ? 7.5 : nearPasar16 ? 4.5 : 1.5;
        const h = 6.2 + rand() * 7.8 + heightBoost * rand();
        rukoList.push({ x, z, w, d, h });
      } else {
        // Dense Palembang pitched-roof residential fabric
        const w = 5.4 + rand() * 3.2;
        const d = 4.8 + rand() * 2.8;
        if (!isClearForBuilding(x, z, w / 2 + 0.7, d / 2 + 0.7)) continue;
        // Slight organic skip in far corners so trees can breathe
        if (Math.hypot(x * 0.7, z) > 255 && rand() > 0.65) continue;
        const h = 3.4 + rand() * 2.6;
        houseList.push({ x, z, w, d, h, rotY: rand() > 0.5 ? 0 : Math.PI / 2 });
      }
    }
  }

  // Materials for instanced buildings (MeshStandardMaterial supports per-instance color tinting)
  const rukoBodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.84 });
  const rukoRoofMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffe29c',
    emissive: '#ffaa38',
    emissiveIntensity: 0.14,
    roughness: 0.4,
  });

  const rukoColors = ['#e4dcd0', '#d5cbbd', '#c7cfd4', '#dfd1bd', '#c8c3b9', '#d2dadf'];
  const roofColors = ['#9c4a35', '#4b5f70', '#707478', '#8c3f2e', '#58695e'];

  // Ruko body + parapet roof + glowing window ribbon
  const rukoBodyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rukoBodyMat, rukoList.length);
  const rukoRoofInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rukoRoofMat, rukoList.length);
  const rukoWinInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), windowGlowMat, rukoList.length);
  rukoBodyInst.castShadow = true;
  rukoBodyInst.receiveShadow = true;

  const tmpColor = new THREE.Color();
  rukoList.forEach((b, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(b.x, GROUND_Y + b.h / 2 - 0.15, b.z);
    dummy.scale.set(b.w, b.h, b.d);
    dummy.updateMatrix();
    rukoBodyInst.setMatrixAt(i, dummy.matrix);
    rukoBodyInst.setColorAt(i, tmpColor.set(rukoColors[i % rukoColors.length]));

    dummy.position.set(b.x, GROUND_Y + b.h + 0.18, b.z);
    dummy.scale.set(b.w + 0.45, 0.55, b.d + 0.45);
    dummy.updateMatrix();
    rukoRoofInst.setMatrixAt(i, dummy.matrix);
    rukoRoofInst.setColorAt(i, tmpColor.set(roofColors[i % roofColors.length]));

    // Warm window strip at mid-upper facade
    dummy.position.set(b.x, GROUND_Y + b.h * 0.62, b.z);
    dummy.scale.set(b.w + 0.14, Math.min(2.2, b.h * 0.28), b.d + 0.14);
    dummy.updateMatrix();
    rukoWinInst.setMatrixAt(i, dummy.matrix);
  });
  rukoBodyInst.instanceMatrix.needsUpdate = true;
  if (rukoBodyInst.instanceColor) rukoBodyInst.instanceColor.needsUpdate = true;
  rukoRoofInst.instanceMatrix.needsUpdate = true;
  if (rukoRoofInst.instanceColor) rukoRoofInst.instanceColor.needsUpdate = true;
  rukoWinInst.instanceMatrix.needsUpdate = true;

  group.add(rukoBodyInst, rukoRoofInst, rukoWinInst);

  // Residential houses (body + pitched 4-sided hip/limas roof)
  const houseBodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.88 });
  const houseRoofMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82 });
  const houseColors = ['#e8dfd1', '#d9cebe', '#cfbfb0', '#dce2d8', '#e5d4be'];
  const houseRoofColors = ['#a64c34', '#8e3f2c', '#5e4c41', '#4f6272', '#b35b3d'];

  const houseBodyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), houseBodyMat, houseList.length);
  const houseRoofGeo = new THREE.ConeGeometry(0.76, 1, 4);
  houseRoofGeo.rotateY(Math.PI / 4);
  const houseRoofInst = new THREE.InstancedMesh(houseRoofGeo, houseRoofMat, houseList.length);
  houseBodyInst.castShadow = true;
  houseBodyInst.receiveShadow = true;

  houseList.forEach((h, i) => {
    dummy.rotation.set(0, h.rotY, 0);
    dummy.position.set(h.x, GROUND_Y + h.h / 2 - 0.15, h.z);
    dummy.scale.set(h.w, h.h, h.d);
    dummy.updateMatrix();
    houseBodyInst.setMatrixAt(i, dummy.matrix);
    houseBodyInst.setColorAt(i, tmpColor.set(houseColors[i % houseColors.length]));

    const roofH = 1.6 + (i % 3) * 0.35;
    dummy.position.set(h.x, GROUND_Y + h.h + roofH / 2 - 0.18, h.z);
    dummy.scale.set(h.w * 1.12, roofH, h.d * 1.12);
    dummy.updateMatrix();
    houseRoofInst.setMatrixAt(i, dummy.matrix);
    houseRoofInst.setColorAt(i, tmpColor.set(houseRoofColors[i % houseRoofColors.length]));
  });
  houseBodyInst.instanceMatrix.needsUpdate = true;
  if (houseBodyInst.instanceColor) houseBodyInst.instanceColor.needsUpdate = true;
  houseRoofInst.instanceMatrix.needsUpdate = true;
  if (houseRoofInst.instanceColor) houseRoofInst.instanceColor.needsUpdate = true;

  group.add(houseBodyInst, houseRoofInst);

  // --- 4. Lush Tropical Trees & Greenbelt Perimeter Framing (InstancedMesh) ---
  const treeList = [];

  // 4a. Ring of shade trees around Taman Kambang Iwak
  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2;
    const rx = 40 + (i % 2) * 3.2;
    const rz = 24.5 + (i % 2) * 2.2;
    treeList.push({
      x: -148 + Math.cos(ang) * rx,
      z: -206 + Math.sin(ang) * rz,
      s: 1.05 + rand() * 0.55,
    });
  }

  // 4b. Trees lining main avenues & riverfront parks
  for (let x = -255; x <= 255; x += 14) {
    const rb = getRiverBoundsAt(x);
    for (const tz of [rb.northEdgeZ - 8.5, rb.southEdgeZ + 8.5, -150, -166, 108, 124]) {
      const tx = x + (rand() - 0.5) * 3.5;
      if (isClearForTree(tx, tz)) {
        treeList.push({ x: tx, z: tz, s: 0.9 + rand() * 0.45 });
      }
    }
  }

  // 4c. Dense tropical greenbelt forest framing outer perimeter (eliminating bare outer green planes)
  for (let gx = -445; gx <= 445; gx += 15) {
    for (let gz = -272; gz <= 272; gz += 15) {
      const inOuterEdge = Math.abs(gx) > 258 || Math.abs(gz) > 236;
      if (!inOuterEdge) continue;
      const x = gx + (rand() - 0.5) * 9;
      const z = gz + (rand() - 0.5) * 9;
      const rb = getRiverBoundsAt(x);
      if (z > rb.northEdgeZ - 7 && z < rb.southEdgeZ + 7) continue;
      if (rand() < 0.78) {
        treeList.push({ x, z, s: 1.35 + rand() * 1.05 });
      }
    }
  }

  // 4d. Pocket trees inside neighborhood gaps
  for (let i = 0; i < 160; i++) {
    const x = (rand() - 0.5) * 510;
    const z = (rand() - 0.5) * 480;
    if (isClearForBuilding(x, z, 2.2, 2.2)) {
      treeList.push({ x, z, s: 0.85 + rand() * 0.55 });
    }
  }

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c3f28', roughness: 0.92 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.88 });
  const foliageTones = ['#2d6435', '#39733f', '#478246', '#26562e', '#3f7c43'];

  const trunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.3, 2.4, 5), trunkMat, treeList.length);
  const canopyInst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.75, 1), foliageMat, treeList.length);
  canopyInst.castShadow = true;

  treeList.forEach((tr, i) => {
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.position.set(tr.x, GROUND_Y + 1.15 * tr.s - 0.1, tr.z);
    dummy.scale.setScalar(tr.s);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tr.x, GROUND_Y + 2.9 * tr.s - 0.1, tr.z);
    dummy.scale.set(tr.s * 1.05, tr.s * 0.92, tr.s * 1.05);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(i, dummy.matrix);
    canopyInst.setColorAt(i, tmpColor.set(foliageTones[i % foliageTones.length]));
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;

  group.add(trunkInst, canopyInst);

  // --- 5. Arterial Streetlamps via InstancedMesh (glowing at Senja & Malam) ---
  const lampCoords = [];
  for (let z = -250; z <= -146; z += 18) lampCoords.push([-6.8, z], [6.8, z]);
  for (let z = 126; z <= 238; z += 18) lampCoords.push([-6.5, z], [6.5, z]);
  for (let x = -245; x <= 245; x += 22) {
    if (Math.abs(x) > 16 && Math.abs(x - 120) > 12) {
      lampCoords.push([x, -152.2], [x, 109.8]);
    }
  }

  const poleMat = new THREE.MeshStandardMaterial({ color: '#4c525c', roughness: 0.75 });
  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: '#fff1cc',
    emissive: '#ffbc4d',
    emissiveIntensity: 0.2,
  });

  const poleInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 5), poleMat, lampCoords.length);
  const bulbInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.24, 6, 6), lampGlowMat, lampCoords.length);

  lampCoords.forEach(([lx, lz], i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(lx, GROUND_Y + 2.1, lz);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, GROUND_Y + 4.3, lz);
    dummy.updateMatrix();
    bulbInst.setMatrixAt(i, dummy.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  group.add(poleInst, bulbInst);

  // --- 6. Animated Urban Avenue Traffic (Sudirman, Kolonel Atmo, Ahmad Yani, Bastari) ---
  const roadCars = [];
  const roadCarSpecs = [
    // Jl. Jend. Sudirman North
    { axis: 'z', fixed: 2.2, min: -255, max: -144, dir: 1, speed: 15, count: 4 },
    { axis: 'z', fixed: -2.2, min: -255, max: -144, dir: -1, speed: 14, count: 4 },
    // Jl. Kolonel Atmo (East-West Ilir)
    { axis: 'x', fixed: -155.8, min: -245, max: 245, dir: 1, speed: 16, count: 6 },
    { axis: 'x', fixed: -160.2, min: -245, max: 245, dir: -1, speed: 15, count: 6 },
    // Jl. Jend. Ahmad Yani (East-West Ulu)
    { axis: 'x', fixed: 118.4, min: -245, max: 245, dir: 1, speed: 17, count: 6 },
    { axis: 'x', fixed: 113.6, min: -245, max: 245, dir: -1, speed: 16, count: 6 },
    // Jl. Gub. H. Bastari (Jakabaring Boulevard)
    { axis: 'z', fixed: 2.2, min: 122, max: 238, dir: 1, speed: 14, count: 4 },
    { axis: 'z', fixed: -2.2, min: 122, max: 238, dir: -1, speed: 14, count: 4 },
  ];

  const carPalette = ['#f2eee6', '#d69f38', '#335c81', '#c84b31', '#2d8a6e', '#e3e7ec'];
  for (const spec of roadCarSpecs) {
    for (let i = 0; i < spec.count; i++) {
      const span = spec.max - spec.min;
      const pos = spec.min + (i / spec.count) * span + rand() * 8;
      roadCars.push({
        axis: spec.axis,
        fixed: spec.fixed,
        min: spec.min,
        max: spec.max,
        pos,
        dir: spec.dir,
        speed: spec.speed + (i % 3) * 1.8,
        color: carPalette[(roadCars.length) % carPalette.length],
      });
    }
  }

  const carBodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
  const carInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.78, 2.45), carBodyMat, roadCars.length);
  carInst.castShadow = true;
  roadCars.forEach((c, i) => {
    carInst.setColorAt(i, tmpColor.set(c.color));
  });
  if (carInst.instanceColor) carInst.instanceColor.needsUpdate = true;
  group.add(carInst);

  env.onLightingChange((cfg) => {
    windowGlowMat.emissiveIntensity = 0.14 + cfg.nightGlow * 2.15;
    lampGlowMat.emissiveIntensity = 0.2 + cfg.nightGlow * 2.7;
  });

  scene.add(group);

  return {
    group,
    stats: {
      rukoCount: rukoList.length,
      houseCount: houseList.length,
      treeCount: treeList.length,
      lampCount: lampCoords.length,
      roadCarCount: roadCars.length,
    },
    update(elapsed, delta) {
      for (let i = 0; i < roadCars.length; i++) {
        const c = roadCars[i];
        c.pos += c.dir * c.speed * delta;
        if (c.pos > c.max) c.pos = c.min;
        if (c.pos < c.min) c.pos = c.max;

        if (c.axis === 'x') {
          dummy.position.set(c.pos, GROUND_Y + 0.56, c.fixed);
          dummy.rotation.set(0, Math.PI / 2, 0);
        } else {
          dummy.position.set(c.fixed, GROUND_Y + 0.56, c.pos);
          dummy.rotation.set(0, 0, 0);
        }
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        carInst.setMatrixAt(i, dummy.matrix);
      }
      carInst.instanceMatrix.needsUpdate = true;
    },
  };
}
