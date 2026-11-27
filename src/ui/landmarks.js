export const CAMERA_PRESETS = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Koridor Sungai Musi, Kota Palembang',
    zone: 'Seberang Ilir (Utara) & Seberang Ulu (Selatan)',
    cameraPos: [-18, 166, 346],
    target: [18, 6, -8],
    anchor: [0, 32, 0],
    summary:
      'Diorama padat Kota Palembang yang memadukan Jembatan Ampera, Bundaran Air Mancur, Masjid Agung SMB I, Benteng Kuto Besak, Pasar 16 Ilir, Kantor Walikota, Kambang Iwak, Kampung Kapitan, Stadion Jakabaring, Jembatan Musi IV, dan Pulau Kemaro.',
    note:
      'Jarak antar-kawasan dikompresi secara sengaja agar seluruh jaringan jalan utama, permukiman padat, dan 11 tengara ikonik tetap terbaca harmonis dalam satu bidang pandang.',
  },
  {
    id: 'ampera',
    label: 'Ampera',
    title: 'Jembatan Ampera & Sungai Musi',
    zone: 'Penghubung Seberang Ilir – Seberang Ulu',
    cameraPos: [62, 34, 68],
    target: [-4, 15, 0],
    anchor: [0, 42, 0],
    summary:
      'Ikon merah bata Palembang dengan dua menara portal-H sistem angkat vertikal, rangka baja tengah, kabel penyeimbang, serta lalu lintas perahu ketek dan tongkang di bawahnya.',
    note:
      'Menara baja digambarkan dengan proporsi ketinggian ~3,5× ruang bebas dek (skala nyata: menara ~63 m, bentang utama 75 m, warna merah bata sejak 2002).',
  },
  {
    id: 'masjid-lrt',
    label: 'Bundaran & Masjid',
    title: 'Bundaran Air Mancur, Masjid Agung & Monpera',
    zone: 'Pusat Koridor Jl. Jenderal Sudirman',
    cameraPos: [44, 48, -68],
    target: [-30, 12, -118],
    anchor: [-66, 36, -124],
    summary:
      'Titik nol pusat kota Palembang: Bundaran Air Mancur beranimasi di kaki utara Ampera, Masjid Agung SMB I beratap tumpang tiga tingkat, Monpera, jalur LRT Sumsel, dan deretan ruko Jl. Sudirman.',
    note:
      'Jalur LRT Sumsel melintas dari Stasiun Ampera di utara hingga Stasiun Jakabaring di selatan.',
  },
  {
    id: 'pasar-16',
    label: 'Pasar 16 Ilir',
    title: 'Gedung & Kawasan Pasar 16 Ilir',
    zone: 'Tepian Sungai Musi (Timur Ampera)',
    cameraPos: [28, 32, -8],
    target: [58, 10, -68],
    anchor: [58, 18, -65],
    summary:
      'Pusat niaga bersejarah Palembang di tepian Sungai Musi dengan gedung pasar empat lantai bernuansa krem-terakota, tenda pedagang tepi dermaga, serta kepadatan ruko blok 16 Ilir.',
    note:
      'Terhubung langsung ke dermaga Sungai Musi dan jalan arteri menuju Jembatan Musi IV di sisi timur.',
  },
  {
    id: 'kuto-besak',
    label: 'Kuto Besak',
    title: 'Benteng Kuto Besak, Plaza BKB & Museum SMB II',
    zone: 'Tepian Seberang Ilir (Barat Ampera)',
    cameraPos: [-156, 44, 2],
    target: [-144, 8, -80],
    anchor: [-132, 16, -86],
    summary:
      'Benteng keraton Kesultanan Palembang Darussalam dengan gerbang Lawang Kuto, empat bastion sudut, pelataran Plaza BKB, serta bangunan kolonial Museum Sultan Mahmud Badaruddin II tepat di sisi baratnya.',
    note:
      'Menghadap langsung ke Sungai Musi dengan proporsi denah ~1,6:1 dan dermaga wisata tepi sungai.',
  },
  {
    id: 'walikota-kambang',
    label: 'Walikota & KI',
    title: 'Kantor Walikota (Menara Air) & Taman Kambang Iwak',
    zone: 'Barat Laut Seberang Ilir (Jl. Merdeka)',
    cameraPos: [-74, 62, -106],
    target: [-150, 12, -174],
    anchor: [-154, 38, -138],
    summary:
      'Menara Air kolonial (Gedung Ledeng) Kantor Walikota Palembang berdiri menjulang di Jl. Merdeka, berdampingan dengan ruang terbuka hijau dan danau Taman Kambang Iwak berlintasan jogging.',
    note:
      'Kambang Iwak menjadi paru-paru hijau kota yang dikelilingi pepohonan rindang dan permukiman padat.',
  },
  {
    id: 'kampung-kapitan',
    label: 'Kampung Kapitan',
    title: 'Kampung Kapitan & Permukiman 7 Ulu',
    zone: 'Tepian Seberang Ulu (Barat Ampera)',
    cameraPos: [-52, 28, 6],
    target: [-82, 8, 60],
    anchor: [-78, 15, 58],
    summary:
      'Kawasan cagar budaya tepi Sungai Musi di 7 Ulu dengan gapura merah, rumah panggung kembar perpaduan arsitektur Tionghoa–Palembang, dermaga kayu, dan gugus Rumah Limas tradisional.',
    note:
      'Terhubung ke Jl. Jenderal Ahmad Yani dan kawasan permukiman padat Seberang Ulu di belakangnya.',
  },
  {
    id: 'jakabaring',
    label: 'Jakabaring',
    title: 'Stadion Gelora Sriwijaya & Stasiun LRT Jakabaring',
    zone: 'Seberang Ulu Selatan (Jl. Gub. H. Bastari)',
    cameraPos: [-40, 64, 114],
    target: [48, 12, 184],
    anchor: [58, 34, 184],
    summary:
      'Kompleks olahraga kebanggaan Sumatera Selatan dengan atap lengkung kembar, lapangan sepak bola & trek atletik, empat menara lampu sorot yang menyala di malam hari, serta Stasiun LRT Jakabaring.',
    note:
      'Berfungsi sebagai jangkar urban selatan yang dihubungkan langsung oleh Jl. Gubernur H. Bastari dan koridor LRT Sumsel.',
  },
  {
    id: 'musi-iv',
    label: 'Jembatan Musi IV',
    title: 'Jembatan Musi IV (Cable-Stayed)',
    zone: 'Hilir Timur Sungai Musi',
    cameraPos: [48, 40, 74],
    target: [122, 16, 4],
    anchor: [120, 44, 5],
    summary:
      'Jembatan modern berpilon putih kembar dengan kabel kipas perak dan pita LED malam hari yang menghubungkan koridor 16 Ilir/Veteran dengan Seberang Ulu timur tanpa mengganggu alur pelayaran.',
    note:
      'Pilon ditempatkan di tepi alur pelayaran agar seluruh tongkang batu bara dan perahu ketek melintas bebas.',
  },
  {
    id: 'pulau-kemaro',
    label: 'Pulau Kemaro',
    title: 'Pulau Kemaro & Pagoda 9 Lantai',
    zone: 'Hilir Sungai Musi (Timur Musi IV)',
    cameraPos: [164, 28, 56],
    target: [214, 14, 4],
    anchor: [203, 36, 4.5],
    summary:
      'Pulau delta di hilir Sungai Musi dengan Pagoda oktagonal merah-emas sembilan tingkat, kompleks Klenteng Hok Tjing Rio, rimbunan Pohon Cinta, dan dermaga kayu.',
    note:
      'Posisi pulau ditarik lebih dekat ke timur Jembatan Musi IV pada skala diorama agar tetap dapat dijangkau dalam satu peta.',
  },
];

