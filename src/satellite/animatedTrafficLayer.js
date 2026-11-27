import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import pathData from './data/palembang-paths.json';
import { HERO_BRIDGE_SPECS } from './heroLandmarksLayer.js';

// Central Palembang anchor (Ampera Bridge) — local tangent meters stay within ±15 km (zero Float32 jitter)
const ANCHOR_LNGLAT = [104.76340, -2.99194];
const CORE_CENTER = [104.7634, -2.9915];

// Deterministic PRNG so traffic layout is rich, natural, and reproducible across sessions
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

// Soft aerial V-shaped boat wake texture (flat on water surface, zero hard polygon edges)
function createWakeTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 256);

  // Soft fading foam centerwash
  const wash = ctx.createLinearGradient(0, 0, 0, 256);
  wash.addColorStop(0, 'rgba(240, 250, 255, 0.72)');
  wash.addColorStop(0.35, 'rgba(225, 244, 255, 0.34)');
  wash.addColorStop(1, 'rgba(220, 240, 255, 0.0)');
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.moveTo(64, 4);
  ctx.lineTo(106, 252);
  ctx.lineTo(22, 252);
  ctx.closePath();
  ctx.fill();

  // Crisp twin Kelvin V-wake arms
  for (const side of [-1, 1]) {
    const arm = ctx.createLinearGradient(64, 4, 64 + side * 56, 245);
    arm.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    arm.addColorStop(0.5, 'rgba(235, 248, 255, 0.38)');
    arm.addColorStop(1, 'rgba(235, 248, 255, 0.0)');
    ctx.strokeStyle = arm;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 6);
    ctx.quadraticCurveTo(64 + side * 24, 110, 64 + side * 54, 244);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Soft radial light pool texture for night/dusk headlights & taillights
function createLightPoolTexture(r, g, b) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
  grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.42)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function projectToLocal(anchor, meterScale, lng, lat) {
  const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  return {
    x: (mc.x - anchor.x) / meterScale,
    z: (mc.y - anchor.y) / meterScale,
  };
}

function buildPolyline(anchor, meterScale, flatLngLat, filterRange) {
  const pts = [];
  for (let i = 0; i < flatLngLat.length; i += 2) {
    const lng = flatLngLat[i];
    const lat = flatLngLat[i + 1];
    if (filterRange) {
      if (lng < filterRange.minLng || lng > filterRange.maxLng || lat < filterRange.minLat || lat > filterRange.maxLat) {
        continue;
      }
    }
    const p = projectToLocal(anchor, meterScale, lng, lat);
    pts.push({ x: p.x, z: p.z, lng, lat, dist: 0 });
  }
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pts[i].dist = total;
  }
  return { pts, total };
}

function samplePolyline(poly, dist) {
  const { pts, total } = poly;
  if (pts.length < 2 || total <= 0) return { x: 0, z: 0, fx: 0, fz: 1, lng: ANCHOR_LNGLAT[0], lat: ANCHOR_LNGLAT[1] };
  const d = Math.max(0, Math.min(total, dist));
  let lo = 0;
  let hi = pts.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].dist <= d) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  const segLen = Math.max(0.001, b.dist - a.dist);
  const t = (d - a.dist) / segLen;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const inv = 1 / Math.max(0.001, Math.hypot(dx, dz));
  return {
    x: a.x + dx * t,
    z: a.z + dz * t,
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
    fx: dx * inv,
    fz: dz * inv,
  };
}

// Compute exact bridge deck elevation & road slope if (x, z) lies on a 3D hero bridge corridor
function prepareHeroBridges(anchor, meterScale) {
  return HERO_BRIDGE_SPECS.map((b) => {
    const c = projectToLocal(anchor, meterScale, b.lngLat[0], b.lngLat[1]);
    const theta = Math.PI - THREE.MathUtils.degToRad(b.bearingDeg);
    // Matches heroLandmarksLayer.js: local +Z = (sin(theta), cos(theta)), local +X = (cos(theta), -sin(theta))
    const fwdX = Math.sin(theta);
    const fwdZ = Math.cos(theta);
    const rightX = Math.cos(theta);
    const rightZ = -Math.sin(theta);
    return { ...b, cx: c.x, cz: c.z, fwdX, fwdZ, rightX, rightZ, baseElev: 0 };
  });
}

function queryBridgeDeck(bridges, x, z, dirX, dirZ) {
  for (const b of bridges) {
    const rx = x - b.cx;
    const rz = z - b.cz;
    const localX = rx * b.rightX + rz * b.rightZ;
    const localZ = rx * b.fwdX + rz * b.fwdZ;
    const maxZ = b.spanHalf + b.rampLen;
    if (Math.abs(localX) <= b.roadHalfWidth + 6.5 && Math.abs(localZ) <= maxZ) {
      const absZ = Math.abs(localZ);
      let deckY;
      let dYdLocalZ = 0;
      if (absZ <= b.spanHalf) {
        deckY = b.roadTop;
      } else {
        const u = (absZ - b.spanHalf) / b.rampLen;
        deckY = b.roadTop * (1 - u) + 0.15 * u;
        const slopeMag = (b.roadTop - 0.15) / b.rampLen;
        dYdLocalZ = localZ > 0 ? -slopeMag : slopeMag;
      }
      const alongBridge = dirX * b.fwdX + dirZ * b.fwdZ;
      return {
        onBridge: true,
        y: b.baseElev + deckY,
        slope: dYdLocalZ * alongBridge,
      };
    }
  }
  return null;
}

