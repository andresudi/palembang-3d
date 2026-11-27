// v2.2 Playable Perahu Ketek Mini-Game + 5 Sriwijaya Golden Relics Treasure Hunt on Sungai Musi
// Player steers a hero 3D Songket Perahu Ketek with WASD / Arrow keys (or touch buttons),
// clamped cleanly inside the real OSM Musi River shipping channel.
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import pathData from './data/palembang-paths.json';

const ANCHOR_LNGLAT = [104.76340, -2.99194];
const START_LNGLAT = [104.7596, -2.9949];
const START_YAW_RAD = THREE.MathUtils.degToRad(50); // Compass bearing ~50° (toward Ampera!)
const METERS_PER_LNG = 111320 * Math.cos((-2.99 * Math.PI) / 180);
const METERS_PER_LAT = 110574;

export const SRIWIJAYA_RELICS = [
  { id: 'relic-bkb', nameId: 'Arca Buddha Bukit Siguntang', nameEn: 'Bukit Siguntang Buddha Statue', lngLat: [104.7609, -2.9939] },
  { id: 'relic-ampera', nameId: 'Prasasti Kedukan Bukit', nameEn: 'Kedukan Bukit Inscription', lngLat: [104.7636, -2.9916] },
  { id: 'relic-pasar16', nameId: 'Mahkota Emas Sriwijaya', nameEn: 'Golden Crown of Srivijaya', lngLat: [104.7676, -2.9883] },
  { id: 'relic-musi-iv', nameId: 'Keris Kesultanan Palembang', nameEn: 'Palembang Sultanate Keris', lngLat: [104.7738, -2.9839] },
  { id: 'relic-kemaro', nameId: 'Mutiara Legenda Pulau Kemaro', nameEn: 'Legendary Pearl of Kemaro Island', lngLat: [104.8080, -2.9848] },
];

function projectToLocal(anchor, meterScale, lng, lat) {
  const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  return {
    x: (mc.x - anchor.x) / meterScale,
    z: (mc.y - anchor.y) / meterScale,
  };
}

function buildRiverSpine(anchor, meterScale) {
  const flat = pathData.river[0];
  const pts = [];
  for (let i = 0; i < flat.length; i += 2) {
    const lng = flat[i];
    const lat = flat[i + 1];
    if (lng >= 104.738 && lng <= 104.828 && lat >= -3.018 && lat <= -2.968) {
      pts.push(projectToLocal(anchor, meterScale, lng, lat));
    }
  }
  return pts;
}

// Find closest point on river centerline polyline so the player boat stays safely inside Sungai Musi
function clampToRiverChannel(spine, x, z, maxHalfWidth = 145) {
  if (spine.length < 2) return { x, z, clamped: false };
  let bestDistSq = 1e18;
  let bestX = x;
  let bestZ = z;
  for (let i = 0; i < spine.length - 1; i++) {
    const a = spine[i];
    const b = spine[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const lenSq = abx * abx + abz * abz;
    const t = lenSq > 0.001 ? Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / lenSq)) : 0;
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const dSq = (x - px) ** 2 + (z - pz) ** 2;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestX = px;
      bestZ = pz;
    }
  }
  const dist = Math.sqrt(bestDistSq);
  if (dist <= maxHalfWidth) return { x, z, clamped: false };
  const s = maxHalfWidth / Math.max(0.001, dist);
  return {
    x: bestX + (x - bestX) * s,
    z: bestZ + (z - bestZ) * s,
    clamped: true,
  };
}

