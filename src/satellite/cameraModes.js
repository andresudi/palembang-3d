// Interactive camera modes for Real Satellite 3D:
// - Ride-Along 1-click follow cam (LRT Sumsel, Perahu Ketek, Coal Barge)
// - Cinematic Auto-Tour across all Palembang landmarks
// - Free Drone flight (WASD / Arrow keys + Q/E altitude + Shift boost)
import { REAL_PRESETS } from './realLandmarks.js';

const BOUNDS = {
  minLng: 104.728,
  maxLng: 104.832,
  minLat: -3.038,
  maxLat: -2.964,
};

function lerpAngleDeg(current, target, alpha) {
  let diff = ((target - current + 540) % 360) - 180;
  return (current + diff * alpha + 360) % 360;
}

const RIDE_CONFIGS = {
  lrt: {
    id: 'ride-lrt',
    title: 'Naik LRT Sumsel',
    zoom: 17.55,
    pitch: 70,
    leadMeters: 52,
  },
  boat: {
    id: 'ride-boat',
    title: 'Naik Perahu Ketek',
    zoom: 17.85,
    pitch: 72,
    leadMeters: 28,
  },
  barge: {
    id: 'ride-barge',
    title: 'Ikut Tongkang Batu Bara',
    zoom: 17.15,
    pitch: 68,
    leadMeters: 58,
  },
};

