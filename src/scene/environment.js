import * as THREE from 'three';

const LIGHTING_CONFIGS = {
  siang: {
    label: 'Siang',
    skyTop: new THREE.Color('#24639e'),
    skyHorizon: new THREE.Color('#c8e2f2'),
    sunColor: new THREE.Color('#fff5de'),
    sunIntensity: 2.3,
    sunPosition: new THREE.Vector3(145, 165, 110),
    hemiSky: new THREE.Color('#bce0f7'),
    hemiGround: new THREE.Color('#4c5c40'),
    hemiIntensity: 0.85,
    ambientIntensity: 0.22,
    fogColor: new THREE.Color('#c7e0ef'),
    fogDensity: 0.00095,
    waterDeep: new THREE.Color('#1d4b52'),
    waterShallow: new THREE.Color('#356c69'),
    nightGlow: 0.0,
    envIntensity: 0.72,
    exposure: 1.04,
    bloom: { threshold: 0.96, strength: 0.14, radius: 0.32 },
  },
  senja: {
    label: 'Senja',
    skyTop: new THREE.Color('#1e2752'),
    skyHorizon: new THREE.Color('#eb864b'),
    sunColor: new THREE.Color('#ffac54'),
    sunIntensity: 2.35,
    sunPosition: new THREE.Vector3(-195, 42, 95),
    hemiSky: new THREE.Color('#e8946e'),
    hemiGround: new THREE.Color('#352d38'),
    hemiIntensity: 0.78,
    ambientIntensity: 0.2,
    fogColor: new THREE.Color('#cf7f58'),
    fogDensity: 0.00118,
    waterDeep: new THREE.Color('#1e3645'),
    waterShallow: new THREE.Color('#5f5152'),
    nightGlow: 0.76,
    envIntensity: 0.65,
    exposure: 1.06,
    bloom: { threshold: 0.8, strength: 0.36, radius: 0.5 },
  },
  malam: {
    label: 'Malam',
    skyTop: new THREE.Color('#060c1b'),
    skyHorizon: new THREE.Color('#182a45'),
    sunColor: new THREE.Color('#a4c1f0'),
    sunIntensity: 1.05,
    sunPosition: new THREE.Vector3(120, 145, 115),
    hemiSky: new THREE.Color('#2f4c78'),
    hemiGround: new THREE.Color('#141b24'),
    hemiIntensity: 0.72,
    ambientIntensity: 0.22,
    fogColor: new THREE.Color('#122033'),
    fogDensity: 0.0011,
    waterDeep: new THREE.Color('#091c29'),
    waterShallow: new THREE.Color('#143144'),
    nightGlow: 1.0,
    envIntensity: 0.45,
    exposure: 1.08,
    bloom: { threshold: 0.68, strength: 0.52, radius: 0.6 },
  },
};

// Procedural equirectangular sky canvas for PMREM IBL environment reflections
function buildSkyIBLTexture(renderer, cfg) {
  const w = 128;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, `#${cfg.skyTop.getHexString()}`);
  grad.addColorStop(0.47, `#${cfg.skyHorizon.getHexString()}`);
  grad.addColorStop(0.54, `#${cfg.hemiGround.getHexString()}`);
  grad.addColorStop(1.0, '#1e2420');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Add bright sun/moon hotspot for specular IBL reflections
  const sunDir = cfg.sunPosition.clone().normalize();
  const u = (Math.atan2(sunDir.z, sunDir.x) / (Math.PI * 2) + 1) % 1;
  const v = Math.acos(THREE.MathUtils.clamp(sunDir.y, -1, 1)) / Math.PI;
  const sx = u * w;
  const sy = v * h;
  const rGrad = ctx.createRadialGradient(sx, sy, 1, sx, sy, 18);
  rGrad.addColorStop(0, `#${cfg.sunColor.getHexString()}`);
  rGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rGrad;
  ctx.fillRect(0, 0, w, h);

  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(equirect);
  equirect.dispose();
  pmrem.dispose();
  return envRT;
}

