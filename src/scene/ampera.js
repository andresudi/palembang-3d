import * as THREE from 'three';

function addBeam(parent, p1, p2, thickness, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildTower(zPos, materials) {
  const tower = new THREE.Group();
  tower.position.set(0, 0, zPos);

  const { steelRed, steelDarkRed, concrete, accentGold, lampGlow, beaconMat } = materials;

  // River pier with streamlined concrete cutwater
  const pierBase = new THREE.Mesh(new THREE.BoxGeometry(12.2, 14.5, 5.4), concrete);
  pierBase.position.set(0, 2.8, 0);
  pierBase.castShadow = true;
  pierBase.receiveShadow = true;
  tower.add(pierBase);

  const pierCap = new THREE.Mesh(new THREE.BoxGeometry(13.0, 1.1, 6.2), concrete);
  pierCap.position.set(0, 10.1, 0);
  tower.add(pierCap);

  // Cutwater noses (upstream -X and downstream +X)
  for (const dirX of [-1, 1]) {
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 14.5, 4), concrete);
    nose.rotation.y = Math.PI / 4;
    nose.scale.set(0.85, 1, 0.72);
    nose.position.set(dirX * 6.0, 2.8, 0);
    tower.add(nose);
  }

  // Twin vertical H-portal steel legs (deck y=10.5 up to y=37.5)
  const legX = 4.9;
  const legBottom = 10.2;
  const legTop = 37.6;
  const legHeight = legTop - legBottom;

  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.45, legHeight, 2.2), steelRed);
    leg.position.set(sx * legX, legBottom + legHeight / 2, 0);
    leg.castShadow = true;
    tower.add(leg);

    // Flange detail ribs
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.72, legHeight, 0.45), steelDarkRed);
    rib.position.set(sx * legX, legBottom + legHeight / 2, 0);
    tower.add(rib);

    // Decorative vertical LED strip for Senja / Malam
    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, legHeight - 2.0, 0.2), lampGlow);
    lightStrip.position.set(sx * (legX + 0.8), legBottom + legHeight / 2, 0);
    tower.add(lightStrip);
  }

  // Cross portals & diagonal X-bracing above clearance (y = 18.5 .. 37.0)
  const portalLevels = [18.5, 25.0, 31.2, 36.8];
  for (const py of portalLevels) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(legX * 2 + 0.6, 1.05, 1.5), steelRed);
    beam.position.set(0, py, 0);
    beam.castShadow = true;
    tower.add(beam);
  }

  for (let i = 0; i < portalLevels.length - 1; i++) {
    const y0 = portalLevels[i];
    const y1 = portalLevels[i + 1];
    addBeam(
      tower,
      new THREE.Vector3(-legX + 0.5, y0, 0),
      new THREE.Vector3(legX - 0.5, y1, 0),
      0.34,
      steelDarkRed
    );
    addBeam(
      tower,
      new THREE.Vector3(legX - 0.5, y0, 0),
      new THREE.Vector3(-legX + 0.5, y1, 0),
      0.34,
      steelDarkRed
    );
  }

  // Top machinery & sheave housing
  const crown = new THREE.Mesh(new THREE.BoxGeometry(11.6, 2.6, 3.2), steelRed);
  crown.position.set(0, 38.8, 0);
  crown.castShadow = true;
  tower.add(crown);

  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.45, 3.6), accentGold);
  roofTrim.position.set(0, 40.2, 0);
  tower.add(roofTrim);

  // Aviation warning beacons on top corners
  for (const sx of [-1, 1]) {
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), beaconMat);
    beacon.position.set(sx * legX, 40.7, 0);
    tower.add(beacon);
  }

  // Counterweights inside tower bays (visible steel blocks)
  for (const sx of [-1, 1]) {
    const cw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.4), steelDarkRed);
    cw.position.set(sx * (legX - 1.25), 21.8, 0);
    tower.add(cw);
  }

  return tower;
}

