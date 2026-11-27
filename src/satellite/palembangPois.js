// Curated 20-location Palembang POI catalog (10 Landmarks + 6 Culinary Icons + 4 LRT Stations)
// + Persistent Explorer Passport (localStorage) for Phase 2.
import { REAL_PRESETS } from './realLandmarks.js';

const PRESET_BY_ID = new Map(REAL_PRESETS.map((p) => [p.id, p]));

function fromPreset(id, signature) {
  const p = PRESET_BY_ID.get(id);
  return {
    id: p.id,
    presetId: p.id,
    category: 'landmark',
    label: p.label,
    title: p.title,
    zone: p.zone,
    center: p.center,
    zoom: p.zoom,
    pitch: p.pitch,
    bearing: p.bearing,
    signature,
    summary: p.summary,
    note: p.note,
  };
}

export const POI_CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'landmark', label: 'Landmark' },
  { id: 'kuliner', label: 'Kuliner' },
  { id: 'lrt', label: 'Stasiun LRT' },
];

export const PALEMBANG_POIS = [
  // --- 10 Landmarks ---
  fromPreset('ampera', 'Ikon Kota · Menara 66 m'),
  fromPreset('masjid-lrt', 'Masjid Bersejarah & Titik Nol'),
  {
    id: 'monpera',
    category: 'landmark',
    label: 'Monpera',
    title: 'Monumen Perjuangan Rakyat (Monpera)',
    zone: '2.9897° S, 104.7607° E · Jl. Merdeka',
    center: [104.76070, -2.98970],
    zoom: 17.4,
    pitch: 62,
    bearing: 20,
    signature: 'Monumen Melati 5 Kelopak · Pertempuran 5 Hari 5 Malam',
    summary:
      'Monumen berbentuk bunga melati bermahkota lima kelopak yang mengenang perjuangan rakyat Sumatera Selatan dalam Pertempuran Lima Hari Lima Malam (1947). Berada persis di antara Masjid Agung dan Benteng Kuto Besak.',
    note: 'Di sekeliling taman Monpera terdapat meriam peninggalan sejarah dan jalur pedestrian menuju Plaza BKB.',
  },
  fromPreset('pasar-16', 'Pasar Tepi Sungai Bersejarah'),
  fromPreset('kuto-besak', 'Benteng Kesultanan · Plaza Musi'),
  fromPreset('walikota-kambang', 'Gedung Ledeng & Danau Taman'),
  fromPreset('kampung-kapitan', 'Cagar Budaya Tepi 7 Ulu'),
  fromPreset('jakabaring', 'Kompleks Olahraga Internasional'),
  fromPreset('musi-iv', 'Jembatan Cable-Stayed Modern'),
  fromPreset('pulau-kemaro', 'Delta Musi · Pagoda 9 Lantai'),

  // --- 6 Legendary Palembang Culinary Spots ---
  {
    id: 'kuliner-pempek-candy',
    category: 'kuliner',
    label: 'Pempek Candy',
    title: 'Pempek Candy (Jl. Jenderal Sudirman)',
    zone: '2.9745° S, 104.7528° E · Ilir Timur I',
    center: [104.75280, -2.97445],
    zoom: 17.5,
    pitch: 60,
    bearing: -15,
    signature: 'Pempek Kapal Selam · Lenjer · Cuko Pedas Manis',
    summary:
      'Salah satu gerai pempek paling terkenal di Palembang sejak 1994, berada di koridor utama Jl. Jenderal Sudirman. Terkenal dengan tekstur ikan tenggiri/belida yang padat dan kuah cuko kental khas Palembang.',
    note: 'Dekat koridor LRT Sumsel; cocok dijadikan oleh-oleh paket vakum maupun santap langsung di tempat.',
  },
  {
    id: 'kuliner-pempek-vico',
    category: 'kuliner',
    label: 'Pempek Vico',
    title: 'Pempek Vico (Jl. Letkol Iskandar)',
    zone: '2.9846° S, 104.7534° E · Seberang PIM',
    center: [104.75335, -2.98462],
    zoom: 17.5,
    pitch: 60,
    bearing: 18,
    signature: 'Pempek Panggang · Adaan · Es Kacang Merah',
    summary:
      'Favorit warga lokal maupun wisatawan di depan Palembang Indah Mall. Selain pempek kapal selam dan adaan renyah, sajian pempek panggang isi ebi dan Es Kacang Merah di sini selalu jadi buruan.',
    note: 'Hanya ~900 meter dari Stasiun LRT Cinde dan Masjid Agung SMB I.',
  },
  {
    id: 'kuliner-kampung-pempek',
    category: 'kuliner',
    label: 'Kampung Pempek 26 Ilir',
    title: 'Sentra Kampung Pempek 26 Ilir (Jl. Mujahidin)',
    zone: '2.9895° S, 104.7554° E · 26 Ilir',
    center: [104.75540, -2.98950],
    zoom: 17.6,
    pitch: 60,
    bearing: -25,
    signature: 'Puluhan Kedai Pempek Rumahan · Pempek Kulit & Lenggang',
    summary:
      'Koridor kuliner legendaris di belakang Jl. Merdeka tempat deretan puluhan kedai pempek rumahan berjejer rapat. Pengunjung dapat mencicipi pempek kulit, lenggang panggang, tekwan, dan model dengan harga bersahabat.',
    note: 'Jarak jalan kaki ~5 menit dari Kantor Walikota Palembang dan Benteng Kuto Besak.',
  },
  {
    id: 'kuliner-martabak-har',
    category: 'kuliner',
    label: 'Martabak HAR',
    title: 'Martabak HAR (Masjid Agung · Sudirman)',
    zone: '2.9867° S, 104.7604° E · Titik Nol Sudirman',
    center: [104.76042, -2.98669],
    zoom: 17.6,
    pitch: 60,
    bearing: -10,
    signature: 'Martabak Telur Bebek · Kuah Kari Kentang & Kecap Cabai',
    summary:
      'Ikon kuliner Palembang sejak 1947 yang didirikan Haji Abdul Rozak (HAR) tepat di seberang Masjid Agung. Martabak tipis isi telur ayam/bebek disiram kuah kari kentang gurih berempah dan acar cabai rawit kecap.',
    note: 'Buka hingga larut malam — sangat pas dikunjungi setelah menikmati lampu malam Jembatan Ampera.',
  },
  {
    id: 'kuliner-mie-celor',
    category: 'kuliner',
    label: 'Mie Celor 26 Ilir',
    title: 'Mie Celor 26 Ilir H.M. Syafei Z',
    zone: '2.9879° S, 104.7544° E · Jl. K.H. Ahmad Dahlan',
    center: [104.75440, -2.98790],
    zoom: 17.6,
    pitch: 60,
    bearing: 12,
    signature: 'Mie Telur Kuah Santan Kaldu Udang · Telur Rebus & Kucai',
    summary:
      'Sarapan khas Palembang yang legendaris: mie kuning tebal yang dicelup (*dicelor*) ke air panas, lalu disiram kuah santan kental kaldu udang/ebi, tauge, irisan telur rebus, bawang goreng, dan daun kucai segar.',
    note: 'Paling ramai di pagi hari sebelum pukul 10.00 WIB.',
  },
  {
    id: 'kuliner-riverside-bkb',
    category: 'kuliner',
    label: 'River Side BKB',
    title: 'River Side Restaurant (Plaza Benteng Kuto Besak)',
    zone: '2.9935° S, 104.7588° E · Tepian Sungai Musi',
    center: [104.75884, -2.99355],
    zoom: 17.5,
    pitch: 62,
    bearing: 42,
    signature: 'Pindang Patin · Pindang Tulang · Panorama Langsung Ampera',
    summary:
      'Restoran ikonik berbentuk kapal di tepian Sungai Musi kawasan Plaza BKB. Menyajikan pindang patin segar, pindang tulang iga, dan ikan baung bakar sembari memandang langsung cahaya senja dan malam Jembatan Ampera.',
    note: 'Coba ganti suasana ke Senja atau Malam untuk nuansa makan malam tepi Sungai Musi.',
  },

  // --- 4 Core South Sumatra LRT Stations (exact OSM coordinates) ---
  {
    id: 'lrt-ampera',
    category: 'lrt',
    label: 'St. LRT Ampera',
    title: 'Stasiun LRT Ampera',
    zone: '2.9890° S, 104.7620° E · Koridor LRT Sumsel',
    center: [104.76197, -2.98902],
    zoom: 17.5,
    pitch: 64,
    bearing: 36,
    signature: 'Stasiun Pusat · Akses Ampera, Pasar 16 Ilir & Masjid Agung',
    summary:
      'Stasiun tersibuk di jaringan LRT Sumatera Selatan (LRT pertama di Indonesia). Terletak tepat di sisi utara Jembatan Ampera, terintegrasi langsung dengan kawasan Pasar 16 Ilir, Bundaran Air Mancur, dan Plaza BKB.',
    note: 'Gunakan tombol "Naik LRT Sumsel" di tab Naik & Tur untuk ikut melintas di atas Sungai Musi.',
  },
  {
    id: 'lrt-cinde',
    category: 'lrt',
    label: 'St. LRT Cinde',
    title: 'Stasiun LRT Cinde',
    zone: '2.9807° S, 104.7561° E · Jl. Jenderal Sudirman',
    center: [104.75610, -2.98074],
    zoom: 17.4,
    pitch: 62,
    bearing: -22,
    signature: 'Gerbang Pasar Cinde & Koridor Kuliner Sudirman',
    summary:
      'Melayani pusat perdagangan Cinde, kawasan perkantoran Jl. Jenderal Sudirman, serta dekat menuju destinasi kuliner Pempek Vico, Palembang Indah Mall, dan Pempek Candy.',
    note: 'Bagian dari 13 stasiun LRT Sumsel sepanjang ~23,4 km dari Bandara SMB II hingga DJKA.',
  },
  {
    id: 'lrt-polresta',
    category: 'lrt',
    label: 'St. LRT Polresta',
    title: 'Stasiun LRT Polresta',
    zone: '3.0051° S, 104.7725° E · Jl. Gubernur H. Bastari',
    center: [104.77247, -3.00508],
    zoom: 17.3,
    pitch: 62,
    bearing: 145,
    signature: 'Koridor Seberang Ulu · Penghubung Ampera – Jakabaring',
    summary:
      'Stasiun layang pertama di sisi Seberang Ulu setelah kereta LRT menyeberangi Sungai Musi dari Stasiun Ampera, melayani kawasan perkantoran dan akses menuju Jakabaring.',
    note: 'Tepat di sepanjang Jl. Gubernur H. Bastari dengan arus lalu lintas 2 arah yang ramai.',
  },
  {
    id: 'lrt-jakabaring',
    category: 'lrt',
    label: 'St. LRT Jakabaring',
    title: 'Stasiun LRT Jakabaring',
    zone: '3.0231° S, 104.7846° E · Jakabaring Sport City',
    center: [104.78459, -3.02315],
    zoom: 17.0,
    pitch: 62,
    bearing: 32,
    signature: 'Gerbang Stadion Gelora Sriwijaya & JSC',
    summary:
      'Akses transportasi massal utama menuju Stadion Gelora Sriwijaya, Danau Dayung Jakabaring, dan pusat perbelanjaan OPI Mall di kawasan Seberang Ulu selatan.',
    note: 'Dibangun menyongsong Asian Games 2018 untuk menghubungkan bandara langsung ke kawasan olahraga Jakabaring.',
  },
];