export function createPlayableBoatLayer({ map, ambience, onUpdate, onCollect }) {
  const anchor = maplibregl.MercatorCoordinate.fromLngLat(ANCHOR_LNGLAT, 0);
  const meterScale = anchor.meterInMercatorCoordinateUnits();
  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const anchorMatrix = new THREE.Matrix4()
    .makeTranslation(anchor.x, anchor.y, anchor.z)
    .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
    .multiply(rotX);

  const riverSpine = buildRiverSpine(anchor, meterScale);
  const startLocal = projectToLocal(anchor, meterScale, START_LNGLAT[0], START_LNGLAT[1]);

  const scene = new THREE.Scene();
  const amb = new THREE.AmbientLight('#ffffff', 0.95);
  const sun = new THREE.DirectionalLight('#fff5de', 1.85);
  sun.position.set(120, 180, 90);
  scene.add(amb, sun);

  // --- Hero Player Perahu Ketek (Detailed Songket Red-Gold Palembang Boat) ---
  const boatGroup = new THREE.Group();
  boatGroup.visible = false;
  const hullMat = new THREE.MeshStandardMaterial({ color: '#8f2d22', roughness: 0.48 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#e5b242', roughness: 0.3, metalness: 0.5 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#d6392e', roughness: 0.45 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff4c4',
    emissive: '#ffb845',
    emissiveIntensity: 2.2,
  });
  const wakeMat = new THREE.MeshBasicMaterial({
    color: '#e8f7ff',
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 13.5), hullMat);
  hull.position.y = 0.9;
  boatGroup.add(hull);

  const prow = new THREE.Mesh(new THREE.ConeGeometry(2.1, 4.4, 4), trimMat);
  prow.rotation.x = Math.PI / 2;
  prow.position.set(0, 1.15, 8.8);
  boatGroup.add(prow);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.35, 11.8), cabinMat);
  deck.position.y = 1.85;
  boatGroup.add(deck);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 7.8), canopyMat);
  canopy.position.set(0, 3.6, -0.8);
  boatGroup.add(canopy);

  const goldBand = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 8.0), trimMat);
  goldBand.position.set(0, 3.88, -0.8);
  boatGroup.add(goldBand);

  for (const sx of [-1.45, 1.45]) {
    for (const sz of [-4.0, 2.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.7, 6), trimMat);
      post.position.set(sx, 2.75, sz);
      boatGroup.add(post);
    }
  }

  const bowLamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), lanternMat);
  bowLamp.position.set(0, 2.5, 6.2);
  boatGroup.add(bowLamp);

  const wakePlane = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 24), wakeMat);
  wakePlane.rotation.x = -Math.PI / 2;
  wakePlane.position.set(0, 0.18, -17.5);
  boatGroup.add(wakePlane);

  boatGroup.frustumCulled = false;
  scene.add(boatGroup);

  // --- 5 Rotating Golden Sriwijaya Relics + Vertical Sky Beacons ---
  const relicGroup = new THREE.Group();
  relicGroup.visible = false;
  const relicMat = new THREE.MeshStandardMaterial({
    color: '#ffd166',
    emissive: '#f59e0b',
    emissiveIntensity: 1.4,
    metalness: 0.72,
    roughness: 0.22,
  });
  const beaconMat = new THREE.MeshBasicMaterial({
    color: '#fde047',
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });

  const relicItems = SRIWIJAYA_RELICS.map((r, idx) => {
    const pos = projectToLocal(anchor, meterScale, r.lngLat[0], r.lngLat[1]);
    const g = new THREE.Group();
    g.position.set(pos.x, 0, pos.z);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(5.5, 0), relicMat);
    gem.position.y = 11;
    g.add(gem);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 3.6, 75, 10, 1, true), beaconMat);
    beam.position.y = 38;
    g.add(beam);

    const halo = new THREE.Mesh(new THREE.RingGeometry(8, 10.5, 20), ringMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 1.2;
    g.add(halo);

    g.frustumCulled = false;
    relicGroup.add(g);
    return { ...r, idx, x: pos.x, z: pos.z, group: g, gem, halo, collected: false };
  });
  scene.add(relicGroup);

  // --- Physics & Gameplay State ---
  let active = false;
  let boatX = startLocal.x;
  let boatZ = startLocal.z;
  // Heading B = compass bearing in radians (0 = North = -Z, PI/2 = East = +X)
  let headingRad = START_YAW_RAD;
  let speedMps = 0;
  let steerRoll = 0;
  let elapsedSec = 0;
  let collectedCount = 0;
  let completed = false;
  let lastEmitMs = 0;
  let simTime = 0;
  let lastTs = 0;

  let renderer = null;
  let camera = null;
  let mapRef = null;

  const keys = new Set();
  const virtualInput = { throttle: 0, steer: 0 };

  function localToLngLat(x, z) {
    return [
      ANCHOR_LNGLAT[0] + x / METERS_PER_LNG,
      ANCHOR_LNGLAT[1] - z / METERS_PER_LAT,
    ];
  }

  function findNearestUncollected() {
    let best = null;
    let bestD = 1e12;
    for (const r of relicItems) {
      if (r.collected) continue;
      const d = Math.hypot(r.x - boatX, r.z - boatZ);
      if (d < bestD) {
        bestD = d;
        best = { relic: r, distM: Math.round(d) };
      }
    }
    return best;
  }

  function getState() {
    const [lng, lat] = localToLngLat(boatX, boatZ);
    const nearest = findNearestUncollected();
    return Object.freeze({
      active,
      lng: Number(lng.toFixed(5)),
      lat: Number(lat.toFixed(5)),
      bearingDeg: Number((((headingRad * 180) / Math.PI) % 360 + 360) % 360),
      speedKmh: Math.round(Math.abs(speedMps) * 3.6),
      collectedCount,
      totalRelics: relicItems.length,
      completed,
      elapsedSec: Math.round(elapsedSec),
      nearestRelic: nearest
        ? {
            id: nearest.relic.id,
            nameId: nearest.relic.nameId,
            nameEn: nearest.relic.nameEn,
            distM: nearest.distM,
          }
        : null,
    });
  }

  function resetMission() {
    boatX = startLocal.x;
    boatZ = startLocal.z;
    headingRad = START_YAW_RAD;
    speedMps = 0;
    steerRoll = 0;
    elapsedSec = 0;
    collectedCount = 0;
    completed = false;
    for (const r of relicItems) {
      r.collected = false;
      r.group.visible = true;
    }
    onUpdate?.(getState());
  }

  function start({ reset = false } = {}) {
    if (reset || completed) resetMission();
    active = true;
    boatGroup.visible = true;
    relicGroup.visible = true;
    lastTs = 0;

    const [lng, lat] = localToLngLat(boatX, boatZ);
    const bDeg = (((headingRad * 180) / Math.PI) % 360 + 360) % 360;
    map.jumpTo({
      center: [lng, lat],
      zoom: 17.55,
      pitch: 70,
      bearing: bDeg,
    });
    ambience?.playBoatHorn?.(false);
    onUpdate?.(getState());
    if (mapRef) mapRef.triggerRepaint();
  }

  function stop() {
    if (!active) return;
    active = false;
    boatGroup.visible = false;
    relicGroup.visible = false;
    keys.clear();
    virtualInput.throttle = 0;
    virtualInput.steer = 0;
    speedMps = 0;
    onUpdate?.(getState());
    if (mapRef) mapRef.triggerRepaint();
  }

  function setVirtualInput(patch) {
    Object.assign(virtualInput, patch);
  }

  function step(dt) {
    simTime += dt;
    if (!completed) elapsedSec += dt;

    const throttle =
      (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
      (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
      virtualInput.throttle;
    const steer =
      (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
      (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
      virtualInput.steer;

    // Responsive arcade-realistic boat acceleration & water drag (max ~75 km/h so 5 km to Kemaro is fun!)
    const maxSpeed = 24.0; // m/s (~86 km/h turbo ketek!)
    const accel = throttle > 0 ? 18.0 : throttle < 0 ? 14.0 : 0;
    if (throttle !== 0) {
      speedMps += throttle * accel * dt;
    } else {
      speedMps *= Math.exp(-dt * 1.9);
    }
    speedMps = Math.max(-7, Math.min(maxSpeed, speedMps));

    const turnRate = 1.45 * (0.45 + 0.55 * Math.min(1, Math.abs(speedMps) / 10));
    headingRad += steer * turnRate * dt;
    steerRoll += (-steer * 0.16 - steerRoll) * Math.min(1, dt * 8);

    // Compass headingRad: East (+X) = sin(B), South (+Z) = -cos(B)
    const fx = Math.sin(headingRad);
    const fz = -Math.cos(headingRad);
    const nextX = boatX + fx * speedMps * dt;
    const nextZ = boatZ + fz * speedMps * dt;

    const clamped = clampToRiverChannel(riverSpine, nextX, nextZ, 145);
    boatX = clamped.x;
    boatZ = clamped.z;
    if (clamped.clamped) speedMps *= 0.86;

    const waterY =
      mapRef && typeof mapRef.queryTerrainElevation === 'function'
        ? Math.max(0.4, (mapRef.queryTerrainElevation(ANCHOR_LNGLAT) || 0) * 0.25 + 0.65)
        : 0.75;

    // Position player boat (Three.js +Z forward -> yaw = atan2(fx, fz))
    const bob = Math.sin(simTime * 3.4) * 0.15;
    boatGroup.position.set(boatX, waterY + bob, boatZ);
    boatGroup.rotation.order = 'YXZ';
    boatGroup.rotation.set(0, Math.atan2(fx, fz), steerRoll);

    const wakeScale = 0.25 + Math.min(1.3, Math.abs(speedMps) / 14);
    wakePlane.scale.set(0.8 + wakeScale * 0.4, wakeScale, 1);
    wakeMat.opacity = Math.min(0.72, 0.15 + Math.abs(speedMps) / 22);

    // Animate & check collision with 5 golden Sriwijaya relics (pickup radius 55m)
    for (const r of relicItems) {
      if (r.collected) continue;
      r.gem.rotation.y = simTime * 2.1 + r.idx;
      r.gem.position.y = waterY + 11 + Math.sin(simTime * 2.8 + r.idx) * 2.2;
      const pulse = 0.9 + 0.25 * Math.sin(simTime * 3.6 + r.idx);
      r.halo.scale.set(pulse, pulse, 1);
      r.halo.position.y = waterY + 0.6;

      const dist = Math.hypot(r.x - boatX, r.z - boatZ);
      if (dist <= 55) {
        r.collected = true;
        r.group.visible = false;
        collectedCount += 1;
        if (collectedCount >= relicItems.length) completed = true;
        ambience?.playCollectChime?.();
        onCollect?.(r, getState());
      }
    }

    // Smooth chase-cam trailing slightly behind bow so player sees river & landmarks ahead
    const leadX = boatX + fx * 34;
    const leadZ = boatZ + fz * 34;
    const [camLng, camLat] = localToLngLat(leadX, leadZ);
    const bDeg = (((headingRad * 180) / Math.PI) % 360 + 360) % 360;
    map.jumpTo({
      center: [camLng, camLat],
      bearing: bDeg,
      pitch: 70,
      zoom: 17.55,
    });

    const now = performance.now();
    if (now - lastEmitMs > 180) {
      lastEmitMs = now;
      onUpdate?.(getState());
    }
  }

  function onKeyDown(e) {
    if (!active) return;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Escape') {
      stop();
      return;
    }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      if (e.code.startsWith('Arrow')) e.preventDefault();
      keys.add(e.code);
    }
  }
  function onKeyUp(e) {
    keys.delete(e.code);
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const customLayer = {
    id: 'palembang-playable-boat-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      mapRef = m;
      camera = new THREE.Camera();
      renderer = new THREE.WebGLRenderer({
        canvas: m.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    },
    render(gl, options) {
      if (!renderer || !camera || !active) return;
      const now = performance.now();
      const dt = lastTs > 0 ? Math.min(0.08, Math.max(0.004, (now - lastTs) / 1000)) : 0.016;
      lastTs = now;

      step(dt);

      const projArr = options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix || options;
      const m = new THREE.Matrix4().fromArray(projArr);
      renderer.resetState();
      camera.projectionMatrix = m.multiply(anchorMatrix);
      renderer.render(scene, camera);

      if (active && mapRef) mapRef.triggerRepaint();
    },
    onRemove() {
      stop();
      window.removeEventListener('keydown', onKeyDown);
      mapRef = null;
      renderer = null;
    },
  };

  return {
    layer: customLayer,
    start,
    stop,
    resetMission,
    setVirtualInput,
    getState,
    cleanup() {
      stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