function buildLiftSpanTruss(zStart, zEnd, materials) {
  const truss = new THREE.Group();
  const { steelRed, steelDarkRed } = materials;
  const deckY = 11.0;
  const topY = 15.6;
  const xSpan = 4.65;
  const bays = 6;
  const len = zEnd - zStart;
  const step = len / bays;

  for (const sx of [-1, 1]) {
    const x = sx * xSpan;
    // Top & bottom chords
    const topChord = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, len), steelRed);
    topChord.position.set(x, topY, (zStart + zEnd) / 2);
    topChord.castShadow = true;
    truss.add(topChord);

    const botChord = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, len), steelDarkRed);
    botChord.position.set(x, deckY, (zStart + zEnd) / 2);
    truss.add(botChord);

    // Vertical & diagonal truss members
    for (let i = 0; i <= bays; i++) {
      const z = zStart + i * step;
      const vert = new THREE.Mesh(new THREE.BoxGeometry(0.36, topY - deckY, 0.36), steelRed);
      vert.position.set(x, (topY + deckY) / 2, z);
      vert.castShadow = true;
      truss.add(vert);

      if (i < bays) {
        const zNext = z + step;
        const p1 = new THREE.Vector3(x, i % 2 === 0 ? deckY : topY, z);
        const p2 = new THREE.Vector3(x, i % 2 === 0 ? topY : deckY, zNext);
        addBeam(truss, p1, p2, 0.3, steelRed);
      }
    }
  }

  // Overhead cross struts linking left & right trusses
  for (let i = 1; i < bays; i++) {
    const z = zStart + i * step;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(xSpan * 2, 0.38, 0.38), steelRed);
    cross.position.set(0, topY, z);
    cross.castShadow = true;
    truss.add(cross);
  }

  return truss;
}

