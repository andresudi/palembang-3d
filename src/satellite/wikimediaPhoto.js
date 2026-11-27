// v3.0 Wikimedia / Wikipedia Real Landmark & Culinary Photo Fetcher + Fullscreen Lightbox
// 100% Free, Zero API Key, In-Memory Cached, Graceful Hide if Offline/Missing.

const WIKI_SLUGS = {
  ampera: [
    ['id', 'Jembatan_Ampera'],
    ['en', 'Ampera_Bridge'],
  ],
  'masjid-lrt': [
    ['id', 'Masjid_Agung_Palembang'],
    ['en', 'Great_Mosque_of_Palembang'],
  ],
  monpera: [
    ['id', 'Monumen_Perjuangan_Rakyat_(Palembang)'],
    ['en', 'Palembang'],
  ],
  'pasar-16': [],
  'kuto-besak': [
    ['id', 'Benteng_Kuto_Besak'],
    ['en', 'Kuto_Besak'],
  ],
  'walikota-kambang': [
    ['id', 'Kantor_Wali_Kota_Palembang'],
  ],
  'kampung-kapitan': [],
  jakabaring: [
    ['en', 'Gelora_Sriwijaya_Stadium'],
    ['id', 'Stadion_Gelora_Sriwijaya'],
  ],
  'musi-iv': [],
  'pulau-kemaro': [
    ['id', 'Pulau_Kemaro'],
    ['en', 'Kemaro_Island'],
  ],
  'tugu-belido': [
    ['id', 'Benteng_Kuto_Besak'],
  ],
  'kambang-iwak': [],
  'danau-dayung': [
    ['id', 'Jakabaring_Sport_City'],
    ['en', 'Gelora_Sriwijaya_Stadium'],
  ],
  'musi-vi': [],
  'masjid-cheng-ho': [],
  'bukit-siguntang': [
    ['id', 'Bukit_Siguntang'],
    ['en', 'Bukit_Seguntang'],
  ],
  'kuliner-pempek-candy': [
    ['id', 'Pempek'],
    ['en', 'Pempek'],
  ],
  'kuliner-pempek-vico': [
    ['id', 'Pempek'],
    ['en', 'Pempek'],
  ],
  'kuliner-kampung-pempek': [
    ['id', 'Pempek'],
    ['en', 'Pempek'],
  ],
  'kuliner-martabak-har': [
    ['en', 'Murtabak'],
    ['id', 'Martabak'],
  ],
  'kuliner-mie-celor': [
    ['en', 'Mie_celor'],
    ['id', 'Mie_celor'],
  ],
  'kuliner-riverside-bkb': [
    ['id', 'Benteng_Kuto_Besak'],
    ['en', 'Pindang'],
  ],
  'lrt-ampera': [
    ['id', 'LRT_Sumatera_Selatan'],
    ['en', 'Palembang_LRT'],
  ],
  'lrt-cinde': [
    ['id', 'LRT_Sumatera_Selatan'],
    ['en', 'Palembang_LRT'],
  ],
  'lrt-polresta': [
    ['id', 'LRT_Sumatera_Selatan'],
    ['en', 'Palembang_LRT'],
  ],
  'lrt-jakabaring': [
    ['id', 'LRT_Sumatera_Selatan'],
    ['en', 'Palembang_LRT'],
  ],
  // 5 Historical Eras
  'era-sriwijaya': [
    ['id', 'Sriwijaya'],
    ['en', 'Srivijaya'],
  ],
  'era-kesultanan': [
    ['id', 'Benteng_Kuto_Besak'],
    ['en', 'Kuto_Besak'],
  ],
  'era-kolonial': [
    ['id', 'Kantor_Wali_Kota_Palembang'],
    ['en', 'Palembang'],
  ],
  'era-ampera': [
    ['id', 'Jembatan_Ampera'],
    ['en', 'Ampera_Bridge'],
  ],
  'era-modern': [
    ['id', 'LRT_Sumatera_Selatan'],
    ['en', 'Palembang_LRT'],
  ],
};

const photoCache = new Map();

export async function fetchWikimediaPhoto(itemId) {
  if (!itemId) return null;
  if (photoCache.has(itemId)) return photoCache.get(itemId);

  const candidates = WIKI_SLUGS[itemId];
  if (!candidates || candidates.length === 0) {
    photoCache.set(itemId, null);
    return null;
  }

  for (const [lang, slug] of candidates) {
    try {
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      if (!res.ok) continue;
      const json = await res.json();
      const thumbUrl = json?.thumbnail?.source;
      const fullUrl = json?.originalimage?.source || thumbUrl;
      if (thumbUrl) {
        const record = {
          itemId,
          thumbUrl,
          fullUrl,
          title: json.title || slug.replace(/_/g, ' '),
          pageUrl: json?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${slug}`,
          attribution: 'Wikimedia Commons / Wikipedia',
        };
        photoCache.set(itemId, record);
        return record;
      }
    } catch {
      // Try next fallback slug cleanly
    }
  }

  photoCache.set(itemId, null);
  return null;
}

export function createPhotoLightbox({ i18n }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop hidden';
  backdrop.dataset.photoLightbox = 'true';

  const card = document.createElement('div');
  card.className = 'lightbox-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.innerHTML = `
    <div class="lightbox-head">
      <strong data-lb-title></strong>
      <button type="button" class="drawer-close" data-lb-close>Tutup</button>
    </div>
    <div class="lightbox-img-wrap">
      <img data-lb-img alt="" />
    </div>
    <div class="lightbox-foot">
      <span data-lb-attr>Wikimedia Commons / Wikipedia</span>
      <a class="gmaps-link" data-lb-link target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>
    </div>
  `;
  backdrop.appendChild(card);

  const titleEl = card.querySelector('[data-lb-title]');
  const closeBtn = card.querySelector('[data-lb-close]');
  const imgEl = card.querySelector('[data-lb-img]');
  const attrEl = card.querySelector('[data-lb-attr]');
  const linkEl = card.querySelector('[data-lb-link]');

  let isOpen = false;

  function close() {
    isOpen = false;
    backdrop.classList.add('hidden');
  }

  function open(photo, displayTitle) {
    if (!photo?.fullUrl) return;
    isOpen = true;
    titleEl.textContent = displayTitle || photo.title;
    closeBtn.textContent = i18n.t('close');
    imgEl.src = photo.fullUrl;
    imgEl.alt = displayTitle || photo.title;
    attrEl.textContent = `Foto: ${photo.attribution}`;
    linkEl.href = photo.pageUrl;
    backdrop.classList.remove('hidden');
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  function onKey(e) {
    if (e.code === 'Escape' && isOpen) close();
  }
  window.addEventListener('keydown', onKey);

  return {
    el: backdrop,
    open,
    close,
    isOpen: () => isOpen,
    cleanup() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
