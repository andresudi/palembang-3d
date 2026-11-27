import * as THREE from 'three';
import { GROUND_Y, getRiverBoundsAt } from './riverMusi.js';
import { getPBRTextures } from './textures.js';

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

function createHippedRoof(width, height, depth, ridgeLen, material) {
  const hw = width / 2;
  const hd = depth / 2;
  const hr = Math.min(ridgeLen / 2, hw - 0.5);

  const positions = new Float32Array([
    -hw, 0, hd,   hw, 0, hd,    hr, height, 0,
    -hw, 0, hd,   hr, height, 0, -hr, height, 0,
     hw, 0, -hd, -hw, 0, -hd,  -hr, height, 0,
     hw, 0, -hd, -hr, height, 0, hr, height, 0,
    -hw, 0, -hd, -hw, 0, hd,   -hr, height, 0,
     hw, 0, hd,   hw, 0, -hd,   hr, height, 0,
  ]);
  const uvs = new Float32Array([
    0, 0,  width * 0.15, 0,  width * 0.11, depth * 0.15,
    0, 0,  width * 0.11, depth * 0.15,  width * 0.04, depth * 0.15,
    0, 0,  width * 0.15, 0,  width * 0.11, depth * 0.15,
    0, 0,  width * 0.11, depth * 0.15,  width * 0.04, depth * 0.15,
    0, 0,  depth * 0.15, 0,  depth * 0.075, depth * 0.15,
    0, 0,  depth * 0.15, 0,  depth * 0.075, depth * 0.15,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// 1. Bundaran Air Mancur (BAM) Masjid Agung at (0, -124)
function createBundaranAirMancur(materials) {
  const g = new THREE.Group();
  g.name = 'BundaranAirMancur';
  const cx = 0;
  const cz = -124;

  // Outer rotary asphalt ring (r = 10..17.5)
  const asphaltRing = new THREE.Mesh(
    new THREE.RingGeometry(9.6, 17.8, 36),
    materials.asphalt
  );
  asphaltRing.rotation.x = -Math.PI / 2;
  asphaltRing.position.set(cx, GROUND_Y + 0.11, cz);
  asphaltRing.receiveShadow = true;
  g.add(asphaltRing);

  // Dashed lane ring
  const dashRing = new THREE.Mesh(
    new THREE.RingGeometry(13.5, 13.85, 36),
    materials.roadStripe
  );
  dashRing.rotation.x = -Math.PI / 2;
  dashRing.position.set(cx, GROUND_Y + 0.13, cz);
  g.add(dashRing);

  // Central green landscaped island & stone curb
  const curb = new THREE.Mesh(new THREE.CylinderGeometry(9.7, 10.0, 0.55, 28), materials.stoneLight);
  curb.position.set(cx, GROUND_Y + 0.25, cz);
  curb.receiveShadow = true;
  g.add(curb);

  const lawn = new THREE.Mesh(new THREE.CylinderGeometry(8.9, 9.1, 0.3, 28), materials.parkGrass);
  lawn.position.set(cx, GROUND_Y + 0.52, cz);
  lawn.receiveShadow = true;
  g.add(lawn);

  // Fountain basin rim & turquoise water pool
  const basinRim = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.45, 8, 28), materials.whiteMarble);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.set(cx, GROUND_Y + 0.9, cz);
  g.add(basinRim);

  const pool = new THREE.Mesh(new THREE.CylinderGeometry(5.45, 5.45, 0.25, 24), materials.fountainWater);
  pool.position.set(cx, GROUND_Y + 0.85, cz);
  g.add(pool);

  // Central sculpted lotus/tiered pedestal
  const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.3, 1.3, 12), materials.whiteMarble);
  ped1.position.set(cx, GROUND_Y + 1.5, cz);
  ped1.castShadow = true;
  g.add(ped1);

  const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 1.4, 12), materials.gold);
  ped2.position.set(cx, GROUND_Y + 2.75, cz);
  g.add(ped2);

  // Animated water jet columns (central tall plume + 8 radial arcs)
  const jets = [];
  const mainJet = new THREE.Mesh(new THREE.ConeGeometry(0.95, 5.4, 10), materials.waterSpray);
  mainJet.position.set(cx, GROUND_Y + 5.8, cz);
  g.add(mainJet);
  jets.push({ mesh: mainJet, baseY: GROUND_Y + 5.8, baseScaleY: 1.0, phase: 0 });

  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.8, 8), materials.waterSpray);
    jet.position.set(cx + Math.cos(ang) * 3.1, GROUND_Y + 2.4, cz + Math.sin(ang) * 3.1);
    jet.rotation.z = -Math.cos(ang) * 0.28;
    jet.rotation.x = Math.sin(ang) * 0.28;
    g.add(jet);
    jets.push({ mesh: jet, baseY: GROUND_Y + 2.4, baseScaleY: 1.0, phase: i * 0.75 });
  }

  // Warm perimeter uplights around fountain
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), materials.warmGlow);
    orb.position.set(cx + Math.cos(ang) * 7.6, GROUND_Y + 1.1, cz + Math.sin(ang) * 7.6);
    g.add(orb);
  }

  const light = new THREE.PointLight('#ffbd59', 0, 58, 1.5);
  light.position.set(cx, GROUND_Y + 6.5, cz);
  g.add(light);

  return { group: g, jets, light };
}