export const SCENE_PINS = [
  { id: 'ampera', label: 'Jembatan Ampera', position: [0, 46, 0] },
  { id: 'bam', presetId: 'masjid-lrt', label: 'Bundaran Air Mancur', position: [0, 14, -124] },
  { id: 'masjid-lrt', label: 'Masjid Agung SMB I', position: [-66, 38, -124] },
  { id: 'monpera', presetId: 'masjid-lrt', label: 'Monpera', position: [-48, 23, -72] },
  { id: 'pasar-16', label: 'Pasar 16 Ilir', position: [58, 20, -65] },
  { id: 'kuto-besak', label: 'Benteng Kuto Besak', position: [-132, 16, -86] },
  { id: 'museum-smb', presetId: 'kuto-besak', label: 'Museum SMB II', position: [-188, 15, -68] },
  { id: 'walikota-kambang', label: 'Kantor Walikota', position: [-154, 40, -138] },
  { id: 'kambang-iwak', presetId: 'walikota-kambang', label: 'Kambang Iwak', position: [-148, 12, -206] },
  { id: 'kampung-kapitan', label: 'Kampung Kapitan', position: [-78, 16, 58] },
  { id: 'jakabaring', label: 'Gelora Sriwijaya Jakabaring', position: [58, 34, 184] },
  { id: 'musi-iv', label: 'Jembatan Musi IV', position: [120, 45, 4] },
  { id: 'pulau-kemaro', label: 'Pulau Kemaro', position: [203, 39, 4.5] },
  { id: 'lrt', presetId: 'masjid-lrt', label: 'LRT Sumsel', position: [-22, 22, 34] },
];