export function createEnvironment(scene, renderer) {
  let currentMode = 'siang';
  let currentGlow = LIGHTING_CONFIGS.siang.nightGlow;

  // Pre-bake lightweight PMREM environment textures for all 3 lighting moods
  const envMaps = {};
  if (renderer) {
    for (const [key, cfg] of Object.entries(LIGHTING_CONFIGS)) {
      envMaps[key] = buildSkyIBLTexture(renderer, cfg);
    }
  }

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

  const sunLight = new THREE.DirectionalLight('#fff5de', LIGHTING_CONFIGS.siang.sunIntensity);
  sunLight.position.copy(LIGHTING_CONFIGS.siang.sunPosition);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 760;
  sunLight.shadow.camera.left = -330;
  sunLight.shadow.camera.right = 330;
  sunLight.shadow.camera.top = 270;
  sunLight.shadow.camera.bottom = -270;
  sunLight.shadow.bias = -0.00045;
  sunLight.shadow.normalBias = 0.04;
  scene.add(sunLight);

  // Subtle sky-tinted bounce fill from opposite azimuth
  const fillLight = new THREE.DirectionalLight('#9ec4e6', 0.34);
  fillLight.position.set(-140, 85, -130);
  scene.add(fillLight);

  // Atmospheric Sky Dome Shader (procedural soft tropical clouds + golden sunset scatter + subtle night stars)
  const skyUniforms = {
    uTopColor: { value: LIGHTING_CONFIGS.siang.skyTop.clone() },
    uHorizonColor: { value: LIGHTING_CONFIGS.siang.skyHorizon.clone() },
    uSunColor: { value: LIGHTING_CONFIGS.siang.sunColor.clone() },
    uSunDir: { value: LIGHTING_CONFIGS.siang.sunPosition.clone().normalize() },
    uNightGlow: { value: 0.0 },
    uTime: { value: 0.0 },
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
      uniform float uTime;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          v += amp * noise2D(p);
          p *= 2.04;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.54));

        // Sun glow & atmospheric Mie scatter
        float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
        float sunGlow = pow(sunAmt, 12.0) * (0.48 - 0.28 * uNightGlow);
        float sunDisc = smoothstep(0.9975, 0.9993, sunAmt) * (1.0 - 0.68 * uNightGlow);
        col += uSunColor * (sunGlow + sunDisc * 1.35);

        // Soft drifting tropical cloud layer in upper sky
        if (dir.y > 0.04) {
          vec2 cloudUv = dir.xz / (dir.y + 0.22) * 1.45 + vec2(uTime * 0.008, uTime * 0.003);
          float c = fbm(cloudUv);
          float cloudMask = smoothstep(0.52, 0.8, c) * smoothstep(0.04, 0.22, dir.y) * (1.0 - smoothstep(0.7, 1.0, dir.y));
          vec3 cloudCol = mix(vec3(0.96, 0.97, 0.99), uSunColor * 1.08, clamp(uNightGlow * 0.9, 0.0, 0.85));
          cloudCol = mix(cloudCol, vec3(0.16, 0.24, 0.38), smoothstep(0.82, 1.0, uNightGlow));
          col = mix(col, cloudCol, cloudMask * (0.48 - 0.26 * smoothstep(0.8, 1.0, uNightGlow)));
        }

        // Subtle crisp starfield at Night
        if (uNightGlow > 0.85 && dir.y > 0.12) {
          vec2 starGrid = floor((dir.xz / (dir.y + 0.15)) * 120.0);
          float s = hash21(starGrid);
          float star = smoothstep(0.994, 0.999, s) * smoothstep(0.85, 1.0, uNightGlow) * smoothstep(0.12, 0.4, dir.y);
          col += vec3(0.85, 0.92, 1.0) * star * 0.7;
        }

        // Horizon mist band blending smoothly into FogExp2
        float mist = exp(-abs(dir.y) * 9.5) * 0.22;
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
    const key = mode in LIGHTING_CONFIGS ? mode : 'siang';
    const cfg = LIGHTING_CONFIGS[key];
    currentMode = key;
    currentGlow = cfg.nightGlow;

    sunLight.color.copy(cfg.sunColor);
    sunLight.intensity = cfg.sunIntensity;
    sunLight.position.copy(cfg.sunPosition);

    hemiLight.color.copy(cfg.hemiSky);
    hemiLight.groundColor.copy(cfg.hemiGround);
    hemiLight.intensity = cfg.hemiIntensity;
    ambientLight.intensity = cfg.ambientIntensity;
    fillLight.intensity = key === 'malam' ? 0.22 : 0.34;

    fog.color.copy(cfg.fogColor);
    fog.density = cfg.fogDensity;
    scene.background.copy(cfg.skyHorizon);

    if (envMaps[key]) {
      scene.environment = envMaps[key].texture;
      scene.environmentIntensity = cfg.envIntensity;
    }
    if (renderer) {
      renderer.toneMappingExposure = cfg.exposure;
    }

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
    update(elapsed) {
      skyUniforms.uTime.value = elapsed;
    },
    getLighting: () => currentMode,
    getNightGlow: () => currentGlow,
    getSunDirection: () => sunLight.position.clone().normalize(),
    getCurrentConfig: () => LIGHTING_CONFIGS[currentMode],
  };
}