const STORAGE_KEY = 'palembang_3d_passport_v1';

export function createPassportStore() {
  const validIds = new Set(PALEMBANG_POIS.map((p) => p.id));
  const culinaryIds = PALEMBANG_POIS.filter((p) => p.category === 'kuliner').map((p) => p.id);
  const visited = new Set();

  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const id of parsed) {
          if (validIds.has(id)) visited.add(id);
        }
      }
    }
  } catch {
    // Ignore storage unavailability in strict private/sandboxed contexts
  }

  function persist() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...visited]));
    } catch {}
  }

  function markVisited(id) {
    if (!validIds.has(id) || visited.has(id)) return false;
    visited.add(id);
    persist();
    return true;
  }

  function reset() {
    visited.clear();
    persist();
  }

  function getSummary() {
    const count = visited.size;
    const total = PALEMBANG_POIS.length;
    const allKuliner = culinaryIds.every((id) => visited.has(id));
    let rank = 'Wisatawan Baru';
    if (count >= total) rank = 'Duta Palembang 3D';
    else if (allKuliner) rank = 'Master Kuliner Pempek';
    else if (count >= 12) rank = 'Kapten Sungai Musi';
    else if (count >= 6) rank = 'Penjelajah Sriwijaya';
    else if (count >= 2) rank = 'Penjelajah Pemula';

    return Object.freeze({
      visitedCount: count,
      total,
      percent: Math.round((count / total) * 100),
      rank,
      allKuliner,
      visitedIds: Object.freeze([...visited]),
    });
  }

  return {
    markVisited,
    isVisited: (id) => visited.has(id),
    reset,
    getSummary,
  };
}
