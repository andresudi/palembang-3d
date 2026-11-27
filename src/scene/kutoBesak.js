import * as THREE from 'three';
import { GROUND_Y, getRiverBoundsAt } from './riverMusi.js';

function createHippedRoof(width, height, depth, ridgeLen, material) {
  const hw = width / 2;
  const hd = depth / 2;
  const hr = Math.min(ridgeLen / 2, hw - 0.4);

  // 4 base corners + 2 ridge endpoints
  const positions = new Float32Array([
    // South slope
    -hw, 0, hd,   hw, 0, hd,    hr, height, 0,
    -hw, 0, hd,   hr, height, 0, -hr, height, 0,
    // North slope
     hw, 0, -hd, -hw, 0, -hd,  -hr, height, 0,
     hw, 0, -hd, -hr, height, 0, hr, height, 0,
    // West hip
    -hw, 0, -hd, -hw, 0, hd,   -hr, height, 0,
    // East hip
     hw, 0, hd,   hw, 0, -hd,   hr, height, 0,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createCornerBastion(x, z, sizeX, sizeZ, height, wallMat, trimMat) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(sizeX, sizeX * 1.06, height, 5), wallMat);
  base.position.set(x, GROUND_Y + height / 2 - 0.3, z);
  base.rotation.y = Math.PI / 5;
  base.scale.set(1, 1, sizeZ / sizeX);
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const parapet = new THREE.Mesh(new THREE.CylinderGeometry(sizeX * 1.03, sizeX * 1.03, 0.75, 5), trimMat);
  parapet.position.set(x, GROUND_Y + height - 0.1, z);
  parapet.rotation.y = Math.PI / 5;
  parapet.scale.set(1, 1, sizeZ / sizeX);
  g.add(parapet);
  return g;
}

export function createKutoBesak(scene, env) {
  const group = new THREE.Group();
  group.name = 'BentengKutoBesak';

  const centerX = -132;
  const riverBounds = getRiverBoundsAt(centerX);
  const bankEdgeZ = riverBounds.northEdgeZ; // ~ -47.2

  const wallCream = new THREE.MeshStandardMaterial({ color: '#ebe3d0', roughness: 0.84 });
  const wallWeather = new THREE.MeshStandardMaterial({ color: '#d5cbb5', roughness: 0.88 });
  const terracotta = new THREE.MeshStandardMaterial({ color: '#a84a34', roughness: 0.78 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#5c3a24', roughness: 0.82 });
  const plazaStone = new THREE.MeshStandardMaterial({ color: '#c4bdb0', roughness: 0.85 });
  const plazaAccent = new THREE.MeshStandardMaterial({ color: '#9c9487', roughness: 0.88 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: '#4d7343', roughness: 0.92 });
  const lampGlow = new THREE.MeshStandardMaterial({
    color: '#ffe5a8',
    emissive: '#ffab40',
    emissiveIntensity: 0.15,
  });

  // Fortress footprint (74 x 46, aspect ratio ~1.61:1 matching 289m x 184m)
  const fortW = 74;
  const fortD = 46;
  const fortCenterZ = bankEdgeZ - 16 - fortD / 2;
  const wallH = 6.2;
  const wallT = 2.6;

  // Inner lawn courtyard
  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(fortW - 2, 0.3, fortD - 2), lawnMat);
  courtyard.position.set(centerX, GROUND_Y + 0.15, fortCenterZ);
  courtyard.receiveShadow = true;
  group.add(courtyard);

  const southZ = fortCenterZ + fortD / 2;
  const northZ = fortCenterZ - fortD / 2;
  const westX = centerX - fortW / 2;
  const eastX = centerX + fortW / 2;

  const northWall = new THREE.Mesh(new THREE.BoxGeometry(fortW, wallH, wallT), wallCream);
  northWall.position.set(centerX, GROUND_Y + wallH / 2 - 0.2, northZ);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  group.add(northWall);

  for (const sx of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, fortD), wallCream);
    sideWall.position.set(centerX + sx * (fortW / 2), GROUND_Y + wallH / 2 - 0.2, fortCenterZ);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    group.add(sideWall);
  }

  // South riverside wall flanking Lawang Kuto
  const segW = (fortW - 10) / 2;
  for (const sx of [-1, 1]) {
    const sWall = new THREE.Mesh(new THREE.BoxGeometry(segW, wallH, wallT), wallCream);
    sWall.position.set(centerX + sx * (5 + segW / 2), GROUND_Y + wallH / 2 - 0.2, southZ);
    sWall.castShadow = true;
    sWall.receiveShadow = true;
    group.add(sWall);
  }

  // Lawang Kuto main riverside gatehouse facing Sungai Musi
  const gateTower = new THREE.Mesh(new THREE.BoxGeometry(11.5, wallH + 2.0, wallT + 1.4), wallCream);
  gateTower.position.set(centerX, GROUND_Y + (wallH + 2.0) / 2 - 0.2, southZ);
  gateTower.castShadow = true;
  group.add(gateTower);

  const gateRoof = createHippedRoof(13.2, 2.5, 5.4, 7.6, terracotta);
  gateRoof.position.set(centerX, GROUND_Y + wallH + 1.8, southZ);
  group.add(gateRoof);

  const gatePortal = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.2, wallT + 1.6), darkWood);
  gatePortal.position.set(centerX, GROUND_Y + 2.1, southZ);
  group.add(gatePortal);

  const gateArchTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.3, wallT + 1.6, 12, 1, false, 0, Math.PI),
    darkWood
  );
  gateArchTop.rotation.z = Math.PI / 2;
  gateArchTop.rotation.y = Math.PI / 2;
  gateArchTop.position.set(centerX, GROUND_Y + 4.2, southZ);
  group.add(gateArchTop);

  // Wall parapet coping
  const coping = new THREE.Mesh(new THREE.BoxGeometry(fortW + 0.8, 0.55, wallT + 0.5), wallWeather);
  coping.position.set(centerX, GROUND_Y + wallH - 0.1, northZ);
  group.add(coping);

  // 4 corner bastions
  group.add(createCornerBastion(westX, southZ, 6.2, 6.2, wallH + 0.4, wallCream, wallWeather));
  group.add(createCornerBastion(eastX, southZ, 6.2, 6.2, wallH + 0.4, wallCream, wallWeather));
  group.add(createCornerBastion(eastX, northZ, 6.2, 6.2, wallH + 0.4, wallCream, wallWeather));
  group.add(createCornerBastion(westX - 1.2, northZ - 1.2, 7.8, 6.6, wallH + 0.6, wallCream, wallWeather));

  // Inner courtyard heritage buildings with crisp non-overlapping hipped roofs
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(22, 4.3, 12), wallCream);
  mainHall.position.set(centerX, GROUND_Y + 2.15, fortCenterZ - 5.5);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  group.add(mainHall);

  const mainHallRoof = createHippedRoof(24.4, 3.6, 14.4, 13.5, terracotta);
  mainHallRoof.position.set(centerX, GROUND_Y + 4.3, fortCenterZ - 5.5);
  group.add(mainHallRoof);

  for (const sx of [-1, 1]) {
    const wingX = centerX + sx * 22.5;
    const wingZ = fortCenterZ + 1.5;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.6, 17.5), wallCream);
    wing.position.set(wingX, GROUND_Y + 1.8, wingZ);
    wing.castShadow = true;
    group.add(wing);

    const wingRoof = createHippedRoof(19.5, 2.9, 12.6, 9.5, terracotta);
    wingRoof.rotation.y = Math.PI / 2;
    wingRoof.position.set(wingX, GROUND_Y + 3.6, wingZ);
    group.add(wingRoof);
  }

  // Flagpole with Indonesian Merah-Putih in front courtyard
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 11, 6), wallWeather);
  pole.position.set(centerX, GROUND_Y + 5.5, fortCenterZ + 11);
  group.add(pole);

  const flagRed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.08), new THREE.MeshStandardMaterial({ color: '#ce1126' }));
  flagRed.position.set(centerX + 1.6, GROUND_Y + 10.3, fortCenterZ + 11);
  group.add(flagRed);
  const flagWhite = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.08), new THREE.MeshStandardMaterial({ color: '#f5f5f5' }));
  flagWhite.position.set(centerX + 1.6, GROUND_Y + 9.4, fortCenterZ + 11);
  group.add(flagWhite);

  // Plaza BKB waterfront esplanade
  const plazaW = 92;
  const plazaD = 15.5;
  const plazaZ = bankEdgeZ - plazaD / 2;
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(plazaW, 0.45, plazaD), plazaStone);
  plaza.position.set(centerX, GROUND_Y + 0.18, plazaZ);
  plaza.receiveShadow = true;
  group.add(plaza);

  for (let x = centerX - 36; x <= centerX + 36; x += 18) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.48, plazaD - 2), plazaAccent);
    strip.position.set(x, GROUND_Y + 0.19, plazaZ);
    group.add(strip);
  }

  const rail = new THREE.Mesh(new THREE.BoxGeometry(plazaW, 0.65, 0.45), wallWeather);
  rail.position.set(centerX, GROUND_Y + 0.6, bankEdgeZ - 0.4);
  group.add(rail);

  // BKB Dermaga pier + sloped connecting walkway ramp & pilings
  const pierX = centerX + 14;
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 9.5), darkWood);
  pierDeck.position.set(pierX, 1.5, bankEdgeZ + 8.5);
  pierDeck.castShadow = true;
  group.add(pierDeck);

  const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 6.2), darkWood);
  ramp.position.set(pierX, 2.45, bankEdgeZ + 2.2);
  ramp.rotation.x = 0.34;
  ramp.castShadow = true;
  group.add(ramp);

  for (const dx of [-3.2, 3.2]) {
    for (const dz of [5.2, 11.8]) {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 6), darkWood);
      pile.position.set(pierX + dx, 0.2, bankEdgeZ + dz);
      group.add(pile);
    }
  }

  // Plaza waterfront lamps
  for (let x = centerX - 38; x <= centerX + 38; x += 15.2) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.6, 6), plazaAccent);
    post.position.set(x, GROUND_Y + 2.0, bankEdgeZ - 1.8);
    group.add(post);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), lampGlow);
    orb.position.set(x, GROUND_Y + 3.9, bankEdgeZ - 1.8);
    group.add(orb);
  }

  env.onLightingChange((cfg) => {
    lampGlow.emissiveIntensity = 0.15 + cfg.nightGlow * 2.5;
  });

  scene.add(group);
  return { group };
}
