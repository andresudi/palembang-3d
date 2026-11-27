// v2.1 Festival Palembang 3D Layer (MapLibre v6 Custom WebGL Three.js Layer):
// 1. Festival Balap Perahu Bidar (6 long traditional racing canoes on Sungai Musi BKB <-> Ampera)
// 2. Malam Kembang Api Ampera (3D launching/bursting fireworks over Ampera Bridge)
//    + 48 glowing sky lanterns (Lampion) drifting over Pulau Kemaro
import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import pathData from './data/palembang-paths.json';

const ANCHOR_LNGLAT = [104.76340, -2.99194];
const KEMARO_LNGLAT = [104.81312, -2.98038];

function projectToLocal(anchor, meterScale, lng, lat) {
  const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  return {
    x: (mc.x - anchor.x) / meterScale,
    z: (mc.y - anchor.y) / meterScale,
  };
}

function buildRiverCourse(anchor, meterScale) {
  const flat = pathData.river[0];
  const pts = [];
  for (let i = 0; i < flat.length; i += 2) {
    const lng = flat[i];
    const lat = flat[i + 1];
    // Straight stretch from Kuto Besak past Ampera toward Pasar 16 Ilir / Musi IV
    if (lng >= 104.753 && lng <= 104.773 && lat >= -3.001 && lat <= -2.984) {
      const p = projectToLocal(anchor, meterScale, lng, lat);
      pts.push({ x: p.x, z: p.z, dist: 0 });
    }
  }
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pts[i].dist = total;
  }
  return { pts, total };
}

function sampleCourse(course, dist) {
  const { pts, total } = course;
  if (pts.length < 2 || total <= 0) return { x: 0, z: 0, fx: 0.7, fz: -0.7 };
  const d = ((dist % total) + total) % total;
  let lo = 0;
  let hi = pts.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].dist <= d) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  const seg = Math.max(0.001, b.dist - a.dist);
  const t = (d - a.dist) / seg;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const inv = 1 / Math.max(0.001, Math.hypot(dx, dz));
  return { x: a.x + dx * t, z: a.z + dz * t, fx: dx * inv, fz: dz * inv };
}