// 2. Gedung & Kawasan Pasar 16 Ilir at (58, -64)
function createPasar16Ilir(materials) {
  const g = new THREE.Group();
  g.name = 'Pasar16Ilir';
  const cx = 58;
  const cz = -65;

  // Paved market terrace & loading apron
  const apron = new THREE.Mesh(new THREE.BoxGeometry(52, 0.4, 30), materials.stonePlaza);
  apron.position.set(cx, GROUND_Y + 0.16, cz);
  apron.receiveShadow = true;
  g.add(apron);

  // Main iconic 4-story Pasar 16 Ilir heritage market hall (cream-ochre facade + terracotta roof)
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(36, 11.2, 16), materials.ochreWall);
  mainHall.position.set(cx, GROUND_Y + 5.7, cz - 1.5);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  g.add(mainHall);

  // Horizontal sun-shading balconies / floor bands
  for (const fy of [3.4, 6.2, 9.0, 11.3]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(36.8, 0.52, 16.8), materials.whiteMarble);
    band.position.set(cx, GROUND_Y + fy, cz - 1.5);
    g.add(band);
  }

  // Glowing market window strips (front & back)
  for (const fy of [4.8, 7.6, 10.1]) {
    const wStrip = new THREE.Mesh(new THREE.BoxGeometry(32.5, 1.25, 16.25), materials.windowGlow);
    wStrip.position.set(cx, GROUND_Y + fy, cz - 1.5);
    g.add(wStrip);
  }

  // Distinct riverside pediment & crimson signage accent facing Sungai Musi
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(15, 1.9, 0.6), materials.crimson);
  signBoard.position.set(cx, GROUND_Y + 12.1, cz + 6.7);
  g.add(signBoard);

  const signGold = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.45, 0.68), materials.gold);
  signGold.position.set(cx, GROUND_Y + 12.1, cz + 6.72);
  g.add(signGold);

  // Crisp rectangular hipped terracotta roof over Pasar 16 Ilir hall (no diagonal shear)
  const roof = createHippedRoof(37.6, 3.8, 17.6, 22.0, materials.terracotta);
  roof.position.set(cx, GROUND_Y + 11.55, cz - 1.5);
  g.add(roof);

  // Move signage fascia cleanly onto front roof parapet above eaves
  signBoard.position.set(cx, GROUND_Y + 11.7, cz + 6.95);
  signGold.position.set(cx, GROUND_Y + 11.7, cz + 7.0);

  // Flanking shophouse wings (East & West of market hall)
  for (const sx of [-22, 22]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 8.2, 14), materials.creamWall);
    wing.position.set(cx + sx, GROUND_Y + 4.1, cz - 2.0);
    wing.castShadow = true;
    wing.receiveShadow = true;
    g.add(wing);

    const wRoof = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.6, 14.5), materials.slateRoof);
    wRoof.position.set(cx + sx, GROUND_Y + 8.4, cz - 2.0);
    g.add(wRoof);

    const wWin = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.4, 14.2), materials.windowGlow);
    wWin.position.set(cx + sx, GROUND_Y + 5.6, cz - 2.0);
    g.add(wWin);
  }

  // Lively colorful riverside market canopy stalls facing the promenade
  const stallColors = [materials.crimson, materials.lrtBlue, materials.emerald, materials.ochreWall];
  for (let i = 0; i < 6; i++) {
    const sx = cx - 19 + i * 7.6;
    const sz = cz + 10.6;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.35, 3.8), stallColors[i % stallColors.length]);
    canopy.position.set(sx, GROUND_Y + 2.7, sz);
    canopy.rotation.x = 0.12;
    canopy.castShadow = true;
    g.add(canopy);

    for (const px of [-2.4, 2.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 5), materials.woodDark);
      post.position.set(sx + px, GROUND_Y + 1.3, sz);
      g.add(post);
    }
  }

  return g;
}