// Build directed road graph from baked OSM nodes + edges
function buildRoadGraph(anchor, meterScale) {
  const flat = pathData.nodes;
  const nodeCount = flat.length / 2;
  const nodes = new Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    const lng = flat[i * 2];
    const lat = flat[i * 2 + 1];
    const p = projectToLocal(anchor, meterScale, lng, lat);
    nodes[i] = { x: p.x, z: p.z, lng, lat, elev: 0, elevCached: false };
  }

  // Directed half-edges so vehicles traverse both directions on two-way roads and stay legal on one-ways
  const dirEdges = [];
  const outgoing = new Map();

  function addDirEdge(cls, flags, nodeIds, isTwoWay) {
    if (nodeIds.length < 2) return;
    const cumDist = [0];
    let total = 0;
    for (let i = 1; i < nodeIds.length; i++) {
      const a = nodes[nodeIds[i - 1]];
      const b = nodes[nodeIds[i]];
      total += Math.hypot(b.x - a.x, b.z - a.z);
      cumDist.push(total);
    }
    if (total < 12) return;

    const firstA = nodes[nodeIds[0]];
    const firstB = nodes[nodeIds[1]];
    const fLen = Math.max(0.001, Math.hypot(firstB.x - firstA.x, firstB.z - firstA.z));
    const startDirX = (firstB.x - firstA.x) / fLen;
    const startDirZ = (firstB.z - firstA.z) / fLen;

    const lastA = nodes[nodeIds[nodeIds.length - 2]];
    const lastB = nodes[nodeIds[nodeIds.length - 1]];
    const lLen = Math.max(0.001, Math.hypot(lastB.x - lastA.x, lastB.z - lastA.z));
    const endDirX = (lastB.x - lastA.x) / lLen;
    const endDirZ = (lastB.z - lastA.z) / lLen;

    const midNode = nodes[nodeIds[nodeIds.length >> 1]];
    const distFromCore = Math.hypot(midNode.lng - CORE_CENTER[0], midNode.lat - CORE_CENTER[1]);

    const id = dirEdges.length;
    dirEdges.push({
      id,
      cls,
      flags,
      isTwoWay,
      nodeIds,
      cumDist,
      total,
      startNode: nodeIds[0],
      endNode: nodeIds[nodeIds.length - 1],
      startDirX,
      startDirZ,
      endDirX,
      endDirZ,
      distFromCore,
    });
    if (!outgoing.has(nodeIds[0])) outgoing.set(nodeIds[0], []);
    outgoing.get(nodeIds[0]).push(id);
  }

  for (const e of pathData.edges) {
    const cls = e[0];
    const flags = e[1];
    const oneway = Boolean(flags & 1);
    const ids = e.slice(2);
    addDirEdge(cls, flags, ids, !oneway);
    if (!oneway) {
      addDirEdge(cls, flags, ids.slice().reverse(), true);
    }
  }

  return { nodes, dirEdges, outgoing };
}

function sampleRoadEdge(graph, edge, dist) {
  const { nodeIds, cumDist, total } = edge;
  const d = Math.max(0, Math.min(total, dist));
  let lo = 0;
  let hi = cumDist.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cumDist[mid] <= d) lo = mid;
    else hi = mid;
  }
  const a = graph.nodes[nodeIds[lo]];
  const b = graph.nodes[nodeIds[hi]];
  const segLen = Math.max(0.001, cumDist[hi] - cumDist[lo]);
  const t = (d - cumDist[lo]) / segLen;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const inv = 1 / Math.max(0.001, Math.hypot(dx, dz));
  return {
    x: a.x + dx * t,
    z: a.z + dz * t,
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
    fx: dx * inv,
    fz: dz * inv,
    nodeA: a,
    nodeB: b,
    t,
  };
}

// Compute elevated LRT viaduct height: ~10.2m over land, arching cleanly to ~17.5m over Sungai Musi
function computeLrtElevation(lng, lat, terrainElev, amperaBaseElev) {
  // Musi crossing along LRT is centered near [104.7638, -2.9918] (~220m half-span)
  const dLng = (lng - 104.7638) * 111000;
  const dLat = (lat - -2.9918) * 111000;
  const dRiver = Math.hypot(dLng, dLat);
  const riverBlend = Math.max(0, Math.min(1, 1 - (dRiver - 160) / 180));
  const smooth = riverBlend * riverBlend * (3 - 2 * riverBlend);
  const landH = terrainElev + 10.2;
  const riverH = amperaBaseElev + 17.5;
  return landH * (1 - smooth) + riverH * smooth;
}

