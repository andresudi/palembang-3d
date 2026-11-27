import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';

function addBeam(parent, p1, p2, thickness, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(mesh);
  return mesh;
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

export function createHeroLandmarksCustomLayer() {
  const mats = {
    steelRed: new THREE.MeshStandardMaterial({ color: '#bd3228', roughness: 0.46, metalness: 0.32 }),
    steelDarkRed: new THREE.MeshStandardMaterial({ color: '#8f221b', roughness: 0.55, metalness: 0.35 }),
    crimson: new THREE.MeshStandardMaterial({ color: '#c42622', roughness: 0.5 }),
    asphalt: new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.9 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#c8c2b6', roughness: 0.85 }),
    whiteConcrete: new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.68 }),
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

  const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

  function setLightingMode(mode) {
    const isNight = mode === 'malam';
    const isSunset = mode === 'senja';
    const nightGlow = isNight ? 1.0 : isSunset ? 0.72 : 0.0;

    mats.warmGlow.emissiveIntensity = 0.25 + nightGlow * 2.8;
    mats.cyanGlow.emissiveIntensity = 0.25 + nightGlow * 2.8;
    mats.beacon.emissiveIntensity = 0.6 + nightGlow * 2.4;

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
