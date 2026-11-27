import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';
import { createEnvironment } from './scene/environment.js';
import { createRiverMusi } from './scene/riverMusi.js';
import { createAmperaBridge } from './scene/ampera.js';
import { createKutoBesak } from './scene/kutoBesak.js';
import { createPulauKemaro } from './scene/pulauKemaro.js';
import { createCityContext } from './scene/cityContext.js';
import { createExtraLandmarks } from './scene/landmarksExtra.js';
import { createUrbanFabric } from './scene/urbanFabric.js';
import { CAMERA_PRESETS } from './ui/landmarks.js';
import { createHud } from './ui/hud.js';

const rootEl = document.getElementById('app');

function showWebGLFallback(reason) {
  rootEl.innerHTML = `
    <div class="webgl-fallback" role="alert">
      <h2>Konteks WebGL tidak tersedia</h2>
      <p>Peramban atau lingkungan grafis Anda tidak berhasil menginisialisasi WebGL untuk merender diorama 3D Kota Palembang.</p>
      <p class="fallback-detail">Detail teknis: ${String(reason || 'WebGL context creation failed')}</p>
      <p>Coba aktifkan akselerasi perangkat keras di pengaturan peramban atau jalankan dengan Chrome/Safari versi terbaru.</p>
    </div>
  `;
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
  } catch (err) {
    console.warn('WebGL initialization failed:', err?.message || err);
    showWebGLFallback(err?.message || err);
    return;
  }

  if (!renderer || !renderer.getContext()) {
    console.warn('WebGL context returned null');
    showWebGLFallback('WebGL context returned null');
    return;
  }

  const width = rootEl.clientWidth || window.innerWidth;
  const height = rootEl.clientHeight || window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-stage';
  canvasWrap.appendChild(renderer.domElement);
  rootEl.appendChild(canvasWrap);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(44, width / height, 1.5, 1600);
  const initialPreset = CAMERA_PRESETS[0];
  camera.position.set(...initialPreset.cameraPos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.465;
  controls.minPolarAngle = 0.12;
  controls.minDistance = 26;
  controls.maxDistance = 480;
  controls.target.set(...initialPreset.target);
  controls.update();

  // Build scene modules (pass renderer for PMREM dynamic sky IBL reflections)
  const env = createEnvironment(scene, renderer);
  const river = createRiverMusi(scene, env);
  const ampera = createAmperaBridge(scene, env);
  createKutoBesak(scene, env);
  createPulauKemaro(scene, env);
  const city = createCityContext(scene, env);
  const extraLandmarks = createExtraLandmarks(scene, env);
  const urbanFabric = createUrbanFabric(scene, env);

  // Post-processing pipeline (RenderPass -> UnrealBloomPass -> ACES/sRGB OutputPass)
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  composer.setSize(width, height);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  let lastSceneDrawCalls = 0;
  let lastSceneTriangles = 0;
  const origRender = renderPass.render.bind(renderPass);
  renderPass.render = (r, writeBuffer, readBuffer, deltaTime, maskActive) => {
    origRender(r, writeBuffer, readBuffer, deltaTime, maskActive);
    lastSceneDrawCalls = r.info.render.calls;
    lastSceneTriangles = r.info.render.triangles;
  };
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.14, 0.32, 0.96);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  env.onLightingChange((cfg) => {
    if (cfg.bloom) {
      bloomPass.threshold = cfg.bloom.threshold;
      bloomPass.strength = cfg.bloom.strength;
      bloomPass.radius = cfg.bloom.radius;
    }
  });

  // Count meshes once scene is assembled
  let meshCount = 0;
  scene.traverse((obj) => {
    if (obj.isMesh) meshCount += 1;
  });

  // Camera tween state
  let tweenState = null;
  controls.addEventListener('start', () => {
    tweenState = null;
  });

  function selectPreset(presetId) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    hud.syncState({ presetId: preset.id });
    tweenState = {
      startTime: performance.now(),
      duration: 820,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...preset.cameraPos),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...preset.target),
    };
  }

  function selectLighting(mode) {
    env.setLighting(mode);
    hud.syncState({ lightingMode: env.getLighting() });
  }

  function toggleLabels() {
    const next = !hud.getState().labelsVisible;
    hud.syncState({ showLabels: next });
  }

  const hud = createHud({
    rootEl,
    camera,
    onSelectPreset: selectPreset,
    onSelectLighting: selectLighting,
    onToggleLabels: toggleLabels,
  });

  // Resize handling
  function handleResize() {
    const w = rootEl.clientWidth || window.innerWidth;
    const h = rootEl.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  // WebGL context metadata for read-only telemetry
  const gl = renderer.getContext();
  const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
  const webglRendererStr = debugExt
    ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  let fps = 60;
  let frameCounter = 0;
  let fpsTimer = performance.now();
  let isReady = false;

  Object.defineProperty(window, '__PALEMBANG_3D__', {
    enumerable: true,
    configurable: false,
    get() {
      const hudState = hud.getState();
      return Object.freeze({
        ready: isReady,
        preset: hudState.activePreset,
        lighting: hudState.activeLighting,
        labelsVisible: hudState.labelsVisible,
        tweening: Boolean(tweenState),
        landmarkCount: CAMERA_PRESETS.length,
        meshCount,
        urbanStats: Object.freeze({ ...urbanFabric.stats }),
        fps,
        rendererInfo: Object.freeze({
          drawCalls: lastSceneDrawCalls,
          triangles: lastSceneTriangles,
          webglRenderer: String(webglRendererStr || 'WebGL'),
        }),
        camera: Object.freeze({
          x: Number(camera.position.x.toFixed(2)),
          y: Number(camera.position.y.toFixed(2)),
          z: Number(camera.position.z.toFixed(2)),
        }),
      });
    },
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    if (tweenState) {
      const t = Math.min(1, (performance.now() - tweenState.startTime) / tweenState.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(tweenState.fromPos, tweenState.toPos, ease);
      controls.target.lerpVectors(tweenState.fromTarget, tweenState.toTarget, ease);
      if (t >= 1) tweenState = null;
    }

    env.update(elapsed);
    river.update(elapsed, delta);
    ampera.update(elapsed, delta);
    city.update(elapsed);
    extraLandmarks.update(elapsed, delta);
    urbanFabric.update(elapsed, delta);

    controls.update();
    composer.render();

    const w = rootEl.clientWidth || window.innerWidth;
    const h = rootEl.clientHeight || window.innerHeight;
    hud.updatePins(w, h);

    if (!isReady) {
      isReady = true;
      rootEl.dataset.ready = 'true';
    }

    frameCounter += 1;
    const now = performance.now();
    if (now - fpsTimer >= 500) {
      fps = Math.round((frameCounter * 1000) / (now - fpsTimer));
      frameCounter = 0;
      fpsTimer = now;
    }
  }

  animate();
}

init();
