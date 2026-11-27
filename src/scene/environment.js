import * as THREE from 'three';

const LIGHTING_CONFIGS = {
  siang: {
    label: 'Siang',
    skyTop: new THREE.Color('#2b6ea8'),
    skyHorizon: new THREE.Color('#c7e1f0'),
    sunColor: new THREE.Color('#fff4db'),
    sunIntensity: 2.35,
    sunPosition: new THREE.Vector3(145, 165, 110),
    hemiSky: new THREE.Color('#b6dcf5'),
    hemiGround: new THREE.Color('#4f5e42'),
    hemiIntensity: 0.95,
    ambientIntensity: 0.28,
    fogColor: new THREE.Color('#c6dfed'),
    fogDensity: 0.00105,
    waterDeep: new THREE.Color('#235156'),
    waterShallow: new THREE.Color('#3b6e6a'),
    nightGlow: 0.0,
  },
  senja: {
    label: 'Senja',
    skyTop: new THREE.Color('#262e57'),
    skyHorizon: new THREE.Color('#e88a54'),
    sunColor: new THREE.Color('#ffb15e'),
    sunIntensity: 2.25,
    sunPosition: new THREE.Vector3(-190, 46, 95),
    hemiSky: new THREE.Color('#e39774'),
    hemiGround: new THREE.Color('#3a323b'),
    hemiIntensity: 0.85,
    ambientIntensity: 0.25,
    fogColor: new THREE.Color('#d28661'),
    fogDensity: 0.00125,
    waterDeep: new THREE.Color('#223b47'),
    waterShallow: new THREE.Color('#5a5656'),
    nightGlow: 0.72,
  },
  malam: {
    label: 'Malam',
    skyTop: new THREE.Color('#081021'),
    skyHorizon: new THREE.Color('#1b2e4a'),
    sunColor: new THREE.Color('#a9c4f0'),
    sunIntensity: 1.15,
    sunPosition: new THREE.Vector3(120, 145, 115),
    hemiSky: new THREE.Color('#355380'),
    hemiGround: new THREE.Color('#1b222c'),
    hemiIntensity: 0.85,
    ambientIntensity: 0.3,
    fogColor: new THREE.Color('#162438'),
    fogDensity: 0.00115,
    waterDeep: new THREE.Color('#0d2230'),
    waterShallow: new THREE.Color('#1a394a'),
    nightGlow: 1.0,
  },
};

export function createEnvironment(scene) {
  let currentMode = 'siang';
  let currentGlow = LIGHTING_CONFIGS.siang.nightGlow;

  const fog = new THREE.FogExp2(LIGHTING_CONFIGS.siang.fogColor.getHex(), LIGHTING_CONFIGS.siang.fogDensity);
  scene.fog = fog;
  scene.background = LIGHTING_CONFIGS.siang.skyHorizon.clone();

  const ambientLight = new THREE.AmbientLight('#ffffff', LIGHTING_CONFIGS.siang.ambientIntensity);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(
    LIGHTING_CONFIGS.siang.hemiSky,
    LIGHTING_CONFIGS.siang.hemiGround,
    LIGHTING_CONFIGS.siang.hemiIntensity
  );
  hemiLight.position.set(0, 180, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff4db', LIGHTING_CONFIGS.siang.sunIntensity);
  sunLight.position.copy(LIGHTING_CONFIGS.siang.sunPosition);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 760;
  sunLight.shadow.camera.left = -330;
  sunLight.shadow.camera.right = 330;
  sunLight.shadow.camera.top = 270;
  sunLight.shadow.camera.bottom = -270;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Subtle fill light from opposite direction for crisp stylized readability
  const fillLight = new THREE.DirectionalLight('#9ec4e6', 0.38);
  fillLight.position.set(-140, 85, -130);
  scene.add(fillLight);

  // Sky dome shader
  const skyUniforms = {
    uTopColor: { value: LIGHTING_CONFIGS.siang.skyTop.clone() },
    uHorizonColor: { value: LIGHTING_CONFIGS.siang.skyHorizon.clone() },
    uSunColor: { value: LIGHTING_CONFIGS.siang.sunColor.clone() },
    uSunDir: { value: LIGHTING_CONFIGS.siang.sunPosition.clone().normalize() },
    uNightGlow: { value: 0.0 },
  };

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uNightGlow;
      varying vec3 vWorldPos;

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.52));

        float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
        float sunGlow = pow(sunAmt, 14.0) * (0.45 - 0.25 * uNightGlow);
        float sunDisc = smoothstep(0.9975, 0.9992, sunAmt) * (1.0 - 0.65 * uNightGlow);
        col += uSunColor * (sunGlow + sunDisc * 1.3);

        // Subtle horizon mist band
        float mist = exp(-abs(dir.y) * 10.0) * 0.16;
        col = mix(col, uHorizonColor, mist);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(780, 32, 20), skyMat);
  skyDome.name = 'SkyDome';
  scene.add(skyDome);

  const glowListeners = [];

  function setLighting(mode) {
    const cfg = LIGHTING_CONFIGS[mode] || LIGHTING_CONFIGS.siang;
    currentMode = mode in LIGHTING_CONFIGS ? mode : 'siang';
    currentGlow = cfg.nightGlow;

    sunLight.color.copy(cfg.sunColor);
    sunLight.intensity = cfg.sunIntensity;
    sunLight.position.copy(cfg.sunPosition);

    hemiLight.color.copy(cfg.hemiSky);
    hemiLight.groundColor.copy(cfg.hemiGround);
    hemiLight.intensity = cfg.hemiIntensity;
    ambientLight.intensity = cfg.ambientIntensity;
    fillLight.intensity = currentMode === 'malam' ? 0.24 : 0.38;

    fog.color.copy(cfg.fogColor);
    fog.density = cfg.fogDensity;
    scene.background.copy(cfg.skyHorizon);

    skyUniforms.uTopColor.value.copy(cfg.skyTop);
    skyUniforms.uHorizonColor.value.copy(cfg.skyHorizon);
    skyUniforms.uSunColor.value.copy(cfg.sunColor);
    skyUniforms.uSunDir.value.copy(cfg.sunPosition).normalize();
    skyUniforms.uNightGlow.value = cfg.nightGlow;

    for (const fn of glowListeners) {
      fn(cfg, currentMode);
    }
  }

  function onLightingChange(fn) {
    glowListeners.push(fn);
    fn(LIGHTING_CONFIGS[currentMode], currentMode);
  }

  setLighting('siang');

  return {
    setLighting,
    onLightingChange,
    getLighting: () => currentMode,
    getNightGlow: () => currentGlow,
    getSunDirection: () => sunLight.position.clone().normalize(),
    getCurrentConfig: () => LIGHTING_CONFIGS[currentMode],
  };
}