// 3. Kantor Walikota Palembang (Menara Air / Gedung Ledeng) + Museum SMB II
function createWalikotaAndMuseum(materials) {
  const g = new THREE.Group();
  g.name = 'WalikotaDanMuseumSMBII';

  // --- A. Kantor Walikota (Menara Air / Gedung Ledeng) at (-154, -138) ---
  const wx = -154;
  const wz = -138;

  const wPlaza = new THREE.Mesh(new THREE.BoxGeometry(36, 0.45, 24), materials.stonePlaza);
  wPlaza.position.set(wx, GROUND_Y + 0.18, wz);
  wPlaza.receiveShadow = true;
  g.add(wPlaza);

  // Colonial base office wings
  const baseWing = new THREE.Mesh(new THREE.BoxGeometry(28, 7.6, 14.5), materials.whiteMarble);
  baseWing.position.set(wx, GROUND_Y + 3.9, wz);
  baseWing.castShadow = true;
  baseWing.receiveShadow = true;
  g.add(baseWing);

  const wingWin = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 14.75), materials.windowGlow);
  wingWin.position.set(wx, GROUND_Y + 4.4, wz);
  g.add(wingWin);

  const wingRoof = createHippedRoof(29.6, 3.2, 16.0, 16.0, materials.terracotta);
  wingRoof.position.set(wx, GROUND_Y + 7.7, wz);
  g.add(wingRoof);

  // Iconic central elevated Water Tower (Menara Air / Ledeng, height ~31m)
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(7.8, 18.5, 7.8), materials.whiteMarble);
  shaft.position.set(wx, GROUND_Y + 13.5, wz);
  shaft.castShadow = true;
  g.add(shaft);

  // Corner colonial pilasters
  for (const sx of [-3.9, 3.9]) {
    for (const sz of [-3.9, 3.9]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 19.5, 0.9), materials.creamWall);
      pil.position.set(wx + sx, GROUND_Y + 13.8, wz + sz);
      g.add(pil);
    }
  }

  // Elevated cantilevered water tank crown + observation gallery
  const gallery = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.1, 10.6), materials.stoneLight);
  gallery.position.set(wx, GROUND_Y + 23.0, wz);
  gallery.castShadow = true;
  g.add(gallery);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(9.6, 5.2, 9.6), materials.whiteMarble);
  tank.position.set(wx, GROUND_Y + 26.0, wz);
  tank.castShadow = true;
  g.add(tank);

  const tankBand = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.2, 9.8), materials.windowGlow);
  tankBand.position.set(wx, GROUND_Y + 25.5, wz);
  g.add(tankBand);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(8.0, 3.8, 4), materials.terracotta);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(wx, GROUND_Y + 30.4, wz);
  towerRoof.castShadow = true;
  g.add(towerRoof);

  const towerSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 3.0, 6), materials.gold);
  towerSpire.position.set(wx, GROUND_Y + 33.4, wz);
  g.add(towerSpire);

  // --- B. Museum Sultan Mahmud Badaruddin II at (-188, -68) west of BKB ---
  const mx = -188;
  const mz = -68;

  const mBase = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 20), materials.stonePlaza);
  mBase.position.set(mx, GROUND_Y + 0.2, mz);
  mBase.receiveShadow = true;
  g.add(mBase);

  const mBody = new THREE.Mesh(new THREE.BoxGeometry(18.5, 5.6, 13.5), materials.whiteMarble);
  mBody.position.set(mx, GROUND_Y + 3.0, mz);
  mBody.castShadow = true;
  mBody.receiveShadow = true;
  g.add(mBody);

  // Veranda colonnade facing river
  for (let px = -7.5; px <= 7.5; px += 3.0) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 5.4, 8), materials.creamWall);
    col.position.set(mx + px, GROUND_Y + 3.0, mz + 7.2);
    g.add(col);
  }

  const mWin = new THREE.Mesh(new THREE.BoxGeometry(15.5, 1.6, 13.7), materials.windowGlow);
  mWin.position.set(mx, GROUND_Y + 3.2, mz);
  g.add(mWin);

  const mRoof = createHippedRoof(20.4, 3.8, 15.2, 9.5, materials.terracotta);
  mRoof.position.set(mx, GROUND_Y + 5.8, mz);
  g.add(mRoof);

  return g;
}

// 4. Taman & Danau Kambang Iwak at (-148, -206)
function createKambangIwak(materials) {
  const g = new THREE.Group();
  g.name = 'KambangIwak';
  const cx = -148;
  const cz = -206;

  // Lush park lawn pad
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(88, 0.28, 56), materials.parkGrass);
  lawn.position.set(cx, GROUND_Y + 0.1, cz);
  lawn.receiveShadow = true;
  g.add(lawn);

  // Jogging track stone promenade oval around the lake
  const track = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.34, 32), materials.stoneLight);
  track.scale.set(1.52, 1, 0.92);
  track.position.set(cx, GROUND_Y + 0.14, cz);
  track.receiveShadow = true;
  g.add(track);

  // Shimmering oval lake water
  const lake = new THREE.Mesh(new THREE.CylinderGeometry(20.5, 20.5, 0.38, 32), materials.fountainWater);
  lake.scale.set(1.48, 1, 0.88);
  lake.position.set(cx, GROUND_Y + 0.17, cz);
  g.add(lake);

  // Central mini fountain jet in Kambang Iwak
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.7, 12), materials.stoneLight);
  fountainBase.position.set(cx, GROUND_Y + 0.55, cz);
  g.add(fountainBase);

  const lakeJet = new THREE.Mesh(new THREE.ConeGeometry(0.75, 4.2, 8), materials.waterSpray);
  lakeJet.position.set(cx, GROUND_Y + 2.8, cz);
  g.add(lakeJet);

  // Wooden lakeside viewing deck & gazebo on south shore
  const deck = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 6), materials.woodMid);
  deck.position.set(cx, GROUND_Y + 0.45, cz + 18.5);
  deck.castShadow = true;
  g.add(deck);

  const gazeboRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.0, 6), materials.terracotta);
  gazeboRoof.position.set(cx + 18, GROUND_Y + 4.3, cz + 19);
  gazeboRoof.castShadow = true;
  g.add(gazeboRoof);

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 6), materials.woodDark);
    post.position.set(cx + 18 + Math.cos(ang) * 2.2, GROUND_Y + 1.8, cz + 19 + Math.sin(ang) * 2.2);
    g.add(post);
  }

  // Park lamps around jogging track
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const lx = cx + Math.cos(ang) * 35;
    const lz = cz + Math.sin(ang) * 21.5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.6, 6), materials.concreteDark);
    pole.position.set(lx, GROUND_Y + 1.9, lz);
    g.add(pole);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), materials.warmGlow);
    orb.position.set(lx, GROUND_Y + 3.85, lz);
    g.add(orb);
  }

  return { group: g, lakeJet };
}