// Build lightweight 3D elevated concrete viaduct along central Palembang LRT showcase corridor
function buildLrtViaductMesh(lrtPoly, mats) {
  const group = new THREE.Group();
  const { pts } = lrtPoly;
  // Showcase corridor from Jakabaring (~-3.025) across Musi/Ampera/Masjid Agung to Cinde/Dishub (~-2.968)
  const startIdx = pts.findIndex((p) => p.lat > -3.026);
  const endIdx = pts.findIndex((p) => p.lat > -2.968);
  const i0 = Math.max(0, startIdx === -1 ? 0 : startIdx);
  const i1 = endIdx === -1 ? pts.length - 1 : Math.min(pts.length - 1, endIdx);
  if (i1 - i0 < 4) return { group, updateElevations: () => {} };

  // Resample every ~24m for crisp smooth deck + regular viaduct piers
  const samples = [];
  const dStart = pts[i0].dist;
  const dEnd = pts[i1].dist;
  const step = 24;
  for (let d = dStart; d <= dEnd; d += step) {
    samples.push(samplePolyline(lrtPoly, d));
  }

  const deckGeo = new THREE.BoxGeometry(6.8, 1.35, 1);
  const parapetGeo = new THREE.BoxGeometry(0.45, 0.9, 1);
  const pierGeo = new THREE.CylinderGeometry(1.05, 1.3, 1, 8);
  const capGeo = new THREE.BoxGeometry(6.4, 1.1, 2.2);

  const segCount = samples.length - 1;
  const deckInst = new THREE.InstancedMesh(deckGeo, mats.viaductConcrete, segCount);
  const leftParapet = new THREE.InstancedMesh(parapetGeo, mats.viaductTrim, segCount);
  const rightParapet = new THREE.InstancedMesh(parapetGeo, mats.viaductTrim, segCount);
  deckInst.frustumCulled = false;
  leftParapet.frustumCulled = false;
  rightParapet.frustumCulled = false;

  const pierIndices = [];
  for (let i = 0; i < samples.length; i += 2) {
    // Skip piers right in the middle of the main Musi shipping channel
    const s = samples[i];
    const dMusi = Math.hypot((s.lng - 104.7638) * 111000, (s.lat - -2.9918) * 111000);
    if (dMusi < 75) continue;
    pierIndices.push(i);
  }
  const pierInst = new THREE.InstancedMesh(pierGeo, mats.viaductPier, pierIndices.length);
  const capInst = new THREE.InstancedMesh(capGeo, mats.viaductConcrete, pierIndices.length);
  pierInst.frustumCulled = false;
  capInst.frustumCulled = false;

  group.add(deckInst, leftParapet, rightParapet, pierInst, capInst);

  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';

  function updateElevations(queryTerrain, amperaBaseElev) {
    const heights = samples.map((s) => {
      const te = queryTerrain(s.lng, s.lat);
      return { te, y: computeLrtElevation(s.lng, s.lat, te, amperaBaseElev) };
    });

    for (let i = 0; i < segCount; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      const ha = heights[i].y;
      const hb = heights[i + 1].y;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dy = hb - ha;
      const horiz = Math.max(0.001, Math.hypot(dx, dz));
      const len = Math.hypot(horiz, dy) + 0.35;
      const yaw = Math.atan2(dx, dz);
      const pitch = -Math.atan(dy / horiz);
      const mx = (a.x + b.x) * 0.5;
      const mz = (a.z + b.z) * 0.5;
      const my = (ha + hb) * 0.5;

      dummy.position.set(mx, my - 0.72, mz);
      dummy.rotation.set(pitch, yaw, 0);
      dummy.scale.set(1, 1, len);
      dummy.updateMatrix();
      deckInst.setMatrixAt(i, dummy.matrix);

      // Left and right parapets (offset perpendicular to track)
      const lx = dz / horiz;
      const lz = -dx / horiz;
      dummy.position.set(mx + lx * 3.2, my + 0.12, mz + lz * 3.2);
      dummy.scale.set(1, 1, len);
      dummy.updateMatrix();
      leftParapet.setMatrixAt(i, dummy.matrix);

      dummy.position.set(mx - lx * 3.2, my + 0.12, mz - lz * 3.2);
      dummy.scale.set(1, 1, len);
      dummy.updateMatrix();
      rightParapet.setMatrixAt(i, dummy.matrix);
    }

    for (let k = 0; k < pierIndices.length; k++) {
      const idx = pierIndices[k];
      const s = samples[idx];
      const { te, y } = heights[idx];
      const colH = Math.max(3, y - te - 1.4);
      const yaw = Math.atan2(s.fx, s.fz);

      dummy.position.set(s.x, te + colH * 0.5, s.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, colH, 1);
      dummy.updateMatrix();
      pierInst.setMatrixAt(k, dummy.matrix);

      dummy.position.set(s.x, y - 1.85, s.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      capInst.setMatrixAt(k, dummy.matrix);
    }

    deckInst.instanceMatrix.needsUpdate = true;
    leftParapet.instanceMatrix.needsUpdate = true;
    rightParapet.instanceMatrix.needsUpdate = true;
    pierInst.instanceMatrix.needsUpdate = true;
    capInst.instanceMatrix.needsUpdate = true;
  }

  return { group, updateElevations };
}

export function createAnimatedTrafficLayer() {
  const rand = mulberry32(20260717);
  const anchor = maplibregl.MercatorCoordinate.fromLngLat(ANCHOR_LNGLAT, 0);
  const meterScale = anchor.meterInMercatorCoordinateUnits();
  const bridges = prepareHeroBridges(anchor, meterScale);
  const graph = buildRoadGraph(anchor, meterScale);

  // Real LRT main line (DJKA/Jakabaring <-> Ampera <-> Cinde <-> Bandara SMB II)
  const lrtPoly = buildPolyline(anchor, meterScale, pathData.lrt[0]);
  // Real Sungai Musi urban Palembang corridor (from Gandus/Kertapati past BKB, Ampera, Musi IV, Pulau Kemaro)
  const riverPoly = buildPolyline(anchor, meterScale, pathData.river[0], {
    minLng: 104.722,
    maxLng: 104.838,
    minLat: -3.025,
    maxLat: -2.960,
  });

  // --- Shared Materials ---
  const wakeTex = createWakeTexture();
  const headGlowTex = createLightPoolTexture(255, 232, 178);
  const tailGlowTex = createLightPoolTexture(255, 48, 36);

  const mats = {
    carBody: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.4 }),
    carCabin: new THREE.MeshStandardMaterial({ color: '#1b2430', roughness: 0.25, metalness: 0.65 }),
    headlight: new THREE.MeshStandardMaterial({
      color: '#fff9e6',
      emissive: '#ffe9b8',
      emissiveIntensity: 0.8,
      roughness: 0.2,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: '#ff3b2f',
      emissive: '#ff1f14',
      emissiveIntensity: 0.75,
      roughness: 0.2,
    }),
    headlightGlow: new THREE.MeshBasicMaterial({
      map: headGlowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    taillightGlow: new THREE.MeshBasicMaterial({
      map: tailGlowTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    lrtBody: new THREE.MeshStandardMaterial({ color: '#f1f4f8', roughness: 0.28, metalness: 0.45 }),
    lrtStripe: new THREE.MeshStandardMaterial({ color: '#c92a2a', roughness: 0.38, metalness: 0.25 }),
    lrtWindow: new THREE.MeshStandardMaterial({
      color: '#233245',
      emissive: '#ffc96e',
      emissiveIntensity: 0.15,
      roughness: 0.2,
    }),
    viaductConcrete: new THREE.MeshStandardMaterial({ color: '#c9c4ba', roughness: 0.82 }),
    viaductTrim: new THREE.MeshStandardMaterial({ color: '#dfd9ce', roughness: 0.76 }),
    viaductPier: new THREE.MeshStandardMaterial({ color: '#b4afa4', roughness: 0.88 }),
    boatHull: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.58 }),
    boatCanopy: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65 }),
    bargeHull: new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.72, metalness: 0.3 }),
    coalHeap: new THREE.MeshStandardMaterial({ color: '#181a1d', roughness: 0.95 }),
    tugHull: new THREE.MeshStandardMaterial({ color: '#b83227', roughness: 0.55 }),
    tugCabin: new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.5 }),
    wakeFoam: new THREE.MeshBasicMaterial({
      map: wakeTex,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
    boatLantern: new THREE.MeshStandardMaterial({
      color: '#ffebb8',
      emissive: '#ffb84d',
      emissiveIntensity: 0.5,
    }),
  };

  // --- Scene & Lights ---
  const scene = new THREE.Scene();
  const amb = new THREE.AmbientLight('#ffffff', 0.9);
  const sun = new THREE.DirectionalLight('#fff5de', 1.8);
  sun.position.set(120, 190, 90);
  const fill = new THREE.DirectionalLight('#9cc6ea', 0.55);
  fill.position.set(-100, 70, -80);
  scene.add(amb, sun, fill);

  // --- 1. Elevated LRT Viaduct (Central Showcase Corridor) ---
  const viaduct = buildLrtViaductMesh(lrtPoly, mats);
  scene.add(viaduct.group);

  // --- 2. Road Vehicles (240 city vehicles + 36 dedicated bridge stream vehicles) ---
  const CAR_PALETTE = [
    '#f4f5f7', '#d8dde3', '#9aa4b0', '#2b313a', '#1b2028',
    '#c6362c', '#2d5a9e', '#3c6e5c', '#d49a2a', '#6d7885',
  ];
  const BUS_PALETTE = ['#2b6cb0', '#d97706', '#dc2626', '#f3f4f6', '#0f766e'];

  // Weight spawn edges strongly toward core Palembang & major arteries
  const spawnCandidates = [];
  let totalWeight = 0;
  for (const e of graph.dirEdges) {
    if (e.total < 25) continue;
    const inCore = e.distFromCore < 0.042;
    const nearCenter = e.distFromCore < 0.018;
    const classW = e.cls === 0 ? 4.5 : e.cls === 1 ? 3.2 : e.cls === 2 ? 2.2 : e.cls === 3 ? 1.1 : 0.7;
    const areaW = nearCenter ? 5.0 : inCore ? 2.4 : 0.35;
    const w = classW * areaW * Math.min(e.total / 120, 3.0);
    totalWeight += w;
    spawnCandidates.push({ edge: e, cumWeight: totalWeight });
  }

  function pickWeightedEdge() {
    const r = rand() * totalWeight;
    let lo = 0;
    let hi = spawnCandidates.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (spawnCandidates[mid].cumWeight < r) lo = mid + 1;
      else hi = mid;
    }
    return spawnCandidates[lo].edge;
  }

  const CITY_VEHICLE_COUNT = 280;
  const BRIDGE_VEHICLE_COUNT = 40;
  const TOTAL_VEHICLES = CITY_VEHICLE_COUNT + BRIDGE_VEHICLE_COUNT;
  const vehicles = [];

  for (let i = 0; i < CITY_VEHICLE_COUNT; i++) {
    const edge = pickWeightedEdge();
    const isHeavy = rand() < 0.16;
    vehicles.push({
      kind: 'city',
      edge,
      dist: rand() * edge.total,
      speed: isHeavy ? 8.5 + rand() * 3.5 : 10.5 + rand() * 5.8, // m/s (~32-58 km/h)
      len: isHeavy ? 9.2 : 5.2,
      wid: isHeavy ? 2.55 : 2.15,
      ht: isHeavy ? 3.05 : 1.72,
      isHeavy,
      laneOffset: edge.isTwoWay ? 2.2 + (rand() - 0.5) * 0.5 : (rand() < 0.5 ? -1.9 : 1.9),
      color: new THREE.Color(
        isHeavy ? BUS_PALETTE[Math.floor(rand() * BUS_PALETTE.length)] : CAR_PALETTE[Math.floor(rand() * CAR_PALETTE.length)]
      ),
    });
  }

  // Dedicated continuous bridge streams across Ampera (22 vehicles) and Musi IV (18 vehicles)
  for (let i = 0; i < BRIDGE_VEHICLE_COUNT; i++) {
    const bIdx = i < 22 ? 0 : 1;
    const b = bridges[bIdx];
    const dir = i % 2 === 0 ? 1 : -1;
    const laneSlot = Math.floor(i / 2) % 2; // 2 lanes per direction
    const isHeavy = rand() < 0.14;
    const maxZ = b.spanHalf + b.rampLen - 6;
    vehicles.push({
      kind: 'bridge',
      bridgeIdx: bIdx,
      dir,
      localZ: -maxZ + rand() * (maxZ * 2),
      // Indonesian left-hand traffic: when moving +fwdZ, left is +localX or -localX?
      // Check: rightX = cos(t), rightZ = -sin(t); fwdX = sin(t), fwdZ = cos(t).
      // Left-of-forward L = (fwdZ, -fwdX) = (cos(t), -sin(t)) = +right!
      // So dir=+1 drives on +localX, dir=-1 drives on -localX.
      localX: dir * (2.5 + laneSlot * 3.2),
      speed: isHeavy ? 10 + rand() * 3 : 12.5 + rand() * 4.5,
      len: isHeavy ? 9.2 : 5.2,
      wid: isHeavy ? 2.55 : 2.15,
      ht: isHeavy ? 3.05 : 1.72,
      isHeavy,
      color: new THREE.Color(
        isHeavy ? BUS_PALETTE[Math.floor(rand() * BUS_PALETTE.length)] : CAR_PALETTE[Math.floor(rand() * CAR_PALETTE.length)]
      ),
    });
  }

  // Instanced vehicle parts (6 draw calls for all 276 vehicles!)
  const carBodyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.58, 1), mats.carBody, TOTAL_VEHICLES);
  const carCabinInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.84, 0.45, 0.56), mats.carCabin, TOTAL_VEHICLES);
  const carHeadInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.76, 0.22, 0.14), mats.headlight, TOTAL_VEHICLES);
  const carTailInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.76, 0.22, 0.14), mats.taillight, TOTAL_VEHICLES);
  const carHeadGlowInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.5, 13.5), mats.headlightGlow, TOTAL_VEHICLES);
  const carTailGlowInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.4, 7.5), mats.taillightGlow, TOTAL_VEHICLES);

  for (const inst of [carBodyInst, carCabinInst, carHeadInst, carTailInst, carHeadGlowInst, carTailGlowInst]) {
    inst.frustumCulled = false;
    scene.add(inst);
  }
  for (let i = 0; i < TOTAL_VEHICLES; i++) {
    carBodyInst.setColorAt(i, vehicles[i].color);
  }
  carBodyInst.instanceColor.needsUpdate = true;

  // --- 3. Animated South Sumatra LRT Trains (6 three-car articulated trainsets = 18 cars) ---
  const LRT_TRAIN_COUNT = 6;
  const CARS_PER_TRAIN = 3;
  const TOTAL_LRT_CARS = LRT_TRAIN_COUNT * CARS_PER_TRAIN;
  const lrtTrains = [];
  // Keep 4 trains concentrated in the showcase central corridor (DJKA <-> Ampera <-> Demang) and 2 full-line
  const centralEndDist = Math.min(lrtPoly.total, 9500);
  for (let i = 0; i < LRT_TRAIN_COUNT; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const isCentral = i < 4;
    const maxDist = isCentral ? centralEndDist : lrtPoly.total - 200;
    const minDist = 150;
    lrtTrains.push({
      dir,
      minDist,
      maxDist,
      dist: minDist + ((i + 0.35) / LRT_TRAIN_COUNT) * (maxDist - minDist),
      speed: 17.5 + (i % 2) * 2.0, // ~65 km/h cruising speed
      trackOffset: dir > 0 ? 1.85 : -1.85,
    });
  }

  const lrtBodyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.75, 3.1, 17.6), mats.lrtBody, TOTAL_LRT_CARS);
  const lrtStripeInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.86, 0.72, 17.7), mats.lrtStripe, TOTAL_LRT_CARS);
  const lrtWinInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.84, 1.05, 15.8), mats.lrtWindow, TOTAL_LRT_CARS);
  const lrtHeadInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 0.5, 0.35), mats.headlight, LRT_TRAIN_COUNT);
  const lrtTailInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 0.5, 0.35), mats.taillight, LRT_TRAIN_COUNT);
  for (const inst of [lrtBodyInst, lrtStripeInst, lrtWinInst, lrtHeadInst, lrtTailInst]) {
    inst.frustumCulled = false;
    scene.add(inst);
  }

  // --- 4. Animated Sungai Musi Perahu Ketek & Speedboats (28 boats) ---
  const BOAT_COUNT = 28;
  const BOAT_COLORS = ['#c44536', '#2b7a78', '#1d5b96', '#e09f3e', '#f2efe9', '#6a4c3b', '#2e8b57'];
  const CANOPY_COLORS = ['#1d4ed8', '#b91c1c', '#f59e0b', '#e2e8f0', '#0f766e', '#7c2d12'];
  // Lateral offsets chosen to pass cleanly clear of Ampera's ±37.5m piers
  const BOAT_LANES = [-22, -12, 12, 22, -62, 62, -85, 85];
  const boats = [];
  for (let i = 0; i < BOAT_COUNT; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const isSpeedboat = i % 4 === 0;
    boats.push({
      dir,
      dist: (i / BOAT_COUNT) * riverPoly.total + rand() * 180,
      speed: isSpeedboat ? 9.5 + rand() * 3.5 : 4.2 + rand() * 2.2,
      laneOffset: BOAT_LANES[i % BOAT_LANES.length] + (rand() - 0.5) * 6,
      phase: rand() * Math.PI * 2,
      len: isSpeedboat ? 11.5 : 10.2,
      wid: isSpeedboat ? 3.2 : 2.7,
      hullColor: new THREE.Color(BOAT_COLORS[i % BOAT_COLORS.length]),
      canopyColor: new THREE.Color(CANOPY_COLORS[(i * 3) % CANOPY_COLORS.length]),
    });
  }

  // Flat aerial wake plane: UV y=0 (top of canvas = narrow V tip) lies at +Y -> rotated -PI/2 around X puts +Y at -Z,
  // wait: Rx(-PI/2) puts local +Y at -Z (rear) and local -Y at +Z (stern), so flipping V (or Rx(-PI/2) with rotation) aligns tip to stern!
  // Let's bake a flat XZ plane explicitly with tip at +Z (touching stern) and wide fading tail toward -Z!
  const flatWakeGeo = new THREE.PlaneGeometry(1, 1);
  flatWakeGeo.rotateX(-Math.PI / 2);
  // After rotateX(-PI/2): original top (+Y, v=1) is at -Z, original bottom (-Y, v=0) is at +Z.
  // In CanvasTexture flipY=true (default), canvas y=0 (narrow V-tip) maps to v=1 (-Z). RotateY(PI) puts v=1 (narrow tip) at +Z (stern)!
  flatWakeGeo.rotateY(Math.PI);

  const boatHullInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1.4, 1), mats.boatHull, BOAT_COUNT);
  const boatCanopyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.82, 1.25, 0.58), mats.boatCanopy, BOAT_COUNT);
  const boatWakeInst = new THREE.InstancedMesh(flatWakeGeo, mats.wakeFoam, BOAT_COUNT);
  const boatLanternInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 6, 6), mats.boatLantern, BOAT_COUNT);
  for (const inst of [boatHullInst, boatCanopyInst, boatWakeInst, boatLanternInst]) {
    inst.frustumCulled = false;
    scene.add(inst);
  }
  for (let i = 0; i < BOAT_COUNT; i++) {
    boatHullInst.setColorAt(i, boats[i].hullColor);
    boatCanopyInst.setColorAt(i, boats[i].canopyColor);
  }
  boatHullInst.instanceColor.needsUpdate = true;
  boatCanopyInst.instanceColor.needsUpdate = true;

  // --- 5. Animated Coal Barges (Tongkang Batu Bara) + Tugboats (5 convoys) ---
  const BARGE_COUNT = 5;
  const barges = [];
  for (let i = 0; i < BARGE_COUNT; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    barges.push({
      dir,
      // Spread nicely across the Palembang river corridor so 1–2 are always near Ampera / Musi IV / Kemaro
      dist: ((i + 0.18) / BARGE_COUNT) * riverPoly.total,
      speed: 2.6 + (i % 3) * 0.45,
      laneOffset: dir > 0 ? 11 : -11, // Dead-center through Ampera's 75m central shipping span!
      phase: rand() * Math.PI * 2,
    });
  }

  const bargeHullInst = new THREE.InstancedMesh(new THREE.BoxGeometry(14.5, 3.6, 54), mats.bargeHull, BARGE_COUNT);
  const bargeCoalInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(5.2, 6.8, 3.8, 6), mats.coalHeap, BARGE_COUNT);
  const tugHullInst = new THREE.InstancedMesh(new THREE.BoxGeometry(6.4, 3.0, 16.5), mats.tugHull, BARGE_COUNT);
  const tugCabinInst = new THREE.InstancedMesh(new THREE.BoxGeometry(4.6, 3.6, 7.2), mats.tugCabin, BARGE_COUNT);
  const bargeWakeInst = new THREE.InstancedMesh(flatWakeGeo, mats.wakeFoam, BARGE_COUNT);
  const tugLampInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 6, 6), mats.boatLantern, BARGE_COUNT);
  for (const inst of [bargeHullInst, bargeCoalInst, tugHullInst, tugCabinInst, bargeWakeInst, tugLampInst]) {
    inst.frustumCulled = false;
    scene.add(inst);
  }

  // --- Runtime State ---
  let renderer = null;
  let camera = null;
  let mapRef = null;
  let enabled = true;
  let lightingMode = 'siang';
  let lastTimeMs = 0;
  let simTime = 0;
  let frameTick = 0;
  let lastElevRefresh = -10;
  let viaductReady = false;

  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const anchorMatrix = new THREE.Matrix4()
    .makeTranslation(anchor.x, anchor.y, anchor.z)
    .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
    .multiply(rotX);

  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';

  function queryTerrain(lng, lat) {
    if (!mapRef || typeof mapRef.queryTerrainElevation !== 'function') return 0;
    const e = mapRef.queryTerrainElevation([lng, lat]);
    return Number.isFinite(e) ? Math.max(0, e) : 0;
  }

  function refreshStaticElevations() {
    for (const b of bridges) {
      b.baseElev = queryTerrain(b.lngLat[0], b.lngLat[1]);
    }
    viaduct.updateElevations(queryTerrain, bridges[0].baseElev);
    viaductReady = true;
  }

  function chooseNextEdge(v) {
    const outs = graph.outgoing.get(v.edge.endNode);
    if (!outs || outs.length === 0) {
      v.edge = pickWeightedEdge();
      return;
    }
    let bestId = -1;
    let bestScore = -1e9;
    const prevStart = v.edge.startNode;
    for (const nextId of outs) {
      const cand = graph.dirEdges[nextId];
      // Avoid immediate U-turn unless dead end
      const isUturn = cand.endNode === prevStart && outs.length > 1;
      const dot = v.edge.endDirX * cand.startDirX + v.edge.endDirZ * cand.startDirZ;
      const clsBonus = cand.cls <= 1 ? 0.55 : cand.cls === 2 ? 0.3 : 0.05;
      const coreBonus = cand.distFromCore < 0.03 ? 0.35 : -0.3;
      const score = (isUturn ? -5 : dot * 1.4) + clsBonus + coreBonus + rand() * 0.65;
      if (score > bestScore) {
        bestScore = score;
        bestId = nextId;
      }
    }
    v.edge = bestId >= 0 ? graph.dirEdges[bestId] : pickWeightedEdge();
  }

  function stepSimulation(dt) {
    simTime += dt;
    frameTick += 1;

    // Periodically refresh terrain elevations as DEM tiles stream in (every ~1.5s)
    if (!viaductReady || simTime - lastElevRefresh > 1.5) {
      lastElevRefresh = simTime;
      refreshStaticElevations();
      // Invalidate a fraction of node elevation caches gently so newly loaded DEM tiles take effect
      for (let i = 0; i < graph.nodes.length; i += 7) {
        graph.nodes[i].elevCached = false;
      }
    }

    const amperaBaseElev = bridges[0].baseElev;
    const isDark = lightingMode === 'malam' || lightingMode === 'senja';
    const glowScale = lightingMode === 'malam' ? 1.0 : lightingMode === 'senja' ? 0.55 : 0.0;

    // 1) Update Road Vehicles
    for (let i = 0; i < TOTAL_VEHICLES; i++) {
      const v = vehicles[i];
      let x, y, z, fx, fz, slope = 0;

      if (v.kind === 'bridge') {
        const b = bridges[v.bridgeIdx];
        const maxZ = b.spanHalf + b.rampLen - 6;
        v.localZ += v.dir * v.speed * dt;
        if (v.localZ > maxZ) v.localZ = -maxZ;
        if (v.localZ < -maxZ) v.localZ = maxZ;

        x = b.cx + b.rightX * v.localX + b.fwdX * v.localZ;
        z = b.cz + b.rightZ * v.localX + b.fwdZ * v.localZ;
        fx = b.fwdX * v.dir;
        fz = b.fwdZ * v.dir;

        const absZ = Math.abs(v.localZ);
        if (absZ <= b.spanHalf) {
          y = b.baseElev + b.roadTop;
          slope = 0;
        } else {
          const u = (absZ - b.spanHalf) / b.rampLen;
          y = b.baseElev + b.roadTop * (1 - u) + 0.15 * u;
          const slopeMag = (b.roadTop - 0.15) / b.rampLen;
          const dYdLocalZ = v.localZ > 0 ? -slopeMag : slopeMag;
          slope = dYdLocalZ * v.dir;
        }
      } else {
        v.dist += v.speed * dt;
        let safety = 0;
        while (v.dist >= v.edge.total && safety++ < 4) {
          v.dist -= v.edge.total;
          chooseNextEdge(v);
        }
        if (v.dist > v.edge.total) v.dist = 0;

        const s = sampleRoadEdge(graph, v.edge, v.dist);
        fx = s.fx;
        fz = s.fz;
        // Indonesian left-hand drive offset: Left = (fz, -fx)
        x = s.x + fz * v.laneOffset;
        z = s.z - fx * v.laneOffset;

        const bridgeHit = queryBridgeDeck(bridges, x, z, fx, fz);
        if (bridgeHit) {
          y = bridgeHit.y;
          slope = bridgeHit.slope;
        } else {
          if (!s.nodeA.elevCached) {
            s.nodeA.elev = queryTerrain(s.nodeA.lng, s.nodeA.lat);
            s.nodeA.elevCached = true;
          }
          if (!s.nodeB.elevCached) {
            s.nodeB.elev = queryTerrain(s.nodeB.lng, s.nodeB.lat);
            s.nodeB.elevCached = true;
          }
          y = s.nodeA.elev * (1 - s.t) + s.nodeB.elev * s.t + 0.25;
        }
      }

      const yaw = Math.atan2(fx, fz);
      const pitch = -Math.atan(slope);

      // Vehicle body
      dummy.position.set(x, y + v.ht * 0.34, z);
      dummy.rotation.set(pitch, yaw, 0);
      dummy.scale.set(v.wid, v.ht, v.len);
      dummy.updateMatrix();
      carBodyInst.setMatrixAt(i, dummy.matrix);

      // Cabin
      const cabinBack = v.isHeavy ? 0.05 : -v.len * 0.08;
      dummy.position.set(x + fx * cabinBack, y + v.ht * 0.72, z + fz * cabinBack);
      dummy.rotation.set(pitch, yaw, 0);
      dummy.scale.set(v.wid, v.ht, v.len);
      dummy.updateMatrix();
      carCabinInst.setMatrixAt(i, dummy.matrix);

      // Headlights (front +Z) & Taillights (rear -Z)
      const halfL = v.len * 0.51;
      dummy.position.set(x + fx * halfL, y + v.ht * 0.35 + slope * halfL, z + fz * halfL);
      dummy.rotation.set(pitch, yaw, 0);
      dummy.scale.set(v.wid, v.ht, v.len);
      dummy.updateMatrix();
      carHeadInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x - fx * halfL, y + v.ht * 0.36 - slope * halfL, z - fz * halfL);
      dummy.rotation.set(pitch, yaw, 0);
      dummy.scale.set(v.wid, v.ht, v.len);
      dummy.updateMatrix();
      carTailInst.setMatrixAt(i, dummy.matrix);

      // Ground light cones visible at Senja & Malam
      if (isDark) {
        const beamAhead = halfL + 4.0;
        dummy.position.set(x + fx * beamAhead, y + 0.22 + slope * beamAhead, z + fz * beamAhead);
        dummy.rotation.set(-Math.PI / 2 + pitch, yaw, 0);
        dummy.scale.set(glowScale, glowScale, 1);
        dummy.updateMatrix();
        carHeadGlowInst.setMatrixAt(i, dummy.matrix);

        const tailBehind = halfL + 2.0;
        dummy.position.set(x - fx * tailBehind, y + 0.22 - slope * tailBehind, z - fz * tailBehind);
        dummy.rotation.set(-Math.PI / 2 + pitch, yaw, 0);
        dummy.scale.set(glowScale, glowScale, 1);
        dummy.updateMatrix();
        carTailGlowInst.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -500, 0);
        dummy.scale.set(0.001, 0.001, 0.001);
        dummy.updateMatrix();
        carHeadGlowInst.setMatrixAt(i, dummy.matrix);
        carTailGlowInst.setMatrixAt(i, dummy.matrix);
      }
    }

    carBodyInst.instanceMatrix.needsUpdate = true;
    carCabinInst.instanceMatrix.needsUpdate = true;
    carHeadInst.instanceMatrix.needsUpdate = true;
    carTailInst.instanceMatrix.needsUpdate = true;
    carHeadGlowInst.instanceMatrix.needsUpdate = true;
    carTailGlowInst.instanceMatrix.needsUpdate = true;

    // 2) Update Animated LRT Sumsel 3-Car Trains
    for (let tIdx = 0; tIdx < LRT_TRAIN_COUNT; tIdx++) {
      const tr = lrtTrains[tIdx];
      tr.dist += tr.dir * tr.speed * dt;
      if (tr.dist >= tr.maxDist) {
        tr.dist = tr.maxDist;
        tr.dir = -1;
        tr.trackOffset = -1.85;
      } else if (tr.dist <= tr.minDist) {
        tr.dist = tr.minDist;
        tr.dir = 1;
        tr.trackOffset = 1.85;
      }

      for (let c = 0; c < CARS_PER_TRAIN; c++) {
        const carInstIdx = tIdx * CARS_PER_TRAIN + c;
        const offsetAlong = (c - 1) * 18.6 * tr.dir;
        const sampleD = Math.max(20, Math.min(lrtPoly.total - 20, tr.dist + offsetAlong));
        const s = samplePolyline(lrtPoly, sampleD);
        const fx = s.fx * tr.dir;
        const fz = s.fz * tr.dir;
        const lx = s.fz;
        const lz = -s.fx;
        const x = s.x + lx * tr.trackOffset;
        const z = s.z + lz * tr.trackOffset;
        const te = queryTerrain(s.lng, s.lat);
        const railY = computeLrtElevation(s.lng, s.lat, te, amperaBaseElev);
        const yaw = Math.atan2(fx, fz);

        dummy.position.set(x, railY + 1.65, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lrtBodyInst.setMatrixAt(carInstIdx, dummy.matrix);

        dummy.position.set(x, railY + 0.88, z);
        dummy.updateMatrix();
        lrtStripeInst.setMatrixAt(carInstIdx, dummy.matrix);

        dummy.position.set(x, railY + 2.05, z);
        dummy.updateMatrix();
        lrtWinInst.setMatrixAt(carInstIdx, dummy.matrix);

        if (c === 2) {
          // Lead car headlights
          dummy.position.set(x + fx * 8.95, railY + 1.2, z + fz * 8.95);
          dummy.updateMatrix();
          lrtHeadInst.setMatrixAt(tIdx, dummy.matrix);
        } else if (c === 0) {
          // Rear car taillights
          dummy.position.set(x - fx * 8.95, railY + 1.2, z - fz * 8.95);
          dummy.updateMatrix();
          lrtTailInst.setMatrixAt(tIdx, dummy.matrix);
        }
      }
    }
    lrtBodyInst.instanceMatrix.needsUpdate = true;
    lrtStripeInst.instanceMatrix.needsUpdate = true;
    lrtWinInst.instanceMatrix.needsUpdate = true;
    lrtHeadInst.instanceMatrix.needsUpdate = true;
    lrtTailInst.instanceMatrix.needsUpdate = true;

    // 3) Update Sungai Musi Perahu Ketek & Speedboats
    const waterBaseY = Math.max(0.2, amperaBaseElev * 0.25) + 0.55;
    for (let i = 0; i < BOAT_COUNT; i++) {
      const b = boats[i];
      b.dist += b.dir * b.speed * dt;
      if (b.dist > riverPoly.total) b.dist -= riverPoly.total;
      if (b.dist < 0) b.dist += riverPoly.total;

      const s = samplePolyline(riverPoly, b.dist);
      const fx = s.fx * b.dir;
      const fz = s.fz * b.dir;
      const lx = s.fz;
      const lz = -s.fx;
      const x = s.x + lx * b.laneOffset;
      const z = s.z + lz * b.laneOffset;
      const yaw = Math.atan2(fx, fz);
      const bob = Math.sin(simTime * 2.4 + b.phase) * 0.14;
      const roll = Math.sin(simTime * 1.9 + b.phase) * 0.05;

      dummy.position.set(x, waterBaseY + 0.65 + bob, z);
      dummy.rotation.set(0, yaw, roll);
      dummy.scale.set(b.wid, 1, b.len);
      dummy.updateMatrix();
      boatHullInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x - fx * 0.6, waterBaseY + 1.85 + bob, z - fz * 0.6);
      dummy.scale.set(b.wid, 1, b.len);
      dummy.updateMatrix();
      boatCanopyInst.setMatrixAt(i, dummy.matrix);

      // Flat aerial V-wake trailing behind stern
      const wakePulse = 0.92 + 0.14 * Math.sin(simTime * 4.2 + b.phase);
      const wakeLen = b.len * 2.1 * wakePulse;
      const wakeDist = b.len * 0.45 + wakeLen * 0.5;
      dummy.position.set(x - fx * wakeDist, waterBaseY + 0.18, z - fz * wakeDist);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(b.wid * 2.4 * wakePulse, 1, wakeLen);
      dummy.updateMatrix();
      boatWakeInst.setMatrixAt(i, dummy.matrix);

      // Bow lantern
      dummy.position.set(x + fx * (b.len * 0.45), waterBaseY + 1.9 + bob, z + fz * (b.len * 0.45));
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      boatLanternInst.setMatrixAt(i, dummy.matrix);
    }
    boatHullInst.instanceMatrix.needsUpdate = true;
    boatCanopyInst.instanceMatrix.needsUpdate = true;
    boatWakeInst.instanceMatrix.needsUpdate = true;
    boatLanternInst.instanceMatrix.needsUpdate = true;

    // 4) Update Sungai Musi Coal Barges + Tugboats
    for (let i = 0; i < BARGE_COUNT; i++) {
      const bg = barges[i];
      bg.dist += bg.dir * bg.speed * dt;
      if (bg.dist > riverPoly.total - 90) bg.dist = 90;
      if (bg.dist < 90) bg.dist = riverPoly.total - 90;

      const s = samplePolyline(riverPoly, bg.dist);
      const fx = s.fx * bg.dir;
      const fz = s.fz * bg.dir;
      const lx = s.fz;
      const lz = -s.fx;
      const bx = s.x + lx * bg.laneOffset;
      const bz = s.z + lz * bg.laneOffset;
      const yaw = Math.atan2(fx, fz);
      const bob = Math.sin(simTime * 1.1 + bg.phase) * 0.12;

      // Coal barge hull & mound
      dummy.position.set(bx, waterBaseY + 1.55 + bob, bz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bargeHullInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(bx, waterBaseY + 4.4 + bob, bz);
      dummy.scale.set(1.0, 1.0, 3.2);
      dummy.updateMatrix();
      bargeCoalInst.setMatrixAt(i, dummy.matrix);

      // Leading tugboat 44m ahead on river alignment
      const tugDist = Math.max(10, Math.min(riverPoly.total - 10, bg.dist + bg.dir * 44));
      const ts = samplePolyline(riverPoly, tugDist);
      const tfx = ts.fx * bg.dir;
      const tfz = ts.fz * bg.dir;
      const tx = ts.x + ts.fz * bg.laneOffset;
      const tz = ts.z - ts.fx * bg.laneOffset;
      const tyaw = Math.atan2(tfx, tfz);

      dummy.position.set(tx, waterBaseY + 1.25 + bob, tz);
      dummy.rotation.set(0, tyaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tugHullInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tx + tfx * 1.2, waterBaseY + 4.1 + bob, tz + tfz * 1.2);
      dummy.updateMatrix();
      tugCabinInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tx + tfx * 1.2, waterBaseY + 6.4 + bob, tz + tfz * 1.2);
      dummy.updateMatrix();
      tugLampInst.setMatrixAt(i, dummy.matrix);

      // Wide flat stern wake behind barge
      dummy.position.set(bx - fx * 52, waterBaseY + 0.2, bz - fz * 52);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(22, 1, 56);
      dummy.updateMatrix();
      bargeWakeInst.setMatrixAt(i, dummy.matrix);
    }
    bargeHullInst.instanceMatrix.needsUpdate = true;
    bargeCoalInst.instanceMatrix.needsUpdate = true;
    tugHullInst.instanceMatrix.needsUpdate = true;
    tugCabinInst.instanceMatrix.needsUpdate = true;
    tugLampInst.instanceMatrix.needsUpdate = true;
    bargeWakeInst.instanceMatrix.needsUpdate = true;
  }

  function setLightingMode(mode) {
    lightingMode = mode;
    const isNight = mode === 'malam';
    const isSunset = mode === 'senja';

    mats.headlight.emissiveIntensity = isNight ? 3.8 : isSunset ? 2.2 : 0.7;
    mats.taillight.emissiveIntensity = isNight ? 3.6 : isSunset ? 2.1 : 0.65;
    mats.headlightGlow.opacity = isNight ? 0.85 : isSunset ? 0.42 : 0.0;
    mats.taillightGlow.opacity = isNight ? 0.75 : isSunset ? 0.34 : 0.0;
    mats.lrtWindow.emissiveIntensity = isNight ? 3.0 : isSunset ? 1.6 : 0.15;
    mats.boatLantern.emissiveIntensity = isNight ? 3.4 : isSunset ? 2.0 : 0.4;
    mats.wakeFoam.opacity = isNight ? 0.25 : isSunset ? 0.46 : 0.68;

    mats.viaductConcrete.color.set(isNight ? '#3d4552' : isSunset ? '#b89a88' : '#c9c4ba');
    mats.viaductTrim.color.set(isNight ? '#515c6e' : isSunset ? '#cea992' : '#dfd9ce');
    mats.viaductPier.color.set(isNight ? '#323945' : isSunset ? '#9e8474' : '#b4afa4');

    if (isNight) {
      sun.color.set('#8db4eb');
      sun.intensity = 0.85;
      amb.intensity = 0.42;
      fill.intensity = 0.32;
    } else if (isSunset) {
      sun.color.set('#ffa954');
      sun.intensity = 2.0;
      sun.position.set(-160, 55, 80);
      amb.intensity = 0.72;
      fill.intensity = 0.48;
    } else {
      sun.color.set('#fff5de');
      sun.intensity = 1.85;
      sun.position.set(120, 190, 90);
      amb.intensity = 0.9;
      fill.intensity = 0.55;
    }
    if (mapRef) mapRef.triggerRepaint();
  }

  function setEnabled(flag) {
    enabled = Boolean(flag);
    scene.visible = enabled;
    lastTimeMs = 0;
    if (mapRef) mapRef.triggerRepaint();
  }

  function getStats() {
    return Object.freeze({
      active: enabled,
      vehicleCount: TOTAL_VEHICLES,
      boatCount: BOAT_COUNT,
      bargeCount: BARGE_COUNT,
      lrtTrainCount: LRT_TRAIN_COUNT,
      tick: frameTick,
      sampleVehicleDist: Math.round(vehicles[0]?.dist || 0),
      sampleLrtDist: Math.round(lrtTrains[0]?.dist || 0),
      sampleBoatDist: Math.round(boats[0]?.dist || 0),
    });
  }

  const customLayer = {
    id: 'palembang-live-traffic-3d',
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
      // Prime initial positions so first frame renders fully populated
      stepSimulation(0.016);
    },
    render(gl, options) {
      if (!renderer || !camera || !enabled) return;

      const now = performance.now();
      const dt = lastTimeMs > 0 ? Math.min(0.1, Math.max(0.001, (now - lastTimeMs) / 1000)) : 0.016;
      lastTimeMs = now;

      stepSimulation(dt);

      const projArr = options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix || options;
      const m = new THREE.Matrix4().fromArray(projArr);

      renderer.resetState();
      camera.projectionMatrix = m.multiply(anchorMatrix);
      renderer.render(scene, camera);

      if (enabled && mapRef) {
        mapRef.triggerRepaint();
      }
    },
    onRemove() {
      enabled = false;
      mapRef = null;
      renderer = null;
    },
  };

  return { layer: customLayer, setLightingMode, setEnabled, getStats };
}
