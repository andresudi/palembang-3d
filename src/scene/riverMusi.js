import * as THREE from 'three';

export const GROUND_Y = 3.2;

export function getRiverBoundsAt(x) {
  const centerZ = Math.sin(x * 0.0085) * 8 - Math.sin(x * 0.0032) * 5;
  const kemaroWiden = 26 * Math.exp(-Math.pow((x - 215) / 88, 2));
  const halfWidth = 42 + kemaroWiden;
  return {
    centerZ,
    halfWidth,
    northEdgeZ: centerZ - halfWidth,
    southEdgeZ: centerZ + halfWidth,
  };
}

function buildBankMesh({ side, xMin, xMax, zOuter, xSegments, matGround }) {
  // side: 'north' (-Z) or 'south' (+Z)
  const positions = [];
  const uvs = [];
  const indices = [];

  // Cross-section rows from outer edge -> inner promenade -> quay wall lip -> underwater toe
  const numCols = xSegments + 1;
  const rowsPerCol = 5;

  for (let i = 0; i <= xSegments; i++) {
    const t = i / xSegments;
    const x = xMin + t * (xMax - xMin);
    const bounds = getRiverBoundsAt(x);
    const edgeZ = side === 'north' ? bounds.northEdgeZ : bounds.southEdgeZ;
    const dir = side === 'north' ? -1 : 1;

    // 0: deep inland ground
    const pts = [
      { z: zOuter, y: GROUND_Y },
      // 1: avenue back edge
      { z: edgeZ + dir * 18, y: GROUND_Y },
      // 2: quay lip
      { z: edgeZ, y: GROUND_Y + 0.15 },
      // 3: retaining wall toe just below waterline
      { z: edgeZ - dir * 0.6, y: -1.6 },
      // 4: riverbed under edge
      { z: edgeZ - dir * 4.5, y: -3.8 },
    ];

    for (let r = 0; r < rowsPerCol; r++) {
      positions.push(x, pts[r].y, pts[r].z);
      uvs.push(t * 20, r / (rowsPerCol - 1));
    }
  }

  for (let i = 0; i < xSegments; i++) {
    for (let r = 0; r < rowsPerCol - 1; r++) {
      const a = i * rowsPerCol + r;
      const b = (i + 1) * rowsPerCol + r;
      const c = (i + 1) * rowsPerCol + (r + 1);
      const d = i * rowsPerCol + (r + 1);

      if (side === 'north') {
        indices.push(a, d, b, b, d, c);
      } else {
        indices.push(a, b, d, b, c, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, matGround);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function buildQuayStrip({ side, xMin, xMax, xSegments, material, width, yOffset }) {
  const positions = [];
  const indices = [];
  const dir = side === 'north' ? -1 : 1;

  for (let i = 0; i <= xSegments; i++) {
    const x = xMin + (i / xSegments) * (xMax - xMin);
    const bounds = getRiverBoundsAt(x);
    const edgeZ = side === 'north' ? bounds.northEdgeZ : bounds.southEdgeZ;

    positions.push(x, GROUND_Y + yOffset, edgeZ);
    positions.push(x, GROUND_Y + yOffset, edgeZ + dir * width);
  }

  for (let i = 0; i < xSegments; i++) {
    const a = i * 2;
    const b = (i + 1) * 2;
    const c = (i + 1) * 2 + 1;
    const d = i * 2 + 1;
    if (side === 'north') {
      indices.push(a, b, d, b, c, d);
    } else {
      indices.push(a, d, b, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createKetekBoat(canopyColor) {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: '#6b4226', roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#e6dcc8', roughness: 0.7 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.75 });
  const wakeMat = new THREE.MeshBasicMaterial({
    color: '#d8ecef',
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  // Slender tapered wooden hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.7, 1.8), hullMat);
  hull.position.y = 0.28;
  hull.castShadow = true;
  group.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.6, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.scale.set(0.7, 1, 0.55);
  bow.position.set(5.1, 0.36, 0);
  group.add(bow);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 1.55), trimMat);
  deck.position.y = 0.65;
  group.add(deck);

  // Curved canopy
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 4.4, 8, 1, false, 0, Math.PI),
    canopyMat
  );
  canopy.rotation.z = Math.PI / 2;
  canopy.rotation.x = -Math.PI / 2;
  canopy.position.set(-0.3, 1.32, 0);
  canopy.castShadow = true;
  group.add(canopy);

  // Subtle trailing V-wake
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.2), wakeMat);
  wake.rotation.x = -Math.PI / 2;
  wake.position.set(-6.4, 0.04, 0);
  group.add(wake);

  // Tiny warm stern lamp for night
  const lampMat = new THREE.MeshStandardMaterial({
    color: '#ffd98e',
    emissive: '#ffb84d',
    emissiveIntensity: 0.1,
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lampMat);
  lamp.position.set(2.2, 2.05, 0);
  group.add(lamp);

  return { group, lampMat };
}

function createCoalBarge() {
  const group = new THREE.Group();

  const bargeHullMat = new THREE.MeshStandardMaterial({ color: '#373b42', roughness: 0.85 });
  const coalMat = new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.95 });
  const tugMat = new THREE.MeshStandardMaterial({ color: '#c84b31', roughness: 0.7 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: '#f2eee6', roughness: 0.65 });
  const navLightMat = new THREE.MeshStandardMaterial({
    color: '#ffe5a3',
    emissive: '#ffaa33',
    emissiveIntensity: 0.1,
  });

  // Barge hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(20, 1.8, 7.2), bargeHullMat);
  hull.position.set(3.5, 0.75, 0);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Mounded coal cargo
  const coal1 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.6, 5), coalMat);
  coal1.scale.set(1.6, 1, 0.85);
  coal1.position.set(0.5, 2.1, 0);
  coal1.castShadow = true;
  group.add(coal1);

  const coal2 = new THREE.Mesh(new THREE.ConeGeometry(4.0, 2.4, 5), coalMat);
  coal2.scale.set(1.5, 1, 0.85);
  coal2.position.set(6.8, 2.0, 0);
  coal2.castShadow = true;
  group.add(coal2);

  // Tugboat pushing behind
  const tugHull = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.5, 3.6), tugMat);
  tugHull.position.set(-10.5, 0.7, 0);
  tugHull.castShadow = true;
  group.add(tugHull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 2.5), cabinMat);
  cabin.position.set(-10.2, 2.4, 0);
  cabin.castShadow = true;
  group.add(cabin);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), navLightMat);
  beacon.position.set(-10.2, 3.7, 0);
  group.add(beacon);

  return { group, lampMat: navLightMat };
}