// 5. Kampung Kapitan & Permukiman 7 Ulu at (-78, +60)
function createKampungKapitan(materials) {
  const g = new THREE.Group();
  g.name = 'KampungKapitan';
  const cx = -78;
  const bounds = getRiverBoundsAt(cx);
  const cz = bounds.southEdgeZ + 20; // ~ +58.5

  // Raised timber courtyard deck connecting to Ulu pier (pier is at x = -78)
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(58, 0.45, 28), materials.stonePlaza);
  plaza.position.set(cx, GROUND_Y + 0.18, cz);
  plaza.receiveShadow = true;
  g.add(plaza);

  // Ornamental crimson Chinese-Palembang heritage archway facing Sungai Musi
  const gateZ = cz - 12.2;
  for (const sx of [-4.2, 4.2]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 6.2, 8), materials.crimson);
    col.position.set(cx + sx, GROUND_Y + 3.2, gateZ);
    col.castShadow = true;
    g.add(col);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.9, 1.2), materials.crimson);
  lintel.position.set(cx, GROUND_Y + 6.3, gateZ);
  g.add(lintel);
  const gateRoof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.55, 2.4), materials.terracotta);
  gateRoof.position.set(cx, GROUND_Y + 7.1, gateZ);
  g.add(gateRoof);
  const gateGold = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 1.3), materials.gold);
  gateGold.position.set(cx, GROUND_Y + 6.3, gateZ);
  g.add(gateGold);

  // Twin grand Kampung Kapitan stilt pavilions (colonial-Peranakan timber & crimson roofs)
  for (const sx of [-13.5, 13.5]) {
    const px = cx + sx;
    const pz = cz + 1.5;

    // Stilts
    for (const dx of [-6.5, 0, 6.5]) {
      for (const dz of [-4.5, 4.5]) {
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 6), materials.woodDark);
        stilt.position.set(px + dx, GROUND_Y + 1.1, pz + dz);
        g.add(stilt);
      }
    }

    const body = new THREE.Mesh(new THREE.BoxGeometry(15, 4.2, 11), materials.creamWall);
    body.position.set(px, GROUND_Y + 4.1, pz);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const veranda = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.4, 12.6), materials.woodMid);
    veranda.position.set(px, GROUND_Y + 2.1, pz);
    g.add(veranda);

    const win = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.5, 11.2), materials.windowGlow);
    win.position.set(px, GROUND_Y + 4.2, pz);
    g.add(win);

    // Sweeping crimson-terracotta tiered Peranakan hipped roof
    const roofLow = createHippedRoof(16.8, 3.0, 12.6, 8.8, materials.terracotta);
    roofLow.position.set(px, GROUND_Y + 6.2, pz);
    g.add(roofLow);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.45, 0.48), materials.gold);
    ridge.position.set(px, GROUND_Y + 9.25, pz);
    g.add(ridge);

    // Glowing red lanterns along front porch
    for (const lx of [-4.5, 0, 4.5]) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), materials.warmGlow);
      lantern.position.set(px + lx, GROUND_Y + 5.6, pz - 6.0);
      g.add(lantern);
    }
  }

  return g;
}