export function createCameraModesController({
  map,
  traffic3d,
  ensureTrafficEnabled,
  onSelectPreset,
  onStateChange,
}) {
  let mode = 'free'; // 'free' | 'ride-lrt' | 'ride-boat' | 'ride-barge' | 'tour' | 'drone'
  let rafId = null;
  let lastTs = 0;

  // Ride-Along state
  let rideKind = null;
  let rideTargetIdx = 0;
  let smoothLng = 104.7634;
  let smoothLat = -2.9919;
  let smoothBearing = 0;
  let rideInitialized = false;
  let lastRideSubtitle = '';
  let lastRideSpeed = 0;

  // Cinematic Auto-Tour state
  let tourIndex = 0;
  let tourPaused = false;
  let tourPhase = 'flying'; // 'flying' | 'orbiting'
  let tourHoldElapsed = 0;
  const TOUR_HOLD_SEC = 6.2;

  // Free Drone state
  const keysDown = new Set();
  const virtualInput = { forward: 0, right: 0, up: 0, turn: 0 };
  let droneVelFwd = 0;
  let droneVelRight = 0;
  let droneVelZoom = 0;
  let droneVelTurn = 0;

  function emitState() {
    onStateChange(getState());
  }

  function getState() {
    if (mode.startsWith('ride-')) {
      const cfg = RIDE_CONFIGS[rideKind];
      return {
        mode,
        label: cfg?.title || 'Ride-Along',
        detail: `${lastRideSpeed} km/j · ${lastRideSubtitle}`,
        tourIndex: null,
        tourTotal: REAL_PRESETS.length,
        tourPaused: false,
      };
    }
    if (mode === 'tour') {
      const p = REAL_PRESETS[tourIndex] || REAL_PRESETS[0];
      return {
        mode,
        label: `Tur Sinematik (${tourIndex + 1}/${REAL_PRESETS.length})`,
        detail: `${p.label}${tourPaused ? ' · Dijeda' : ''}`,
        tourIndex,
        tourTotal: REAL_PRESETS.length,
        tourPaused,
      };
    }
    if (mode === 'drone') {
      return {
        mode,
        label: 'Free Drone Palembang',
        detail: 'WASD / Panah gerak · Q/E tinggi · Shift cepat · Esc keluar',
        tourIndex: null,
        tourTotal: REAL_PRESETS.length,
        tourPaused: false,
      };
    }
    return {
      mode: 'free',
      label: '',
      detail: '',
      tourIndex: null,
      tourTotal: REAL_PRESETS.length,
      tourPaused: false,
    };
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = 0;
  }

  function stopAll() {
    if (mode === 'free') return;
    stopLoop();
    mode = 'free';
    rideKind = null;
    rideInitialized = false;
    tourPaused = false;
    keysDown.clear();
    virtualInput.forward = 0;
    virtualInput.right = 0;
    virtualInput.up = 0;
    virtualInput.turn = 0;
    droneVelFwd = 0;
    droneVelRight = 0;
    droneVelZoom = 0;
    droneVelTurn = 0;
    emitState();
  }

  function startRide(kind) {
    const cfg = RIDE_CONFIGS[kind];
    if (!cfg) return;
    stopAll();
    ensureTrafficEnabled();

    const c = map.getCenter();
    rideKind = kind;
    rideTargetIdx = traffic3d.pickClosestTargetIndex(kind, c.lng, c.lat);
    mode = cfg.id;
    rideInitialized = false;

    const initialPose = traffic3d.getFollowTarget(rideKind, rideTargetIdx);
    lastRideSpeed = initialPose.speedKmh;
    lastRideSubtitle = initialPose.subtitle;

    // Smooth initial fly-in onto the moving vehicle, then lock chase-cam
    const leadLng = initialPose.lng + (initialPose.fx * cfg.leadMeters) / 111160;
    const leadLat = initialPose.lat - (initialPose.fz * cfg.leadMeters) / 110574;
    smoothLng = leadLng;
    smoothLat = leadLat;
    smoothBearing = initialPose.bearingDeg;

    map.jumpTo({
      center: [leadLng, leadLat],
      zoom: cfg.zoom,
      pitch: cfg.pitch,
      bearing: initialPose.bearingDeg,
    });
    rideInitialized = true;
    emitState();
    startLoop();
  }

  function flyToTourStop(idx) {
    tourIndex = ((idx % REAL_PRESETS.length) + REAL_PRESETS.length) % REAL_PRESETS.length;
    const p = REAL_PRESETS[tourIndex];
    tourPhase = 'flying';
    tourHoldElapsed = 0;
    onSelectPreset(p.id, { fromTour: true });
    emitState();
  }

  function startTour(startIdx = 1) {
    stopAll();
    mode = 'tour';
    tourPaused = false;
    flyToTourStop(startIdx);
    startLoop();
  }

  function toggleTourPause() {
    if (mode !== 'tour') return;
    tourPaused = !tourPaused;
    emitState();
  }

  function nextTourStop() {
    if (mode !== 'tour') return;
    flyToTourStop(tourIndex + 1);
  }

  function startDrone() {
    stopAll();
    mode = 'drone';
    // Tilt into a dramatic low-altitude drone framing if currently flat
    if (map.getPitch() < 55) {
      map.easeTo({ pitch: 66, duration: 500 });
    }
    emitState();
    startLoop();
  }

  function setVirtualDroneInput(partial) {
    Object.assign(virtualInput, partial);
  }

  function tick(ts) {
    if (mode === 'free') return;
    const dt = lastTs > 0 ? Math.min(0.08, Math.max(0.004, (ts - lastTs) / 1000)) : 0.016;
    lastTs = ts;

    if (mode.startsWith('ride-') && rideKind && rideInitialized) {
      const cfg = RIDE_CONFIGS[rideKind];
      const pose = traffic3d.getFollowTarget(rideKind, rideTargetIdx);
      const targetLng = pose.lng + (pose.fx * cfg.leadMeters) / 111160;
      const targetLat = pose.lat - (pose.fz * cfg.leadMeters) / 110574;

      const posAlpha = 1 - Math.exp(-dt * 6.5);
      const angAlpha = 1 - Math.exp(-dt * 2.8);
      smoothLng += (targetLng - smoothLng) * posAlpha;
      smoothLat += (targetLat - smoothLat) * posAlpha;
      smoothBearing = lerpAngleDeg(smoothBearing, pose.bearingDeg, angAlpha);

      map.jumpTo({
        center: [smoothLng, smoothLat],
        bearing: smoothBearing,
        pitch: cfg.pitch,
        zoom: cfg.zoom,
      });

      if (pose.subtitle !== lastRideSubtitle || pose.speedKmh !== lastRideSpeed) {
        lastRideSubtitle = pose.subtitle;
        lastRideSpeed = pose.speedKmh;
        emitState();
      }
    } else if (mode === 'tour') {
      if (!tourPaused) {
        if (tourPhase === 'flying') {
          if (!map.isMoving()) {
            tourPhase = 'orbiting';
            tourHoldElapsed = 0;
          }
        } else {
          tourHoldElapsed += dt;
          // Gentle cinematic slow orbit around current landmark
          map.setBearing((map.getBearing() + dt * 4.5) % 360);
          if (tourHoldElapsed >= TOUR_HOLD_SEC) {
            flyToTourStop(tourIndex + 1);
          }
        }
      }
    } else if (mode === 'drone') {
      const fwdIn =
        (keysDown.has('KeyW') || keysDown.has('ArrowUp') ? 1 : 0) -
        (keysDown.has('KeyS') || keysDown.has('ArrowDown') ? 1 : 0) +
        virtualInput.forward;
      const rightIn =
        (keysDown.has('KeyD') || keysDown.has('ArrowRight') ? 1 : 0) -
        (keysDown.has('KeyA') || keysDown.has('ArrowLeft') ? 1 : 0) +
        virtualInput.right;
      const upIn =
        (keysDown.has('KeyE') || keysDown.has('Space') ? 1 : 0) -
        (keysDown.has('KeyQ') ? 1 : 0) +
        virtualInput.up;
      const turnIn =
        (keysDown.has('KeyC') ? 1 : 0) -
        (keysDown.has('KeyZ') ? 1 : 0) +
        virtualInput.turn;

      const boost = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') ? 2.2 : 1.0;
      const zoom = map.getZoom();
      // Scale speed smoothly with altitude so low flight is nimble and high flight covers distance
      const baseSpeedMps = Math.max(75, Math.min(360, 145 * Math.pow(2, 16 - zoom))) * boost;

      const damp = 1 - Math.exp(-dt * 12.0);
      droneVelFwd += (fwdIn * baseSpeedMps - droneVelFwd) * damp;
      droneVelRight += (rightIn * baseSpeedMps - droneVelRight) * damp;
      droneVelZoom += (-upIn * 1.35 * boost - droneVelZoom) * damp;
      droneVelTurn += (turnIn * 64 * boost - droneVelTurn) * damp;

      if (
        Math.abs(droneVelFwd) > 0.2 ||
        Math.abs(droneVelRight) > 0.2 ||
        Math.abs(droneVelZoom) > 0.002 ||
        Math.abs(droneVelTurn) > 0.05
      ) {
        const c = map.getCenter();
        const bearingRad = (map.getBearing() * Math.PI) / 180;
        // Bearing clockwise from North: North = cos(b), East = sin(b)
        const fwdEast = Math.sin(bearingRad);
        const fwdNorth = Math.cos(bearingRad);
        const rightEast = Math.cos(bearingRad);
        const rightNorth = -Math.sin(bearingRad);

        const moveEastM = (droneVelFwd * fwdEast + droneVelRight * rightEast) * dt;
        const moveNorthM = (droneVelFwd * fwdNorth + droneVelRight * rightNorth) * dt;

        const nextLng = Math.max(BOUNDS.minLng, Math.min(BOUNDS.maxLng, c.lng + moveEastM / 111160));
        const nextLat = Math.max(BOUNDS.minLat, Math.min(BOUNDS.maxLat, c.lat + moveNorthM / 110574));
        const nextZoom = Math.max(13.8, Math.min(18.6, zoom + droneVelZoom * dt));
        const nextBearing = (map.getBearing() + droneVelTurn * dt + 360) % 360;

        map.jumpTo({
          center: [nextLng, nextLat],
          zoom: nextZoom,
          bearing: nextBearing,
        });
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    stopLoop();
    rafId = requestAnimationFrame(tick);
  }

  // Exit Ride-Along or Auto-Tour gracefully if user manually grabs/drags the map
  function onUserDragStart() {
    if (mode.startsWith('ride-') || mode === 'tour') {
      stopAll();
    }
  }
  map.on('dragstart', onUserDragStart);

  // Keyboard listener for Free Drone + Escape to exit any active mode
  function onKeyDown(e) {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.code === 'Escape' && mode !== 'free') {
      stopAll();
      return;
    }
    if (mode === 'drone') {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyZ', 'KeyC', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
        keysDown.add(e.code);
      }
    }
  }

  function onKeyUp(e) {
    keysDown.delete(e.code);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function cleanup() {
    stopAll();
    map.off('dragstart', onUserDragStart);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return {
    startRide,
    startTour,
    toggleTourPause,
    nextTourStop,
    startDrone,
    setVirtualDroneInput,
    stopAll,
    getState,
    cleanup,
  };
}