function createPier(x, zEdge, dirToWater) {
  const pier = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#785236', roughness: 0.88 });
  const pilMat = new THREE.MeshStandardMaterial({ color: '#4c3828', roughness: 0.9 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.35, 10), woodMat);
  deck.position.set(x, 1.45, zEdge + dirToWater * 4.8);
  deck.castShadow = true;
  deck.receiveShadow = true;
  pier.add(deck);

  for (const dx of [-2.2, 2.2]) {
    for (const dz of [2.0, 5.5, 9.0]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.2, 6), pilMat);
      pile.position.set(x + dx, 0.2, zEdge + dirToWater * dz);
      pier.add(pile);
    }
  }
  return pier;
}

export function createRiverMusi(scene, env) {
  const group = new THREE.Group();
  group.name = 'SungaiMusi';

  // Riverbed dark base so no light leaks
  const bedMat = new THREE.MeshStandardMaterial({ color: '#1b3133', roughness: 1.0 });
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(920, 260), bedMat);
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = -4.2;
  group.add(bed);

  // Animated water surface shader
  const waterUniforms = {
    uTime: { value: 0 },
    uSunDir: { value: env.getSunDirection() },
    uWaterDeep: { value: new THREE.Color('#235156') },
    uWaterShallow: { value: new THREE.Color('#3b6e6a') },
    uSkyHorizon: { value: new THREE.Color('#c7e1f0') },
    uSunColor: { value: new THREE.Color('#fff4db') },
    uNightGlow: { value: 0.0 },
    uFogColor: { value: new THREE.Color('#c6dfed') },
    uFogDensity: { value: 0.00105 },
  };

  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying float vWave;
      void main() {
        vec3 pos = position;
        float w1 = sin(pos.x * 0.09 + uTime * 1.35) * cos(pos.y * 0.14 + uTime * 0.9);
        float w2 = sin(pos.x * 0.22 - uTime * 1.8 + pos.y * 0.18);
        pos.z += (w1 * 0.12 + w2 * 0.06);
        vWave = w1 * 0.5 + w2 * 0.5;
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uWaterDeep;
      uniform vec3 uWaterShallow;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSunColor;
      uniform float uNightGlow;
      uniform vec3 uFogColor;
      uniform float uFogDensity;

      varying vec3 vWorldPos;
      varying float vWave;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);

        // Procedural ripple normal perturbation
        float nx = cos(vWorldPos.x * 0.16 + uTime * 1.6) * 0.09
                 + cos(vWorldPos.x * 0.37 - vWorldPos.z * 0.25 + uTime * 2.1) * 0.05;
        float nz = sin(vWorldPos.z * 0.21 + uTime * 1.2) * 0.08
                 + sin(vWorldPos.x * 0.28 + vWorldPos.z * 0.32 - uTime * 1.7) * 0.05;
        vec3 normal = normalize(vec3(nx, 1.0, nz));

        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
        vec3 baseCol = mix(uWaterDeep, uWaterShallow, 0.38 + 0.22 * vWave);
        vec3 col = mix(baseCol, uSkyHorizon, clamp(fresnel * 0.65, 0.0, 0.72));

        // Sun / Moon specular shimmer
        vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 58.0);
        col += uSunColor * spec * (0.85 - 0.35 * uNightGlow);

        // Warm Ampera bridge reflection band on river around x = 0 in dusk/night
        float amperaProx = exp(-pow(vWorldPos.x / 18.0, 2.0)) * exp(-pow(vWorldPos.z / 38.0, 2.0));
        float rippleBand = 0.6 + 0.4 * sin(vWorldPos.z * 0.9 + uTime * 3.0);
        col += vec3(0.95, 0.42, 0.22) * amperaProx * rippleBand * uNightGlow * 0.45;

        // Exponential squared fog matching Three.js FogExp2
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(920, 240, 140, 40), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0;
  waterMesh.name = 'WaterSurface';
  group.add(waterMesh);

  // Land terrain meshes (Seberang Ilir north, Seberang Ulu south)
  const groundMat = new THREE.MeshStandardMaterial({ color: '#587447', roughness: 0.94 });
  const quayMat = new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: 0.85 });

  const northBank = buildBankMesh({
    side: 'north',
    xMin: -460,
    xMax: 460,
    zOuter: -280,
    xSegments: 115,
    matGround: groundMat,
  });
  northBank.name = 'SeberangIlirGround';
  group.add(northBank);

  const southBank = buildBankMesh({
    side: 'south',
    xMin: -460,
    xMax: 460,
    zOuter: 280,
    xSegments: 115,
    matGround: groundMat,
  });
  southBank.name = 'SeberangUluGround';
  group.add(southBank);

  // Paved waterfront promenades along both banks
  group.add(
    buildQuayStrip({
      side: 'north',
      xMin: -460,
      xMax: 460,
      xSegments: 115,
      material: quayMat,
      width: 5.5,
      yOffset: 0.16,
    })
  );
  group.add(
    buildQuayStrip({
      side: 'south',
      xMin: -460,
      xMax: 460,
      xSegments: 115,
      material: quayMat,
      width: 4.5,
      yOffset: 0.16,
    })
  );

  // Timber/concrete landing piers (Dermaga Pasar 16 Ilir & Ulu)
  const ilir16Bounds = getRiverBoundsAt(48);
  group.add(createPier(48, ilir16Bounds.northEdgeZ, 1));
  const uluBounds = getRiverBoundsAt(-78);
  group.add(createPier(-78, uluBounds.southEdgeZ, -1));

  // River traffic: Perahu Ketek & Coal Barges
  const vessels = [];
  const ketekConfigs = [
    { x: -165, laneOffset: -10, speed: 7.5, dir: 1, color: "#276fbf" },
    { x: 95, laneOffset: -12.5, speed: 8.2, dir: -1, color: "#c44536" },
    { x: -55, laneOffset: 12.5, speed: 6.8, dir: 1, color: "#2d8a6e" },
    { x: 145, laneOffset: 26, speed: 7.4, dir: -1, color: "#d4902a" },
    { x: -245, laneOffset: -25.5, speed: 6.2, dir: 1, color: "#276fbf" },
  ];

  for (const cfg of ketekConfigs) {
    const boat = createKetekBoat(cfg.color);
    boat.group.rotation.y = cfg.dir > 0 ? 0 : Math.PI;
    group.add(boat.group);
    vessels.push({ ...cfg, ...boat, phase: Math.random() * Math.PI * 2 });
  }

  const bargeConfigs = [
    { x: -95, laneOffset: -4, speed: 3.6, dir: 1 },
    { x: 265, laneOffset: 6, speed: 3.2, dir: -1 },
  ];
  for (const cfg of bargeConfigs) {
    const barge = createCoalBarge();
    barge.group.rotation.y = cfg.dir > 0 ? 0 : Math.PI;
    group.add(barge.group);
    vessels.push({ ...cfg, ...barge, phase: Math.random() * Math.PI * 2 });
  }

  env.onLightingChange((cfg) => {
    waterUniforms.uSunDir.value.copy(cfg.sunPosition).normalize();
    waterUniforms.uWaterDeep.value.copy(cfg.waterDeep);
    waterUniforms.uWaterShallow.value.copy(cfg.waterShallow);
    waterUniforms.uSkyHorizon.value.copy(cfg.skyHorizon);
    waterUniforms.uSunColor.value.copy(cfg.sunColor);
    waterUniforms.uNightGlow.value = cfg.nightGlow;
    waterUniforms.uFogColor.value.copy(cfg.fogColor);
    waterUniforms.uFogDensity.value = cfg.fogDensity;

    for (const v of vessels) {
      v.lampMat.emissiveIntensity = 0.2 + cfg.nightGlow * 2.2;
    }
  });

  scene.add(group);

  return {
    group,
    update(elapsed, delta) {
      waterUniforms.uTime.value = elapsed;

      for (const v of vessels) {
        v.x += v.dir * v.speed * delta;
        if (v.x > 340) v.x = -340;
        if (v.x < -340) v.x = 340;

        const bounds = getRiverBoundsAt(v.x);
        // Smoothly steer around Pulau Kemaro & its north jetty (x in [165..265]) with full hull clearance
        const kemaroProximity = Math.exp(-Math.pow((v.x - 213) / 64, 2));
        const safeOffset =
          v.laneOffset >= 0
            ? v.laneOffset + kemaroProximity * 32
            : v.laneOffset - kemaroProximity * 36;

        v.group.position.x = v.x;
        v.group.position.z = bounds.centerZ + safeOffset;
        v.group.position.y = Math.sin(elapsed * 2.2 + v.phase) * 0.06;
        v.group.rotation.z = Math.sin(elapsed * 1.8 + v.phase) * 0.015;
      }
    },
  };
}