// 6. Stadion Gelora Sriwijaya / Jakabaring Sport City at (58, +184) + Stasiun LRT Jakabaring (-22, +178)
function createJakabaringStadium(materials) {
  const g = new THREE.Group();
  g.name = 'JakabaringSportCity';
  const cx = 58;
  const cz = 184;

  // Grand paved sports complex esplanade (cleanly between Jl. Bastari x=0 and Jl. Musi IV South x=120)
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(98, 0.4, 86), materials.stonePlaza);
  plaza.position.set(cx, GROUND_Y + 0.16, cz);
  plaza.receiveShadow = true;
  g.add(plaza);

  // Decorative entrance reflecting pool on north plaza facing Jl. Ahmad Yani (completely clear of all roads!)
  const pool = new THREE.Mesh(new THREE.BoxGeometry(38, 0.25, 8.5), materials.fountainWater);
  pool.position.set(cx, GROUND_Y + 0.34, cz - 36.5);
  g.add(pool);

  // Outer stadium concrete bowl (elliptical cylinder shell)
  const outerBowl = new THREE.Mesh(new THREE.CylinderGeometry(37, 34, 13.5, 32, 1, true), materials.whiteMarble);
  outerBowl.scale.set(1.18, 1, 0.92);
  outerBowl.position.set(cx, GROUND_Y + 6.9, cz);
  outerBowl.castShadow = true;
  outerBowl.receiveShadow = true;
  g.add(outerBowl);

  // Crimson & gold Palembang stadium facade ribbon
  const facadeBand = new THREE.Mesh(new THREE.CylinderGeometry(37.3, 36.8, 2.2, 32, 1, true), materials.crimson);
  facadeBand.scale.set(1.18, 1, 0.92);
  facadeBand.position.set(cx, GROUND_Y + 11.4, cz);
  g.add(facadeBand);

  // Inner terraced seating bowl
  const innerStand = new THREE.Mesh(new THREE.CylinderGeometry(33.5, 22, 11.5, 32, 1, true), materials.concreteMid);
  innerStand.scale.set(1.18, 1, 0.92);
  innerStand.position.set(cx, GROUND_Y + 6.1, cz);
  innerStand.material = materials.concreteMid.clone();
  innerStand.material.side = THREE.DoubleSide;
  g.add(innerStand);

  // Top concrete rim ring connecting outer & inner bowl
  const rim = new THREE.Mesh(new THREE.RingGeometry(33.2, 37.3, 32), materials.stoneLight);
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(1.18, 0.92, 1);
  rim.position.set(cx, GROUND_Y + 13.65, cz);
  g.add(rim);

  // Iconic sweeping twin arched canopy roofs (East & West grandstands)
  for (const sx of [-1, 1]) {
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(36.5, 36.5, 3.2, 24, 1, true, sx > 0 ? -0.95 : Math.PI - 0.95, 1.9),
      materials.whiteMarble
    );
    canopy.scale.set(1.2, 1, 0.94);
    canopy.position.set(cx, GROUND_Y + 15.2, cz);
    canopy.material = materials.whiteMarble.clone();
    canopy.material.side = THREE.DoubleSide;
    canopy.castShadow = true;
    g.add(canopy);

    // Sweeping steel arch rib over each roof
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(28, 0.75, 8, 24, Math.PI),
      materials.crimson
    );
    arch.rotation.y = Math.PI / 2;
    arch.position.set(cx + sx * 34.5, GROUND_Y + 6.0, cz);
    arch.scale.set(1.0, 0.55, 1.0);
    g.add(arch);
  }

  // Red athletic running track oval
  const track = new THREE.Mesh(new THREE.CylinderGeometry(23.5, 23.5, 0.45, 32), materials.terracotta);
  track.scale.set(1.18, 1, 0.9);
  track.position.set(cx, GROUND_Y + 0.55, cz);
  track.receiveShadow = true;
  g.add(track);

  // Lush green football pitch + crisp white pitch lines
  const pitch = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 22), materials.pitchGrass);
  pitch.position.set(cx, GROUND_Y + 0.65, cz);
  pitch.receiveShadow = true;
  g.add(pitch);

  const midLine = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 21.6), materials.roadStripe);
  midLine.rotation.x = -Math.PI / 2;
  midLine.position.set(cx, GROUND_Y + 0.94, cz);
  g.add(midLine);

  const centerCircle = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.45, 24), materials.roadStripe);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(cx, GROUND_Y + 0.94, cz);
  g.add(centerCircle);

  // 4 tall iconic floodlight towers angled into the pitch
  const towerPositions = [
    [cx - 38, cz - 28],
    [cx + 38, cz - 28],
    [cx - 38, cz + 28],
    [cx + 38, cz + 28],
  ];
  for (const [tx, tz] of towerPositions) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.78, 30, 8), materials.steelLight);
    mast.position.set(tx, GROUND_Y + 15.0, tz);
    mast.castShadow = true;
    g.add(mast);

    const head = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 1.2), materials.stadiumLightGlow);
    head.position.set(tx, GROUND_Y + 30.2, tz);
    head.lookAt(cx, GROUND_Y + 2, cz);
    g.add(head);
  }

  // Stadium pitch night floodlight
  const pitchLight = new THREE.PointLight('#fff4d8', 0, 145, 1.3);
  pitchLight.position.set(cx, GROUND_Y + 28, cz);
  g.add(pitchLight);

  // Stasiun LRT Jakabaring at (-22, +178) + connecting walkway to stadium plaza
  const lrtX = -22;
  const stnZ = 178;
  const stnPlatform = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.4, 24), materials.concreteMid);
  stnPlatform.position.set(lrtX, 14.5, stnZ);
  stnPlatform.castShadow = true;
  g.add(stnPlatform);

  const stnCanopy = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 5.6, 25, 10, 1, false, 0, Math.PI),
    materials.lrtBlue
  );
  stnCanopy.rotation.z = Math.PI / 2;
  stnCanopy.rotation.y = Math.PI / 2;
  stnCanopy.scale.set(1, 0.48, 1);
  stnCanopy.position.set(lrtX, 18.2, stnZ);
  stnCanopy.castShadow = true;
  g.add(stnCanopy);

  return { group: g, pitchLight };
}