export function createAmperaBridge(scene, env) {
  const group = new THREE.Group();
  group.name = 'JembatanAmpera';

  const materials = {
    steelRed: new THREE.MeshStandardMaterial({ color: '#b8332a', roughness: 0.52, metalness: 0.25 }),
    steelDarkRed: new THREE.MeshStandardMaterial({ color: '#8f241d', roughness: 0.6, metalness: 0.3 }),
    asphalt: new THREE.MeshStandardMaterial({ color: '#2e3239', roughness: 0.88 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: '#b5afa4', roughness: 0.8 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#c4beb3', roughness: 0.85 }),
    cable: new THREE.MeshStandardMaterial({ color: '#585e66', roughness: 0.4, metalness: 0.6 }),
    accentGold: new THREE.MeshStandardMaterial({ color: '#d8ad5c', roughness: 0.45, metalness: 0.35 }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: '#ffe8b3',
      emissive: '#ffaa3b',
      emissiveIntensity: 0.15,
    }),
    beaconMat: new THREE.MeshStandardMaterial({
      color: '#ff4d3b',
      emissive: '#ff2b1a',
      emissiveIntensity: 0.4,
    }),
  };

  // Main horizontal deck (z = -64 to +64) at y = 10.5
  const flatLen = 128;
  const deckGroup = new THREE.Group();

  const mainSlab = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.0, flatLen), materials.steelRed);
  mainSlab.position.set(0, 10.1, 0);
  mainSlab.castShadow = true;
  mainSlab.receiveShadow = true;
  deckGroup.add(mainSlab);

  const road = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, flatLen), materials.asphalt);
  road.position.set(0, 10.65, 0);
  road.receiveShadow = true;
  deckGroup.add(road);

  // Dashed white lane line
  const stripeMat = new THREE.MeshBasicMaterial({ color: '#efe9d8' });
  for (let z = -60; z <= 60; z += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 2.8), stripeMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 10.74, z);
    deckGroup.add(dash);
  }

  // Pedestrian sidewalks & red railings
  for (const sx of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, flatLen), materials.sidewalk);
    walk.position.set(sx * 3.95, 10.72, 0);
    deckGroup.add(walk);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, flatLen), materials.steelRed);
    rail.position.set(sx * 4.48, 11.15, 0);
    deckGroup.add(rail);
  }
  group.add(deckGroup);

  // Sloped approach ramps connecting y=10.5 at z=±64 down to ground y=3.2 at z=±114
  for (const dirZ of [-1, 1]) {
    const rampLen = 52;
    const dy = 10.5 - 3.35;
    const angle = Math.atan2(dy, rampLen);
    const hyp = Math.hypot(rampLen, dy);

    const ramp = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.9, hyp), materials.concrete);
    slab.castShadow = true;
    slab.receiveShadow = true;
    ramp.add(slab);

    const rampRoad = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, hyp), materials.asphalt);
    rampRoad.position.y = 0.5;
    rampRoad.receiveShadow = true;
    ramp.add(rampRoad);

    ramp.position.set(0, (10.1 + 3.15) / 2, dirZ * (64 + rampLen / 2 - 0.5));
    ramp.rotation.x = dirZ > 0 ? angle : -angle;
    group.add(ramp);
  }

  // Approach piers
  for (const zPier of [-82, -62, -44, 44, 62, 82]) {
    const isSloped = Math.abs(zPier) > 64;
    const pierTopY = isSloped ? 7.6 : 10.0;
    const pierH = pierTopY + 3.5;
    for (const sx of [-2.8, 2.8]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, pierH, 8), materials.concrete);
      col.position.set(sx, pierTopY - pierH / 2, zPier);
      col.castShadow = true;
      group.add(col);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.85, 1.6), materials.concrete);
    cap.position.set(0, pierTopY - 0.2, zPier);
    group.add(cap);
  }

  // Twin H-portal towers at z = -19 and z = +19
  group.add(buildTower(-19, materials));
  group.add(buildTower(19, materials));

  // Central lift span truss
  group.add(buildLiftSpanTruss(-18.2, 18.2, materials));

  // Approach side trusses flanking towers
  group.add(buildLiftSpanTruss(-43, -20, materials));
  group.add(buildLiftSpanTruss(20, 43, materials));

  // Suspension / lift cables from tower sheaves down to central span corners
  for (const tz of [-19, 19]) {
    const innerZ = tz > 0 ? 17.5 : -17.5;
    for (const sx of [-1, 1]) {
      const xTop = sx * 4.55;
      addBeam(
        group,
        new THREE.Vector3(xTop, 37.8, tz),
        new THREE.Vector3(xTop, 15.5, innerZ),
        0.13,
        materials.cable
      );
      addBeam(
        group,
        new THREE.Vector3(xTop, 37.8, tz),
        new THREE.Vector3(xTop, 15.5, tz > 0 ? 11.5 : -11.5),
        0.11,
        materials.cable
      );
    }
  }

  // Rhythmic streetlamps along the deck
  const poleMat = new THREE.MeshStandardMaterial({ color: '#8f241d', roughness: 0.6 });
  for (let z = -58; z <= 58; z += 14.5) {
    if (Math.abs(Math.abs(z) - 19) < 3.5) continue;
    for (const sx of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 6), poleMat);
      pole.position.set(sx * 4.2, 12.5, z);
      group.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.1), poleMat);
      arm.position.set(sx * 3.8, 14.25, z);
      group.add(arm);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), materials.lampGlow);
      bulb.position.set(sx * 3.4, 14.15, z);
      group.add(bulb);
    }
  }

  // Stylized moving cars & Trans Musi buses along the bridge
  const vehicles = [];
  const carColors = ['#f2eee6', '#335c81', '#d69f38', '#457b5b', '#c94c4c'];
  for (let i = 0; i < 6; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const isBus = i === 1 || i === 4;
    const vGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(isBus ? 1.5 : 1.15, isBus ? 1.2 : 0.75, isBus ? 4.4 : 2.3),
      new THREE.MeshStandardMaterial({
        color: isBus ? '#1f6fb2' : carColors[i % carColors.length],
        roughness: 0.55,
      })
    );
    body.position.y = isBus ? 0.68 : 0.45;
    body.castShadow = true;
    vGroup.add(body);

    if (!isBus) {
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.45, 1.25),
        new THREE.MeshStandardMaterial({ color: "#27303a", roughness: 0.4 })
      );
      cabin.position.y = 0.96;
      vGroup.add(cabin);
    }
    const headLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.12), materials.lampGlow);
    headLight.position.set(0, 0.42, dir * (isBus ? 2.22 : 1.16));
    vGroup.add(headLight);

    vGroup.position.set(dir * 1.45, 10.74, -85 + i * 32);
    group.add(vGroup);
    vehicles.push({ mesh: vGroup, z: -85 + i * 32, dir, speed: 12 + (i % 3) * 3 });
  }

  const bridgeWarmLight = new THREE.PointLight("#ff9e44", 0, 110, 1.4);
  bridgeWarmLight.position.set(0, 22, 0);
  group.add(bridgeWarmLight);

  env.onLightingChange((cfg) => {
    bridgeWarmLight.intensity = cfg.nightGlow * 3.8;
    materials.lampGlow.emissiveIntensity = 0.15 + cfg.nightGlow * 2.6;
    materials.beaconMat.emissiveIntensity = 0.4 + cfg.nightGlow * 2.2;
  });

  scene.add(group);

  return {
    group,
    update(elapsed, delta) {
      for (const v of vehicles) {
        v.z += v.dir * v.speed * delta;
        if (v.z > 108) v.z = -108;
        if (v.z < -108) v.z = 108;

        // Compute Y matching flat deck [-64..64] and sloped ramps
        let y = 10.74;
        const absZ = Math.abs(v.z);
        if (absZ > 64) {
          const t = Math.min(1, (absZ - 64) / 50);
          y = 10.74 - t * 7.15;
        }
        v.mesh.position.z = v.z;
        v.mesh.position.y = y;
      }
    },
  };
}