export function createFestivalLayer({ ambience } = {}) {
  const anchor = maplibregl.MercatorCoordinate.fromLngLat(ANCHOR_LNGLAT, 0);
  const meterScale = anchor.meterInMercatorCoordinateUnits();
  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const anchorMatrix = new THREE.Matrix4()
    .makeTranslation(anchor.x, anchor.y, anchor.z)
    .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
    .multiply(rotX);

  const kemaroPos = projectToLocal(anchor, meterScale, KEMARO_LNGLAT[0], KEMARO_LNGLAT[1]);
  const course = buildRiverCourse(anchor, meterScale);

  const scene = new THREE.Scene();
  const amb = new THREE.AmbientLight('#ffffff', 0.9);
  const sun = new THREE.DirectionalLight('#fff5de', 1.7);
  sun.position.set(120, 180, 90);
  scene.add(amb, sun);

  // === 1. Festival Balap Perahu Bidar (6 long Palembang racing canoes) ===
  const bidarGroup = new THREE.Group();
  bidarGroup.visible = false;
  scene.add(bidarGroup);

  const BIDAR_COUNT = 6;
  const BIDAR_COLORS = ['#dc2626', '#eab308', '#16a34a', '#2563eb', '#f97316', '#0d9488'];
  const bidarBoats = [];
  const bidarHullMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.42 });
  const bidarGoldMat = new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.3, metalness: 0.5 });
  const bidarOarMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });
  const bidarWakeMat = new THREE.MeshBasicMaterial({ color: '#e6f7ff', transparent: true, opacity: 0.58, depthWrite: false });
  const buoyMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ff4433', emissiveIntensity: 0.5 });

  const bidarHullInst = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 1.25, 29), bidarHullMat, BIDAR_COUNT);
  const bidarProwInst = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 6.5, 4), bidarGoldMat, BIDAR_COUNT);
  const bidarWakeInst = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.5, 36), bidarWakeMat, BIDAR_COUNT);
  const PADDLER_PAIRS = 6;
  const bidarOarInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(5.4, 0.28, 0.55),
    bidarOarMat,
    BIDAR_COUNT * PADDLER_PAIRS
  );
  // Race lane marker buoys
  const BUOY_COUNT = 16;
  const buoyInst = new THREE.InstancedMesh(new THREE.SphereGeometry(1.15, 8, 8), buoyMat, BUOY_COUNT);

  for (const inst of [bidarHullInst, bidarProwInst, bidarWakeInst, bidarOarInst, buoyInst]) {
    inst.frustumCulled = false;
    bidarGroup.add(inst);
  }

  for (let i = 0; i < BIDAR_COUNT; i++) {
    bidarHullInst.setColorAt(i, new THREE.Color(BIDAR_COLORS[i]));
    bidarBoats.push({
      laneOffset: -26 + i * 10.5, // tight exciting 6-lane race through Ampera's central 75m span!
      dist: Math.max(0, course.total * 0.25) + (i % 3) * 14,
      baseSpeed: 10.5 + (i % 2) * 0.65,
      phase: i * 1.15,
    });
  }
  bidarHullInst.instanceColor.needsUpdate = true;

  // === 2. Malam Kembang Api Ampera + 48 Lampion Terbang Pulau Kemaro ===
  const nightFestGroup = new THREE.Group();
  nightFestGroup.visible = false;
  scene.add(nightFestGroup);

  const SHELL_COUNT = 6;
  const SPARKS_PER_SHELL = 34;
  const TOTAL_SPARKS = SHELL_COUNT * SPARKS_PER_SHELL;
  const FW_COLORS = ['#ffd166', '#ff4d6d', '#38bdf8', '#4ade80', '#f472b6', '#fb923c'];

  const sparkGeo = new THREE.SphereGeometry(1.35, 6, 6);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, TOTAL_SPARKS);
  sparkInst.frustumCulled = false;
  nightFestGroup.add(sparkInst);

  const shells = [];
  for (let s = 0; s < SHELL_COUNT; s++) {
    const col = new THREE.Color(FW_COLORS[s % FW_COLORS.length]);
    const dirs = [];
    for (let k = 0; k < SPARKS_PER_SHELL; k++) {
      // Fibonacci sphere burst directions
      const y = 1 - (k / (SPARKS_PER_SHELL - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = k * 2.399963;
      const spd = 28 + (k % 5) * 8;
      dirs.push({ x: Math.cos(theta) * r * spd, y: y * spd, z: Math.sin(theta) * r * spd });
      sparkInst.setColorAt(s * SPARKS_PER_SHELL + k, col);
    }
    shells.push({
      age: s * 0.55,
      cycle: 3.2 + (s % 3) * 0.45,
      originX: (s - 2.5) * 48,
      originZ: ((s % 2) * 2 - 1) * 34,
      burstY: 105 + (s % 3) * 28,
      popped: false,
      dirs,
    });
  }
  sparkInst.instanceColor.needsUpdate = true;

  // 48 Glowing Sky Lanterns (Lampion) drifting up over Pulau Kemaro & Ampera
  const LANTERN_COUNT = 48;
  const lanternMat = new THREE.MeshBasicMaterial({
    color: '#ffbe55',
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lanternInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 0.85, 2.2, 8), lanternMat, LANTERN_COUNT);
  lanternInst.frustumCulled = false;
  nightFestGroup.add(lanternInst);

  const lanterns = [];
  for (let i = 0; i < LANTERN_COUNT; i++) {
    // 32 around Pulau Kemaro + 16 floating gently near Ampera/BKB
    const aroundKemaro = i < 32;
    const baseX = aroundKemaro ? kemaroPos.x : 0;
    const baseZ = aroundKemaro ? kemaroPos.z : 0;
    const spread = aroundKemaro ? 180 : 220;
    const a = i * 2.39996;
    const rad = 25 + ((i * 37) % 100) / 100 * spread;
    lanterns.push({
      baseX: baseX + Math.cos(a) * rad,
      baseZ: baseZ + Math.sin(a) * rad,
      y: 12 + (i * 17) % 130,
      speedY: 4.5 + (i % 5) * 1.1,
      swayPhase: i * 0.7,
    });
  }

  let mode = 'none'; // 'none' | 'bidar' | 'fireworks'
  let renderer = null;
  let camera = null;
  let mapRef = null;
  let lastTs = 0;
  let simTime = 0;

  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';

  function step(dt) {
    simTime += dt;
    const waterY =
      mapRef && typeof mapRef.queryTerrainElevation === 'function'
        ? Math.max(0.4, (mapRef.queryTerrainElevation(ANCHOR_LNGLAT) || 0) * 0.25 + 0.65)
        : 0.75;

    if (mode === 'bidar') {
      // Update 6 racing Perahu Bidar canoes
      for (let i = 0; i < BIDAR_COUNT; i++) {
        const b = bidarBoats[i];
        const surge = Math.sin(simTime * 1.8 + b.phase) * 1.9;
        b.dist = (b.dist + (b.baseSpeed + surge) * dt) % Math.max(1, course.total);

        const s = sampleCourse(course, b.dist);
        const lx = s.fz;
        const lz = -s.fx;
        const x = s.x + lx * b.laneOffset;
        const z = s.z + lz * b.laneOffset;
        const yaw = Math.atan2(s.fx, s.fz);

        dummy.position.set(x, waterY + 0.65, z);
        dummy.rotation.set(0, yaw, Math.sin(simTime * 6 + b.phase) * 0.04);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bidarHullInst.setMatrixAt(i, dummy.matrix);

        // Golden carved prow rising at bow
        dummy.position.set(x + s.fx * 15.8, waterY + 2.0, z + s.fz * 15.8);
        dummy.rotation.set(0.55, yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bidarProwInst.setMatrixAt(i, dummy.matrix);

        // Trailing wake
        dummy.position.set(x - s.fx * 31, waterY + 0.14, z - s.fz * 31);
        dummy.rotation.set(-Math.PI / 2, yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bidarWakeInst.setMatrixAt(i, dummy.matrix);

        // Rhythmic paddling oars along the hull
        const stroke = Math.sin(simTime * 9.5 + b.phase);
        for (let p = 0; p < PADDLER_PAIRS; p++) {
          const along = -10 + p * 4.0;
          dummy.position.set(x + s.fx * along, waterY + 1.15 + stroke * 0.3, z + s.fz * along);
          dummy.rotation.set(0, yaw + stroke * 0.25, stroke * 0.28);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          bidarOarInst.setMatrixAt(i * PADDLER_PAIRS + p, dummy.matrix);
        }
      }

      // Line of festival buoys flanking the Bidar course
      for (let k = 0; k < BUOY_COUNT; k++) {
        const side = k % 2 === 0 ? -38 : 38;
        const d = ((Math.floor(k / 2) + 0.5) / (BUOY_COUNT / 2)) * course.total;
        const s = sampleCourse(course, d);
        dummy.position.set(s.x + s.fz * side, waterY + 0.8 + Math.sin(simTime * 3 + k) * 0.15, s.z - s.fx * side);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        buoyInst.setMatrixAt(k, dummy.matrix);
      }

      bidarHullInst.instanceMatrix.needsUpdate = true;
      bidarProwInst.instanceMatrix.needsUpdate = true;
      bidarWakeInst.instanceMatrix.needsUpdate = true;
      bidarOarInst.instanceMatrix.needsUpdate = true;
      buoyInst.instanceMatrix.needsUpdate = true;
    }

    if (mode === 'fireworks') {
      // 3D Fireworks over Jembatan Ampera
      for (let s = 0; s < SHELL_COUNT; s++) {
        const sh = shells[s];
        sh.age += dt;
        if (sh.age >= sh.cycle) {
          sh.age -= sh.cycle;
          sh.popped = false;
        }
        const launchDur = 0.72;
        for (let k = 0; k < SPARKS_PER_SHELL; k++) {
          const idx = s * SPARKS_PER_SHELL + k;
          if (sh.age < launchDur) {
            if (k === 0) {
              const u = sh.age / launchDur;
              const ease = 1 - (1 - u) * (1 - u);
              dummy.position.set(sh.originX, 24 + ease * (sh.burstY - 24), sh.originZ);
              dummy.scale.set(1.1, 2.4, 1.1);
            } else {
              dummy.position.set(0, -500, 0);
              dummy.scale.set(0.001, 0.001, 0.001);
            }
          } else {
            if (!sh.popped) {
              sh.popped = true;
              ambience?.playFireworkPop?.();
            }
            const bt = sh.age - launchDur;
            const life = sh.cycle - launchDur;
            const fade = Math.max(0, 1 - bt / life);
            const drag = 1 - Math.exp(-bt * 1.45);
            const dir = sh.dirs[k];
            const px = sh.originX + dir.x * drag * 1.65;
            const py = sh.burstY + dir.y * drag * 1.45 - 11.5 * bt * bt;
            const pz = sh.originZ + dir.z * drag * 1.65;
            const sc = Math.max(0.01, fade * 1.35);
            dummy.position.set(px, Math.max(5, py), pz);
            dummy.scale.set(sc, sc, sc);
          }
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          sparkInst.setMatrixAt(idx, dummy.matrix);
        }
      }
      sparkInst.instanceMatrix.needsUpdate = true;

      // Floating glowing sky lanterns (Pulau Kemaro + Ampera)
      for (let i = 0; i < LANTERN_COUNT; i++) {
        const l = lanterns[i];
        l.y += l.speedY * dt;
        if (l.y > 165) l.y = 10;
        const sx = Math.sin(simTime * 0.8 + l.swayPhase) * 8;
        const sz = Math.cos(simTime * 0.65 + l.swayPhase) * 8;
        const flicker = 0.9 + 0.16 * Math.sin(simTime * 7 + l.swayPhase);
        dummy.position.set(l.baseX + sx, l.y, l.baseZ + sz);
        dummy.rotation.set(0, simTime * 0.4 + l.swayPhase, 0);
        dummy.scale.set(flicker, flicker, flicker);
        dummy.updateMatrix();
        lanternInst.setMatrixAt(i, dummy.matrix);
      }
      lanternInst.instanceMatrix.needsUpdate = true;
    }
  }

  function setMode(nextMode) {
    mode = nextMode === 'bidar' || nextMode === 'fireworks' ? nextMode : 'none';
    bidarGroup.visible = mode === 'bidar';
    nightFestGroup.visible = mode === 'fireworks';
    lastTs = 0;
    if (mode !== 'none') step(0.016);
    if (mapRef) mapRef.triggerRepaint();
  }

  const customLayer = {
    id: 'palembang-festival-3d',
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
      if (!renderer || !camera || mode === 'none') return;
      const now = performance.now();
      const dt = lastTs > 0 ? Math.min(0.08, Math.max(0.002, (now - lastTs) / 1000)) : 0.016;
      lastTs = now;

      step(dt);

      const projArr = options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix || options;
      const m = new THREE.Matrix4().fromArray(projArr);
      renderer.resetState();
      camera.projectionMatrix = m.multiply(anchorMatrix);
      renderer.render(scene, camera);

      if (mapRef) mapRef.triggerRepaint();
    },
    onRemove() {
      mode = 'none';
      mapRef = null;
      renderer = null;
    },
  };

  return {
    layer: customLayer,
    setMode,
    getMode: () => mode,
  };
}