// 7. Jembatan Musi IV at x = +120 (modern white extradosed cable-stayed bridge, 100% clear of all vessels)
function createMusiIVBridge(materials) {
  const g = new THREE.Group();
  g.name = 'JembatanMusiIV';
  const bx = 120;
  const bounds = getRiverBoundsAt(bx); // centerZ ~ +4.9, north ~ -45.2, south ~ +55.0

  // Place twin pylons safely near riverbanks (outside all vessel lanes [-30..+35]!)
  const pylonNorthZ = bounds.northEdgeZ + 4.5; // ~ -40.7
  const pylonSouthZ = bounds.southEdgeZ - 4.5; // ~ +50.5
  const flatNorthZ = -60;
  const flatSouthZ = 66;
  const flatLen = flatSouthZ - flatNorthZ;
  const flatMidZ = (flatNorthZ + flatSouthZ) / 2;
  const deckY = 11.4;

  // Main horizontal deck slab + asphalt + sidewalks
  const slab = new THREE.Mesh(new THREE.BoxGeometry(10.0, 1.0, flatLen), materials.whiteMarble);
  slab.position.set(bx, deckY - 0.5, flatMidZ);
  slab.castShadow = true;
  slab.receiveShadow = true;
  g.add(slab);

  const road = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.14, flatLen), materials.asphalt);
  road.position.set(bx, deckY + 0.06, flatMidZ);
  road.receiveShadow = true;
  g.add(road);

  // Side accent LED ribbon along bridge deck
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, flatLen), materials.steelLight);
    rail.position.set(bx + sx * 4.85, deckY + 0.42, flatMidZ);
    g.add(rail);

    const led = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, flatLen), materials.musiLedGlow);
    led.position.set(bx + sx * 5.02, deckY - 0.35, flatMidZ);
    g.add(led);
  }

  // Dashed white lane line
  for (let z = flatNorthZ + 4; z <= flatSouthZ - 4; z += 7) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.0), materials.roadStripe);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(bx, deckY + 0.15, z);
    g.add(dash);
  }

  // Sloped approach ramps connecting y=11.4 down to GROUND_Y=3.2 at z=-112 and z=+118
  const rampSpecs = [
    { zStart: flatNorthZ, zEnd: -112, dir: -1 },
    { zStart: flatSouthZ, zEnd: 118, dir: 1 },
  ];
  for (const rs of rampSpecs) {
    const rampLen = Math.abs(rs.zEnd - rs.zStart);
    const dy = deckY - (GROUND_Y + 0.15);
    const angle = Math.atan2(dy, rampLen);
    const hyp = Math.hypot(rampLen, dy);

    const ramp = new THREE.Group();
    const rSlab = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.9, hyp), materials.concreteMid);
    rSlab.castShadow = true;
    rSlab.receiveShadow = true;
    ramp.add(rSlab);

    const rRoad = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.14, hyp), materials.asphalt);
    rRoad.position.y = 0.5;
    rRoad.receiveShadow = true;
    ramp.add(rRoad);

    ramp.position.set(bx, (deckY - 0.4 + GROUND_Y) / 2, (rs.zStart + rs.zEnd) / 2);
    ramp.rotation.x = rs.dir > 0 ? angle : -angle;
    g.add(ramp);
  }

  // Approach piers on land (well outside water!)
  for (const pz of [-84, -60, 66, 90]) {
    const isSloped = pz === -84 || pz === 90;
    const topY = isSloped ? 7.4 : deckY - 0.8;
    const h = topY + 2.5;
    for (const sx of [-3.1, 3.1]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, h, 8), materials.concreteMid);
      col.position.set(bx + sx, topY - h / 2, pz);
      col.castShadow = true;
      g.add(col);
    }
  }

  // Twin tall white cable-stayed pylons + fan cables
  for (const pz of [pylonNorthZ, pylonSouthZ]) {
    // Riverbank concrete pier foundation
    const pier = new THREE.Mesh(new THREE.BoxGeometry(13.0, 14.5, 4.6), materials.concreteMid);
    pier.position.set(bx, 3.6, pz);
    pier.castShadow = true;
    g.add(pier);

    // Tall sleek white H-pylon legs rising to y = 41
    const legH = 32;
    for (const sx of [-5.2, 5.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, legH, 2.4), materials.whiteMarble);
      leg.position.set(bx + sx, 9.5 + legH / 2, pz);
      leg.castShadow = true;
      g.add(leg);

      // Vertical LED strip on pylon
      const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.24, legH - 6, 0.28), materials.musiLedGlow);
      pLed.position.set(bx + sx + Math.sign(sx) * 0.82, 11.5 + (legH - 6) / 2, pz);
      g.add(pLed);
    }

    // Upper crossbars
    for (const cy of [25.5, 38.5]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.4, 2.0), materials.whiteMarble);
      bar.position.set(bx, cy, pz);
      bar.castShadow = true;
      g.add(bar);
    }

    // Gold Songket-inspired crown fin atop pylon
    const crown = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.65, 2.4), materials.gold);
    crown.position.set(bx, 41.8, pz);
    g.add(crown);

    // Fan of silver stay cables reaching out toward midspan & backspan
    const dirInward = pz < 0 ? 1 : -1;
    const cableDists = [10, 18, 27, 36, 44];
    for (let i = 0; i < cableDists.length; i++) {
      const d = cableDists[i];
      const anchorY = 39.2 - i * 1.9;
      for (const sx of [-4.9, 4.9]) {
        // Toward midspan
        addBeam(
          g,
          new THREE.Vector3(bx + sx, anchorY, pz),
          new THREE.Vector3(bx + sx, deckY + 0.3, pz + dirInward * d),
          0.11,
          materials.cableSilver
        );
        // Backspan stay (shorter)
        if (i < 3) {
          addBeam(
            g,
            new THREE.Vector3(bx + sx, anchorY, pz),
            new THREE.Vector3(bx + sx, deckY + 0.3, pz - dirInward * (9 + i * 7)),
            0.11,
            materials.cableSilver
          );
        }
      }
    }
  }

  // Animated vehicles crossing Jembatan Musi IV
  const vehicles = [];
  const carPalette = ['#f2eee6', '#d69f38', '#c84b31', '#2d8a6e', '#335c81'];
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const car = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 2.5),
      new THREE.MeshStandardMaterial({ color: carPalette[i % carPalette.length], roughness: 0.55 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    car.add(body);

    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.12), materials.warmGlow);
    hl.position.set(0, 0.42, dir * 1.28);
    car.add(hl);

    const startZ = -95 + i * 44;
    car.position.set(bx + dir * 1.7, deckY + 0.14, startZ);
    g.add(car);
    vehicles.push({ mesh: car, z: startZ, dir, speed: 13 + (i % 3) * 2.5 });
  }

  const bridgeLight = new THREE.PointLight('#74b9ff', 0, 120, 1.4);
  bridgeLight.position.set(bx, 24, 5);
  g.add(bridgeLight);

  return { group: g, vehicles, bridgeLight, flatNorthZ, flatSouthZ, deckY };
}

