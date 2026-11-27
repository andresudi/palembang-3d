// Thin code-split shell — dynamically loads either Real Satellite 3D or Offline PBR Diorama
import './style.css';

const rootEl = document.getElementById('app');

function showWebGLFallback(reason) {
  rootEl.innerHTML = `
    <div class="webgl-fallback" role="alert">
      <h2>Konteks WebGL tidak tersedia</h2>
      <p>Peramban atau lingkungan grafis Anda tidak berhasil menginisialisasi WebGL untuk merender visualisasi 3D Kota Palembang.</p>
      <p class="fallback-detail">Detail teknis: ${String(reason || 'WebGL context creation failed')}</p>
      <p>Coba aktifkan akselerasi perangkat keras di pengaturan peramban atau jalankan dengan Chrome/Safari versi terbaru.</p>
    </div>
  `;
}

let activeCleanup = null;
let switchToken = 0;

async function switchMode(mode) {
  const next = mode === 'diorama' ? 'diorama' : 'satellite';
  const myToken = ++switchToken;

  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  rootEl.dataset.ready = 'false';
  rootEl.innerHTML = `
    <div class="boot-loader" role="status" aria-live="polite">
      <div class="boot-spinner" aria-hidden="true"></div>
      <span>Memuat ${next === 'diorama' ? 'Diorama 3D' : 'Palembang Satelit 3D'}...</span>
    </div>
  `;

  const url = new URL(window.location.href);
  url.searchParams.set('mode', next);
  window.history.replaceState({}, '', url.toString());

  if (next === 'diorama') {
    const { mountDiorama } = await import('./dioramaEntry.js');
    if (myToken !== switchToken) return;
    activeCleanup = mountDiorama({ rootEl, onSwitchMode: switchMode, showWebGLFallback });
  } else {
    const { mountRealPalembangMap } = await import('./satellite/realPalembangMap.js');
    if (myToken !== switchToken) return;
    activeCleanup = mountRealPalembangMap({
      rootEl,
      onSwitchMode: switchMode,
      showWebGLFallback,
    });
  }
}

const initialMode = new URLSearchParams(window.location.search).get('mode') === 'diorama' ? 'diorama' : 'satellite';
switchMode(initialMode);

// Register lightweight PWA Service Worker in production builds
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
