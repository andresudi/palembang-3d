import * as THREE from 'three';

function createTropicalTree(x, y, z, scale, foliageMat, trunkMat) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.36 * scale, 2.8 * scale, 6), trunkMat);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * scale, 1), foliageMat);
  c1.position.set(0, 3.3 * scale, 0);
  c1.castShadow = true;
  g.add(c1);

  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35 * scale, 1), foliageMat);
  c2.position.set(0.95 * scale, 2.7 * scale, 0.5 * scale);
  c2.castShadow = true;
  g.add(c2);

  g.position.set(x, y, z);
  return g;
}

export function createPulauKemaro(scene, env) {
  const group = new THREE.Group();
  group.name = 'PulauKemaro';

  const centerX = 215;
  const centerZ = 4.5;

  const sandMat = new THREE.MeshStandardMaterial({ color: '#c9b88b', roughness: 0.92 });
  const grassMat = new THREE.MeshStandardMaterial({ color: '#4c7c44', roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#cbc4b6', roughness: 0.85 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: '#c82824', roughness: 0.58 });
  const creamMat = new THREE.MeshStandardMaterial({ color: '#f3efe3', roughness: 0.72 });
  const eaveMat = new THREE.MeshStandardMaterial({ color: '#9c231e', roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d8a328', roughness: 0.38, metalness: 0.45 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: '#2f6b3b', roughness: 0.85 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#614129', roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.85 });
  const lanternGlow = new THREE.MeshStandardMaterial({
    color: '#ffe29a',
    emissive: '#ff962e',
    emissiveIntensity: 0.25,
  });

  // Layered organic island base (oval ~64 x 28)
  const shore = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 16.5, 2.2, 24), sandMat);
  shore.scale.set(2.15, 1, 0.96);
  shore.position.set(centerX, 0.2, centerZ);
  shore.receiveShadow = true;
  group.add(shore);

  const turf = new THREE.Mesh(new THREE.CylinderGeometry(12.8, 14.2, 1.2, 24), grassMat);
  turf.scale.set(2.15, 1, 0.94);
  turf.position.set(centerX, 1.65, centerZ);
  turf.receiveShadow = true;
  group.add(turf);

  // Stone plaza apron around Pagoda & Klenteng
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(36, 0.36, 15), stoneMat);
  plaza.position.set(centerX - 1, 2.25, centerZ);
  plaza.receiveShadow = true;
  group.add(plaza);

  // --- 9-Story Octagonal Pagoda (x = centerX - 12, z = centerZ) ---
  const pagodaX = centerX - 12;
  const pagodaZ = centerZ;
  const pagoda = new THREE.Group();
  pagoda.position.set(pagodaX, 2.35, pagodaZ);

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 7.0, 1.3, 8), stoneMat);
  plinth.position.y = 0.65;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  pagoda.add(plinth);

  let curY = 1.3;
  const stories = 9;
  for (let i = 0; i < stories; i++) {
    const t = i / (stories - 1);
    const radius = THREE.MathUtils.lerp(4.6, 1.85, t);
    const storyH = THREE.MathUtils.lerp(3.2, 2.35, t);

    // Cream octagonal core wall
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.94, radius, storyH, 8), creamMat);
    wall.position.y = curY + storyH / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    pagoda.add(wall);

    // Subtle warm window band (glowing in dusk/night)
    const winBand = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.97, radius * 0.97, storyH * 0.34, 8), lanternGlow);
    winBand.position.y = curY + storyH * 0.52;
    pagoda.add(winBand);

    // 8 crimson corner columns
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, storyH, 6), crimsonMat);
      col.position.set(Math.cos(ang) * radius * 0.96, curY + storyH / 2, Math.sin(ang) * radius * 0.96);
      pagoda.add(col);
    }

    // Flared octagonal upturned pagoda eave roof
    const eaveRadius = radius * 1.42;
    const eave = new THREE.Mesh(new THREE.ConeGeometry(eaveRadius, 1.25, 8), i === stories - 1 ? goldMat : eaveMat);
    eave.position.y = curY + storyH + 0.32;
    eave.castShadow = true;
    pagoda.add(eave);

    const eaveTrim = new THREE.Mesh(new THREE.CylinderGeometry(eaveRadius * 1.01, eaveRadius * 1.03, 0.16, 8), goldMat);
    eaveTrim.position.y = curY + storyH - 0.18;
    pagoda.add(eaveTrim);

    curY += storyH + 0.35;
  }

  // Ornate golden spire at pagoda top
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 1.4, 8), goldMat);
  spireBase.position.y = curY + 0.9;
  pagoda.add(spireBase);

  const spireNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.8, 8), goldMat);
  spireNeedle.position.y = curY + 3.4;
  spireNeedle.castShadow = true;
  pagoda.add(spireNeedle);

  group.add(pagoda);

  // --- Klenteng Hok Tjing Rio Pavilion (x = centerX + 10) ---
  const klentengX = centerX + 10;
  const klenteng = new THREE.Group();
  klenteng.position.set(klentengX, 2.35, centerZ);

  const kPlinth = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 11), stoneMat);
  kPlinth.position.y = 0.45;
  kPlinth.receiveShadow = true;
  klenteng.add(kPlinth);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(11.5, 4.2, 8.6), crimsonMat);
  hall.position.y = 2.9;
  hall.castShadow = true;
  hall.receiveShadow = true;
  klenteng.add(hall);

  // Lower flared eaves
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(9.2, 2.2, 4), eaveMat);
  roof1.rotation.y = Math.PI / 4;
  roof1.scale.set(1.22, 1, 0.95);
  roof1.position.y = 5.6;
  roof1.castShadow = true;
  klenteng.add(roof1);

  // Upper tiered ridge roof
  const upperHall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.8, 5.2), creamMat);
  upperHall.position.y = 6.2;
  klenteng.add(upperHall);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.1, 4), crimsonMat);
  roof2.rotation.y = Math.PI / 4;
  roof2.scale.set(1.25, 1, 0.9);
  roof2.position.y = 7.6;
  roof2.castShadow = true;
  klenteng.add(roof2);

  const ridgeGold = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 0.4), goldMat);
  ridgeGold.position.y = 8.7;
  klenteng.add(ridgeGold);

  // Decorative red lanterns along front veranda
  for (let lx = -4.2; lx <= 4.2; lx += 2.1) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternGlow);
    lantern.position.set(lx, 4.3, 4.6);
    klenteng.add(lantern);
  }
  group.add(klenteng);

  // --- Pohon Cinta & Tropical Trees ---
  group.add(createTropicalTree(centerX + 22, 2.1, centerZ - 3.5, 1.55, foliageMat, trunkMat));
  group.add(createTropicalTree(centerX + 25, 2.0, centerZ + 4.0, 1.25, foliageMat, trunkMat));
  group.add(createTropicalTree(centerX - 24, 2.0, centerZ + 3.8, 1.3, foliageMat, trunkMat));
  group.add(createTropicalTree(centerX - 22, 2.0, centerZ - 4.2, 1.1, foliageMat, trunkMat));
  group.add(createTropicalTree(centerX + 1.5, 2.1, centerZ + 7.5, 1.05, foliageMat, trunkMat));

  // --- Small Wooden Landing Jetty on North Shore ---
  const jetty = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.32, 9.5), woodMat);
  jetty.position.set(centerX - 18, 1.4, centerZ - 15.0);
  jetty.castShadow = true;
  group.add(jetty);

  for (const dx of [-2.0, 2.0]) {
    for (const dz of [-12, -16, -19]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.6, 6), trunkMat);
      pile.position.set(centerX - 18 + dx, 0.1, centerZ + dz);
      group.add(pile);
    }
  }

  const pagodaLight = new THREE.PointLight("#ff9d3b", 0, 95, 1.4);
  pagodaLight.position.set(pagodaX, 18, pagodaZ);
  group.add(pagodaLight);

  env.onLightingChange((cfg) => {
    pagodaLight.intensity = cfg.nightGlow * 3.4;
    lanternGlow.emissiveIntensity = 0.25 + cfg.nightGlow * 2.5;
  });

  scene.add(group);
  return { group };
}