export function createExtraLandmarks(scene, env) {
  const group = new THREE.Group();
  group.name = 'PalembangExtraLandmarks';

  const pbr = getPBRTextures();
  const materials = {
    asphalt: new THREE.MeshStandardMaterial({
      color: '#b0b5bd',
      map: pbr.asphalt.map,
      bumpMap: pbr.asphalt.bumpMap,
      bumpScale: 0.18,
      roughness: 0.88,
    }),
    roadStripe: new THREE.MeshBasicMaterial({ color: '#eee8d6' }),
    stoneLight: new THREE.MeshStandardMaterial({
      color: '#ded8cb',
      map: pbr.plaza.map,
      bumpMap: pbr.plaza.bumpMap,
      bumpScale: 0.14,
      roughness: 0.82,
    }),
    stonePlaza: new THREE.MeshStandardMaterial({
      color: '#cec7ba',
      map: pbr.plaza.map,
      bumpMap: pbr.plaza.bumpMap,
      bumpScale: 0.18,
      roughness: 0.86,
    }),
    concreteMid: new THREE.MeshStandardMaterial({
      color: '#aeb4ba',
      map: pbr.plaster.map,
      roughness: 0.84,
    }),
    concreteDark: new THREE.MeshStandardMaterial({ color: '#4d545d', roughness: 0.78 }),
    whiteMarble: new THREE.MeshStandardMaterial({
      color: '#faf7f0',
      map: pbr.plaster.map,
      bumpMap: pbr.plaster.bumpMap,
      bumpScale: 0.15,
      roughness: 0.66,
    }),
    creamWall: new THREE.MeshStandardMaterial({
      color: '#f2ead9',
      map: pbr.plaster.map,
      bumpMap: pbr.plaster.bumpMap,
      bumpScale: 0.18,
      roughness: 0.76,
    }),
    ochreWall: new THREE.MeshStandardMaterial({
      color: '#edd297',
      map: pbr.plaster.map,
      bumpMap: pbr.plaster.bumpMap,
      bumpScale: 0.18,
      roughness: 0.76,
    }),
    terracotta: new THREE.MeshStandardMaterial({
      color: '#e8b6a6',
      map: pbr.roofTile.map,
      bumpMap: pbr.roofTile.bumpMap,
      bumpScale: 0.28,
      roughness: 0.74,
    }),
    crimson: new THREE.MeshStandardMaterial({ color: '#bd2f29', roughness: 0.52, metalness: 0.12 }),
    emerald: new THREE.MeshStandardMaterial({ color: '#21704b', roughness: 0.68 }),
    lrtBlue: new THREE.MeshStandardMaterial({ color: '#1f70b8', roughness: 0.42, metalness: 0.25 }),
    slateRoof: new THREE.MeshStandardMaterial({ color: '#4e6070', roughness: 0.72, metalness: 0.15 }),
    gold: new THREE.MeshStandardMaterial({ color: '#e2ae2e', roughness: 0.28, metalness: 0.65 }),
    woodDark: new THREE.MeshStandardMaterial({ color: '#4e3320', roughness: 0.88 }),
    woodMid: new THREE.MeshStandardMaterial({ color: '#784e30', roughness: 0.82 }),
    steelLight: new THREE.MeshStandardMaterial({
      color: '#dce2e8',
      bumpMap: pbr.steelBump,
      bumpScale: 0.1,
      roughness: 0.36,
      metalness: 0.5,
    }),
    cableSilver: new THREE.MeshStandardMaterial({ color: '#c4cdd8', roughness: 0.25, metalness: 0.78 }),
    parkGrass: new THREE.MeshStandardMaterial({
      color: '#88b37a',
      map: pbr.grass.map,
      bumpMap: pbr.grass.bumpMap,
      bumpScale: 0.24,
      roughness: 0.92,
    }),
    pitchGrass: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: pbr.pitchMap,
      roughness: 0.86,
    }),
    fountainWater: new THREE.MeshStandardMaterial({
      color: '#258799',
      roughness: 0.1,
      metalness: 0.35,
    }),
    waterSpray: new THREE.MeshStandardMaterial({
      color: '#ddf6ff',
      transparent: true,
      opacity: 0.76,
      emissive: '#89d4f5',
      emissiveIntensity: 0.2,
      roughness: 0.18,
    }),
    windowGlow: new THREE.MeshStandardMaterial({
      color: '#ffe099',
      emissive: '#ffaa38',
      emissiveIntensity: 0.18,
    }),
    warmGlow: new THREE.MeshStandardMaterial({
      color: '#fff0c4',
      emissive: '#ffba49',
      emissiveIntensity: 0.3,
    }),
    stadiumLightGlow: new THREE.MeshStandardMaterial({
      color: '#fffaf0',
      emissive: '#fff2cc',
      emissiveIntensity: 0.35,
    }),
    musiLedGlow: new THREE.MeshStandardMaterial({
      color: '#b8e1ff',
      emissive: '#4fa8ff',
      emissiveIntensity: 0.25,
    }),
  };

  const bam = createBundaranAirMancur(materials);
  group.add(bam.group);

  group.add(createPasar16Ilir(materials));
  group.add(createWalikotaAndMuseum(materials));

  const kambang = createKambangIwak(materials);
  group.add(kambang.group);

  group.add(createKampungKapitan(materials));

  const jakabaring = createJakabaringStadium(materials);
  group.add(jakabaring.group);

  const musiIV = createMusiIVBridge(materials);
  group.add(musiIV.group);

  env.onLightingChange((cfg) => {
    materials.windowGlow.emissiveIntensity = 0.15 + cfg.nightGlow * 2.1;
    materials.warmGlow.emissiveIntensity = 0.25 + cfg.nightGlow * 2.5;
    materials.stadiumLightGlow.emissiveIntensity = 0.3 + cfg.nightGlow * 3.8;
    materials.musiLedGlow.emissiveIntensity = 0.2 + cfg.nightGlow * 2.6;
    materials.waterSpray.emissiveIntensity = 0.15 + cfg.nightGlow * 1.4;
    bam.light.intensity = cfg.nightGlow * 2.8;
    jakabaring.pitchLight.intensity = cfg.nightGlow * 5.2;
    musiIV.bridgeLight.intensity = cfg.nightGlow * 3.4;
  });

  scene.add(group);

  return {
    group,
    update(elapsed, delta) {
      // Pulse animated fountain jets at Bundaran Air Mancur & Kambang Iwak
      for (const j of bam.jets) {
        const pulse = 0.84 + 0.24 * Math.sin(elapsed * 4.4 + j.phase);
        j.mesh.scale.y = j.baseScaleY * pulse;
      }
      kambang.lakeJet.scale.y = 0.86 + 0.2 * Math.sin(elapsed * 3.6);

      // Animate vehicles crossing Jembatan Musi IV
      for (const v of musiIV.vehicles) {
        v.z += v.dir * v.speed * delta;
        if (v.z > 114) v.z = -108;
        if (v.z < -108) v.z = 114;

        let y = musiIV.deckY + 0.14;
        if (v.z < musiIV.flatNorthZ) {
          const t = Math.min(1, (musiIV.flatNorthZ - v.z) / 52);
          y = musiIV.deckY + 0.14 - t * (musiIV.deckY - GROUND_Y);
        } else if (v.z > musiIV.flatSouthZ) {
          const t = Math.min(1, (v.z - musiIV.flatSouthZ) / 52);
          y = musiIV.deckY + 0.14 - t * (musiIV.deckY - GROUND_Y);
        }
        v.mesh.position.z = v.z;
        v.mesh.position.y = y;
      }
    },
  };
}
